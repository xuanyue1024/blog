---
author: 竹林听雨
tags:
  - CDN
  - 服务器
title: 记一次Azure Front Door CDN部署经过
sticky: 101
abbrlink: c2317431
published: 2026-01-19 23:01:38
updated: 2026-01-19 23:01:38
---
我有一个运行在本地或云服务器上的 Web 应用（`http://127.0.0.1:8088`），希望通过以下方式对外提供服务：

- 域名：`a.b.com`
- 使用 **Azure Front Door** 作为全球 CDN 加速节点
- 启用 HTTPS（免费自动签发证书）
- 源站使用 Nginx 反向代理

但在实际操作中：

- 自定义域名访问报 **证书错误**
- 浏览器提示 **HSTS 安全拦截**
- 不确定 Nginx 如何配置回源

## 配置步骤

<img src="./assets/cdn.svg" alt="CDN Animation" />

### 步骤 1：在 Cloudflare 配置 DNS

确保 DNS 记录正确：

| Name    | Type  | Target                           |
| ------- | ----- | -------------------------------- |
| a.b.com | CNAME | `e-d6gafsdfc5aa.z03.azurefd.net` |
相当于是用户在访问原本服务器的时候，其实是通过我的域名解析到了CDN的域名，然后CDN查看缓存，如果存在缓存的话就直接返回，不经过服务器，如果不存在缓存。那就回源到服务器。然后再通过CDN返回给用户。

### 步骤 2：在 Azure Front Door 添加自定义域名

1. 进入 Azure Portal → 你的 Front Door 资源
2. 点击 **“域”**
3. 点击 **“+ 添加域”**
4. 填写：
    - **主机名**：`a.b.com`
    - **启用 HTTPS**
    - **证书类型**：**Managed certificate**（免费自动签发）
5. 点击 **添加**

### 步骤 3：完成域名所有权验证

Azure 会要求你添加一条 **TXT 记录** 到 DNS：

- **Name**: `_acme-challenge.ecode`
- **Value**: `xxxxxxxxxxxxxxxxxxxxxx`

在 Cloudflare 中添加该记录（类型 TXT），保存后等待 Azure 自动检测。

>  验证工具：
>  dns解析生效检测 https://dnschecker.org/
>  证书验证 https://www.ssllabs.com/ssltest/analyze.html?d=



### 步骤 4：检查路由规则是否关联域名

1. 进入 **“路由规则”**
2. 编辑你的规则
3. 在 **“前端主机”** 中，**必须勾选 `a.b.com`**
    - 如果只勾了默认域名（`xxx.azurefd.net`），自定义域名将被忽略！


## Nginx 源站配置（仅用于回源）

因为 Azure Front Door 已处理 HTTPS，**Nginx 只需监听 HTTP（80 端口）**，无需证书。

### 推荐配置：

```nginx
# /etc/nginx/sites-available/origin.b.com
server {
    listen 80;
    server_name origin.b.com;

    # 安全：只允许 Azure Front Door IP 访问
    include /etc/nginx/azure-fd-ips.conf;

    location / {
        proxy_pass http://127.0.0.1:8088/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 禁止直接 IP 访问（防探测）
    server_tokens off;
}

# 默认 server：拦截 IP 直连
server {
    listen 80 default_server;
    return 444;  # 直接关闭连接
}
```

---

## 如何获取 Azure Front Door 的出站 IP 范围？

微软官方每周更新 IP 列表：

 [https://www.microsoft.com/en-us/download/details.aspx?id=56519](https://www.microsoft.com/en-us/download/details.aspx?id=56519)

### 获取步骤：

1. 下载 `ServiceTags_Public_*.json`
2. 搜索 `"name": "AzureFrontDoor"`
3. 提取 `addressPrefixes` 中的所有 CIDR

示例（截至 2024 年）：

```nginx
# /etc/nginx/azure-fd-ips.conf
allow 147.243.0.0/16;
allow 52.142.0.0/15;
allow 2a01:4f8::/32;
allow 2a01:4180::/32;
deny all;
```

> 建议每季度更新一次


## 如何防止源站 IP 泄露？

即使使用 CDN，仍需防范以下泄露途径：

|风险点|防护措施|
|---|---|
|历史 DNS 记录|避免早期直接解析到 IP|
|SSL 证书绑定主域名|源站只用 `origin.xxx.com`|
|子域名未走 CDN|所有子域名接入 CDN 或删除|
|直接 IP 访问|Nginx 返回 `444`|
|响应头泄露|删除 `Server`、`X-Powered-By`|

自查工具：

- [https://securitytrails.com/](https://securitytrails.com/)
- [https://dnsdumpster.com/](https://dnsdumpster.com/)

 
## 误区：为什么“能访问默认域名，但不能访问自定义域名”？

发现：

```bash
# 能正常访问
curl https://ecode-d6gaewa5aa.z03.azurefd.net

# 但访问自定义域名失败
curl https://a.b.com  # 报证书错误
```

### 根本原因：

Azure Front Door **不会自动识别你的自定义域名**。即使 DNS 已 CNAME 到 `*.azurefd.net`，如果你**没有在 Azure Portal 中显式添加该域名作为“前端主机”**，Azure 就会返回一个默认的共享证书（如 `*.azurefd.net` 或 `*.azureedge.net`）。

浏览器看到证书是 `*.azurefd.net`，但你访问的是 `a.b.com` → **证书域名不匹配** → 拦截连接。

>  结论：**DNS 告诉流量“去哪”，Azure 配置告诉服务器“认谁”。两者缺一不可。**

## 常用命令

```bash
# 测试回源
curl -H "Host: origin.b.com" http://127.0.0.1

# 检查证书（绕过本地代理）
curl -UseBasicParsing -NoProxy https://a.b.com

# 查看 DNS 解析
nslookup a.b.com

# 清除 HSTS（Chrome/Edge）
chrome://net-internals/#hsts
```


