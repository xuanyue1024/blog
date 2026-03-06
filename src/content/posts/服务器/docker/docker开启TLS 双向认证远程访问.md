---
author: 竹林听雨
tags:
  - docker
  - 远程
  - 服务器
  - Ubuntu
title: docker开启TLS 双向认证远程访问
abbrlink: 21e1bce7
published: 2025-08-30 00:00:00
---
##  **整体思路**

- 远程服务器上运行 Docker API，通过 `2376` 端口对外暴露，并开启 TLS 双向认证。
- 服务端证书绑定 **远程服务器 IP 或域名**。
- 客户端证书仅用于认证，不绑定 IP，所以客户端 IP 可变。
- 推荐使用 **域名**（固定或动态 DNS），防止 IP 变动导致证书不匹配。

## 1.在远程服务器生成证书

生成：
- **CA 证书**：用于签发服务端和客户端证书
- **服务端证书**：给 Docker Daemon
- **客户端证书**：给你的本地电脑
    
### **1.1 创建证书目录**

```bash
mkdir -p /etc/docker/certs
cd /etc/docker/certs
```

### **1.2 生成 CA**

```bash
# 生成 CA 私钥（输入密码）
openssl genrsa -aes256 -out ca-key.pem 4096

# 生成 CA 根证书
openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem
```

> `Common Name` 可以填 `My Docker CA`。

### **1.3 生成服务端证书**

关键点：SAN 必须包含 **服务器的公网 IP 或域名**（推荐域名）。

```bash
# 服务端私钥
openssl genrsa -out server-key.pem 4096

# 服务端 CSR
openssl req -subj "/CN=docker-server" -new -key server-key.pem -out server.csr

# 扩展文件（SAN 配置）
echo subjectAltName = IP:203.0.XXX.10,DNS:docker.myserver.com > extfile.cnf

#如果只有ip，上方配置可以写成
echo subjectAltName = IP:1XX.XX.XX0.XX,IP:10.0.0.5 > extfile.cnf

# 签发服务端证书
openssl x509 -req -days 365 -sha256 \
  -in server.csr \
  -CA ca.pem -CAkey ca-key.pem -CAcreateserial \
  -out server-cert.pem \
  -extfile extfile.cnf
```
### **1.4 生成客户端证书**

```bash
# 客户端私钥
openssl genrsa -out key.pem 4096

# 客户端 CSR
openssl req -subj '/CN=client' -new -key key.pem -out client.csr

# 客户端扩展文件（声明 clientAuth）
echo extendedKeyUsage = clientAuth > extfile-client.cnf

# 签发客户端证书
openssl x509 -req -days 365 -sha256 \
  -in client.csr \
  -CA ca.pem -CAkey ca-key.pem -CAcreateserial \
  -out cert.pem \
  -extfile extfile-client.cnf
```

### **最终文件分布**

- 服务端：
    - `/etc/docker/certs/ca.pem`
    - `/etc/docker/certs/server-cert.pem`
    - `/etc/docker/certs/server-key.pem`
        
- 客户端：
    - `ca.pem`、`cert.pem`、`key.pem`
        
## 2.配置 Docker Daemon

编辑 **`/usr/lib/systemd/system/docker.service`**：

```service
ExecStart=/usr/bin/dockerd \
  -H unix:///var/run/docker.sock \
  -H tcp://0.0.0.0:5489 \
  --tlsverify \
  --tlscacert=/etc/docker/certs/ca.pem \
  --tlscert=/etc/docker/certs/server-cert.pem \
  --tlskey=/etc/docker/certs/server-key.pem \
  --containerd=/run/containerd/containerd.sock
```

重启 Docker：

```bash
systemctl daemon-reload
systemctl restart docker
```

确认 Docker 在 `5489` 端口监听：

```bash
netstat -tulnp | grep 5489
```

## 3.客户端配置（本地电脑)

把这三个文件复制到本地，例如 `~/.docker/certs/`：
- `ca.pem`
- `cert.pem`
- `key.pem`

设置环境变量：

```bash
DOCKER_HOST=tcp://192.168.1.100:5489
DOCKER_TLS_VERIFY=1
DOCKER_CERT_PATH=D:\SoftDate\Develop\Docker\certs
```

测试连接：

```bash
docker info
```

或者显式指定：

```bash
docker --tlsverify \
  --tlscacert=~/.docker/certs/ca.pem \
  --tlscert=~/.docker/certs/cert.pem \
  --tlskey=~/.docker/certs/key.pem \
  -H=tcp://docker.myserver.com:5489 info
```

## **注意事项**
            
 **防火墙要放行 2376 端口**
    
    ```bash
    ufw allow 5489/tcp
    ```
    
**限制来源 IP**（安全）
    
    ```bash
    ufw allow from <你的本地 IP>/32 to any port 2376 proto tcp
    ```
    
**客户端 IP 可变没关系**，因为客户端证书不绑定 IP。
## TLS 原理

Docker 远程 API 默认是 **HTTP**，如果直接暴露 TCP 端口，没有认证和加密，任何能访问这个端口的人都可以 **完全控制 Docker**，相当于 root 权限。

TLS（Transport Layer Security）在 Docker 中的作用：
1. **加密通信**
    - 客户端和服务端之间的数据通过 TLS 加密，防止中间人监听。
    - 即使在公共网络，也不会泄露镜像名、命令或敏感信息。
        
2. **身份验证（认证）**
    - **服务端验证客户端证书**：通过 `--tlsverify`，服务端只允许受信任的客户端连接。
    - **客户端验证服务端证书**：客户端验证服务器证书，防止连接到伪造的 Docker 服务。
        
3. **完整性保护**
    - TLS 可以保证数据在传输过程中未被篡改。

## Docker TLS 的实现方式

- **服务端**：
    - `dockerd --tlsverify --tlscacert=ca.pem --tlscert=server-cert.pem --tlskey=server-key.pem`
    - 开启 TLS，同时指定 CA 证书和服务端证书/私钥。

- **客户端**：
    - 使用 CA 签发的客户端证书：`cert.pem` + `key.pem`
    - 客户端通过 TLS 连接到服务端时，服务端会验证客户端证书，拒绝未授权访问。
        

##  安全性分析

###  优点

1. **通信加密**：防止数据被截获
    
2. **身份验证**：保证只有持有客户端证书的人可以访问 Docker API
    
3. **防中间人攻击**：客户端验证服务端证书
    
4. **操作安全**：不像直接暴露 HTTP 那样任何人都可以控制 Docker
    

### 限制/风险

1. **证书泄露**
    - 如果 CA 或客户端证书/私钥泄露，攻击者可以直接访问 Docker
2. **端口暴露**
    - TCP 端口暴露在公网也可能被扫描，建议配合防火墙或 VPN 使用
3. **配置错误**
    - TLS 证书路径错误或使用服务端证书当客户端证书，会导致连接失败或安全缺失
        
**最佳实践**：
    1. 使用独立 CA 签发客户端证书
    2. 不在公网暴露 Docker TCP 端口，建议 VPN/内网访问
    3. 定期更新证书、不要共享私钥
    