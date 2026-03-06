---
author: 竹林听雨
tags:
  - Bitwarden
  - Vaultwarden
title: Bitwarden使用备份
abbrlink: 29d75657
published: 2025-03-02 00:53:21
updated: 2025-08-30 00:53:21
---

```cardlink
url: https://github.com/dani-garcia/vaultwarden/discussions/4664
title: "Missing Icons · dani-garcia/vaultwarden · Discussion #4664"
description: "Deployment environment Your environment (Generated via diagnostics page) Vaultwarden version: v1.30.5 Web-vault version: v2024.1.2b OS/Arch: linux/x86_64 Running within a container: true (Base: Deb..."
host: github.com
favicon: https://github.githubassets.com/favicons/favicon.svg
image: https://opengraph.githubassets.com/621640ceaff12b91c056267da259ab5dafcfd0a8930c1b0bccf78a827cac35a6/dani-garcia/vaultwarden/discussions/4664
```

```cardlink
url: https://host.ppgg.in/deploying-and-using-of-vaultwarden/configuration#about-configuration
title: "配置 | Bitwarden 部署和使用"
host: host.ppgg.in
favicon: https://1098296495-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/spaces%2F-MGNKm8ywtCheKTpUjpY%2Favatar-1603889553012.png?generation=1603889553284125&alt=media
image: https://host.ppgg.in/~gitbook/ogimage/-MJKdUsLbd4wL7RVzAOa
```


[VaultWarden 的网站图标功能很不好用 - VPS专版 - TGL论坛 - 中文顶尖的英文站长社区](https://tglbbs.com/thread-199987-1-1.html)




  "icon_service": "https://api.faviconkit.com/{}/32",


```cardlink
url: https://help.ppgg.in/password-manager/developer-tools/ssh-agent
title: "SSH 代理 | Bitwarden 帮助中心中文版"
host: help.ppgg.in
favicon: https://463484399-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/spaces%2F-M2XqgFI6fAcTD0lL3MZ%2Favatar-1584637381575.png?generation=1584637382149328&alt=media
image: https://help.ppgg.in/~gitbook/ogimage/5LxzQXM3wbKDRshTsqkF
```



```cardlink
url: https://rs.ppgg.in/
title: "关于 | Vaultwarden Wiki 中文版"
host: rs.ppgg.in
favicon: https://551209699-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/spaces%2F-M2Yi-lp0fd1uaijcnF_%2Favatar-1584637417236.png?generation=1584637417496173&alt=media
image: https://rs.ppgg.in/~gitbook/ogimage/-M2Yi65qaGLbd7hLATDg
```

## vaultwarden更新
```
cd /root/myapp/Vaultwarden

# 拉取最新版本的镜像
docker pull vaultwarden/server:latest

# 停止并移除旧版本容器
docker stop vaultwarden
docker rm vaultwarden

# 使用已挂载的数据启动容器
docker run -d --name vaultwarden -v ./vw_data/:/data/ -p 7659:80 vaultwarden/server:latest
```

## 其它

环境变量修改后
```bash
docker compose down && docker compose up -d
```


```
"push_enabled": true,
  "push_identity_uri": "https://identity.bitwarden.com",
  "push_installation_id": "xxxxx",
  "push_installation_key": "xxxxxx",
  "push_relay_uri": "https://push.bitwarden.com", 
  "experimental_client_feature_flags": "fido2-vault-credentials,ssh-key-vault-item,ssh-agent"
```

我的环境变量

```properties
## 时区
TZ=Asia/Shanghai

## 管理界面的令牌，最好是 Argon2 PHC 字符串。
## Vaultwarden 提供了一个内置生成器，可以通过调用 `vaultwarden hash` 来生成。
## 详情请参阅：https://github.com/dani-garcia/vaultwarden/wiki/Enabling-admin-page#secure-the-admin_token
## 如果未设置，管理面板将被禁用。
## 新的 Argon2 PHC 字符串
## 注意，在某些环境中，如 docker-compose 中，您需要将所有美元符号 `$` 转义为两个美元符号 `$$`。
## 并且在必要时使用单引号 (') 而不是双引号 (") 包含字符串。
ADMIN_TOKEN='XXXX'

## 日志
LOG_FILE=/data/vaultwarden.log

## 日志级别
## 更改日志输出的详细程度。
## 有效值为 "trace", "debug", "info", "warn", "error" 和 "off"。
## 将其设置为 "trace" 或 "debug" 也会显示挂载路由和静态文件、WebSocket 和 alive 请求的日志。
## 对于特定模块，可以附加一个逗号分隔的 `path::to::module=log_level`
## 例如，要只为图标查看 info 日志，使用：LOG_LEVEL="info,vaultwarden::api::icons=debug"
LOG_LEVEL=warn

## 控制当 SMTP 服务未配置且允许密码提示时，是否应在网页上直接显示密码提示。
## 不建议在公共可访问实例上使用，因为这会提供对潜在敏感数据的未经授权访问。
SHOW_PASSWORD_HINT=false

## 启用推送通知（需要从 https://bitwarden.com/host 获取密钥和 ID）
## 关于移动客户端推送通知的详情：
## - https://github.com/dani-garcia/vaultwarden/wiki/Enabling-Mobile-Client-push-notification
PUSH_ENABLED=true
PUSH_INSTALLATION_ID=XXXXXX
PUSH_INSTALLATION_KEY=XXXXXXXX
# 警告：除非完全理解其含义，否则不要修改以下设置！
# 默认推送中继和身份验证 URI
PUSH_RELAY_URI=https://push.bitwarden.com
PUSH_IDENTITY_URI=https://identity.bitwarden.com

## 客户端设置
## 启用客户端的实验性功能标志。
## 这是一个逗号分隔的功能标志列表，例如 "flag1,flag2,flag3"。
##
## 可用的标志如下：
## - "autofill-overlay": 在表单字段中添加一个覆盖菜单，以便快速访问凭据。
## - "autofill-v2": 使用新的自动填充实现。
## - "browser-fileless-import": 直接从其他提供商导入凭据而无需文件。
## - "extension-refresh": 临时启用新扩展设计直到正式发布（应与 beta Chrome 扩展一起使用）。
## - "fido2-vault-credentials": 启用 FIDO2 安全密钥作为第二因素。
## - "inline-menu-positioning-improvements": 启用浏览器扩展中的内联菜单密码生成器和身份建议。
## - "ssh-key-vault-item": 启用 SSH 密钥保险库项的创建和使用。（需要客户端 >=2024.12.0）
## - "ssh-agent": 在桌面上启用 SSH 代理支持。（需要桌面 >=2024.12.0）
EXPERIMENTAL_CLIENT_FEATURE_FLAGS=ssh-key-vault-item,ssh-agent,fido2-vault-credentials,browser-fileless-import,inline-menu-positioning-improvements,autofill-overlay
```