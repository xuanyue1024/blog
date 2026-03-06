---
tags:
  - frp
  - 内网穿透
  - 防火墙
  - systemctl
  - Ubuntu
title: frp内网穿透
abbrlink: c067e7e3
published: 2024-05-25 00:00:00
---
官方文档

```cardlink
url: https://gofrp.org/
title: "/zh-cn/"
host: gofrp.org
```


```cardlink
url: https://blog.csdn.net/lihuayong/article/details/128575019
title: "FRP 内网穿透搭建(无域名)_frp搭建-CSDN博客"
description: "文章浏览阅读3k次，点赞5次，收藏18次。frp是一种快速反向代理，可帮助您将NAT或防火墙后面的本地服务器暴露到Internet。到目前为止，它支持TCP和UDP，以及HTTP和HTTPS协议，其中请求可以通过域名转发到内部服务。_frp搭建"
host: blog.csdn.net
```
编译
```cardlink
url: https://www.wyr.me/post/737##toc1-3
title: "blog"
description: "Yige Blog 2.0"
host: www.wyr.me
favicon: https://www.wyr.me/favicon.ico
```


```cardlink
url: https://www.cnblogs.com/TianyuSu/p/11961994.html
title: "frp 配置多个 web 项目，无需购买域名 (访问内网可视化界面，jupyter noterbook, visdom, tensorboard) - 佰大于 - 博客园"
description: "通过一台外网服务器访问多台内网服务器。应用场景，调试内网web项目，深度学习展示loss，feature等图形"
host: www.cnblogs.com
favicon: https://assets.cnblogs.com/favicon_v3_2.ico
```

[Fetching Data#t6ge](https://www.ersansi.top/index.php/archives/1194/)

```toml
# 此配置文件仅供参考，请勿直接使用此配置运行程序，可能会有各种问题。
# 您的代理名称将更改为 {user}.{proxy}
user = "your_name"
# 对于IPv6的字面地址或主机名，必须用方括号括起来，如 "[::1]:80", "[ipv6-host]:http" 或 "[ipv6-host%zone]:80"
# 对于单一的 serverAddr 字段，不需要方括号，例如 serverAddr = "::"。
serverAddr = "0.0.0.0"
serverPort = 7000
# STUN服务器，用于帮助穿透NAT。
# natHoleStunServer = "stun.easyvoip.com:3478"
# 决定在首次登录失败时是否退出程序，否则将连续重新登录frps
# 默认为 true
loginFailExit = true
# 日志输出位置，可设置为控制台或实际的日志文件路径，例如 ./frpc.log
log.to = "./frpc.log"
# 日志级别，可设置为 trace, debug, info, warn, error
log.level = "info"
# 日志保留天数
log.maxDays = 3
# 当 log.to 设置为控制台时，是否禁用日志颜色，默认值为 false
log.disablePrintColor = false
# 认证方法
auth.method = "token"
# auth.additionalScopes 指定附加的作用域以包含认证信息。
# 可选值为 HeartBeats, NewWorkConns。
# auth.additionalScopes = ["HeartBeats", "NewWorkConns"]
# 认证的 token
auth.token = "12345678"
# oidc.clientID 指定用于获取OIDC认证token的客户端ID。
# auth.oidc.clientID = ""
# oidc.clientSecret 指定用于获取OIDC认证token的客户端密钥。
# auth.oidc.clientSecret = ""
# oidc.audience 指定OIDC认证的受众。
# auth.oidc.audience = ""
# oidc.scope 指定在认证方法为 OIDC 时的token权限。默认值为 ""。
# auth.oidc.scope = ""
# oidc.tokenEndpointURL 指定实现OIDC Token端点的URL，用于获取OIDC token。
# auth.oidc.tokenEndpointURL = ""
# oidc.additionalEndpointParams 指定发送给OIDC Token端点的附加参数。
# 例如，如果您想指定“audience”参数，可以设置如下。
# frp将添加 "audience=<value>" "var1=<value>" 到附加参数中。
# auth.oidc.additionalEndpointParams.audience = "https://dev.auth.com/api/v2/"
# auth.oidc.additionalEndpointParams.var1 = "foobar"
# 设置管理控制台地址，用于通过HTTP API控制frpc的行为，例如重新加载
webServer.addr = "127.0.0.1"
webServer.port = 7400
webServer.user = "admin"
webServer.password = "admin"
# 管理控制台的静态资源目录。默认情况下，这些资源与frpc捆绑在一起。
# webServer.assetsDir = "./static"
# 在管理监听器中启用golang pprof处理程序。
webServer.pprofEnable = false
# 指定与服务器连接的最大拨号时间，默认为10秒。
# transport.dialServerTimeout = 10
# dialServerKeepalive 指定frpc与frps之间活跃网络连接的保活探测间隔。如果为负值，则禁用保活探测。
# transport.dialServerKeepalive = 7200
# 提前建立的连接数，默认值为0
transport.poolCount = 5
# 如果使用TCP流多路复用，默认值为 true，必须与frps一致
# transport.tcpMux = true
# 指定TCP多路复用的保活间隔，仅在tcpMux启用时有效。
# transport.tcpMuxKeepaliveInterval = 30
# 连接服务器时使用的通信协议
# 目前支持 tcp, kcp, quic, websocket 和 wss，默认是 tcp
transport.protocol = "tcp"
# 设置客户端绑定的IP地址用于连接服务器，默认为空。
# 仅在 protocol = tcp 或 websocket 时，该值才会被使用。
transport.connectServerLocalIP = "0.0.0.0"
# 如果您想通过HTTP代理、SOCKS5代理或NTLM代理连接frps，可以在这里或在全局环境变量中设置proxyURL
# 仅在 protocol 为 tcp 时有效
# transport.proxyURL = "http://user:passwd@192.168.1.128:8080"
# transport.proxyURL = "socks5://user:passwd@192.168.1.128:1080"
# transport.proxyURL = "ntlm://user:passwd@192.168.1.128:2080"
# QUIC协议选项
# transport.quic.keepalivePeriod = 10
# transport.quic.maxIdleTimeout = 30
# transport.quic.maxIncomingStreams = 100000
# 如果 tls.enable 为 true，frpc 将通过 TLS 连接 frps。
# 自v0.50.0起，默认值已更改为true，TLS默认启用。
transport.tls.enable = true
# transport.tls.certFile = "client.crt"
# transport.tls.keyFile = "client.key"
# transport.tls.trustedCaFile = "ca.crt"
# transport.tls.serverName = "example.com"
# 如果 disableCustomTLSFirstByte 设置为 false，启用 TLS 时，frpc 将使用第一个自定义字节与 frps 建立连接。
# 自v0.50.0起，默认值已更改为true，第一个自定义字节默认禁用。
# transport.tls.disableCustomTLSFirstByte = true
# 心跳配置，不建议修改默认值。
# heartbeatInterval 的默认值为10，heartbeatTimeout 为90。设置负值可禁用心跳。
# transport.heartbeatInterval = 30
# transport.heartbeatTimeout = 90
# 指定 DNS 服务器，frpc 将使用该服务器而非默认的
# dnsServer = "8.8.8.8"
# 要启动的代理名称，默认为空，表示启动所有代理。
# start = ["ssh", "dns"]
# 指定UDP包大小，单位为字节。如果未设置，默认值为1500。
# 此参数在客户端和服务器之间应保持一致，影响UDP和SUDP代理。
udpPacketSize = 1500
# 客户端的附加元数据。
metadatas.var1 = "abc"
metadatas.var2 = "123"
# 包含其他代理配置文件。
# includes = ["./confd/*.ini"]
[[proxies]]
# 'ssh' 是唯一的代理名称
# 如果全局 user 不为空，它将被更改为 {user}.{proxy}，如 'your_name.ssh'
name = "ssh"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
# 限制此代理的带宽，单位为KB或MB
transport.bandwidthLimit = "1MB"
# 带宽限制的位置，可以是 'client' 或 'server'，默认为 'client'
transport.bandwidthLimitMode = "client"
# 如果为 true，则对该代理的流量进行加密，默认值为 false
transport.useEncryption = false
# 如果为 true，则对流量进行压缩
transport.useCompression = false
# frps监听的远程端口
remotePort = 6001
# frps将对同一组中的代理连接进行负载均衡
loadBalancer.group = "test_group"
# 组应该有相同的组密钥
loadBalancer.groupKey = "123456"
# 启用后端服务的健康检查，目前支持 'tcp' 和 'http'
# frpc 将连接本地服务的端口以检测其健康状态
healthCheck.type = "tcp"
# 健康检查连接超时时间
healthCheck.timeoutSeconds = 3
# 如果连续失败3次，该代理将从frps中删除
healthCheck.maxFailed = 3
# 每10秒进行一次健康检查
healthCheck.intervalSeconds = 10
# 为每个代理添加附加的元数据信息。这些信息将传递给服务器端插件使用。
metadatas.var1 = "abc"
metadatas.var2 = "123"
# 通过注释为代理添加一些额外的信息。这些注释将在frps仪表板上显示。
[proxies.annotations]
key1 = "value1"
"prefix/key2" = "value2"
[[proxies]]
name = "ssh_random"
type = "tcp"
localIP = "192.168.31.100"
localPort = 22
# 如果 remotePort 为 0，frps 将为您分配一个随机端口
remotePort = 0
[[proxies]]
name = "dns"
type = "udp"
localIP = "114.114.114.114"
localPort = 53
remotePort = 6002
# 将您的域名解析到 [serverAddr]，这样您就可以使用 http://web01.yourdomain.com 浏览 web01，使用 http://web02.yourdomain.com 浏览 web02
[[proxies]]
name = "web01"
type = "http"
localIP = "127.0.0.1"
localPort = 80
# http 用户名和密码是 http 协议的安全认证
# 如果未设置，您可以在没有认证的情况下访问这个 customDomains
httpUser = "admin"
httpPassword = "admin"
# 如果 frps 的域名为 frps.com，那么您可以通过 URL http://web01.frps.com 访问 [web01] 代理
subdomain = "web01"
customDomains = ["web01.yourdomain.com"]
# locations 仅适用于 http 类型
locations = ["/", "/pic"]
# 如果 http basic 认证用户为 abc，则将请求路由到此服务
# routeByHTTPUser = abc
hostHeaderRewrite = "example.com"
requestHeaders.set.x-from-where = "frp"
responseHeaders.set.foo = "bar"
healthCheck.type = "http"
# frpc 将发送 GET http 请求 '/status' 到本地 http 服务
# 当本地 http 服务返回 2xx http 响应代码时，表示服务正常
healthCheck.path = "/status"
healthCheck.intervalSeconds = 10
healthCheck.maxFailed = 3
healthCheck.timeoutSeconds = 3
# 设置健康检查请求头
healthCheck.httpHeaders=[
{ name = "x-from-where", value = "frp" }
]
[[proxies]]
name = "web02"
type = "https"
localIP = "127.0.0.1"
localPort = 8000
subdomain = "web02"
customDomains = ["web02.yourdomain.com"]
# 如果不为空，frpc 将使用代理协议将连接信息传递到本地服务
# v1 或 v2 或 为空
transport.proxyProtocolVersion = "v2"
[[proxies]]
name = "tcpmuxhttpconnect"
type = "tcpmux"
multiplexer = "httpconnect"
localIP = "127.0.0.1"
localPort = 10701
customDomains = ["tunnel1"]
# routeByHTTPUser = "user1"
[[proxies]]
name = "plugin_unix_domain_socket"
type = "tcp"
remotePort = 6003
# 如果定义了插件，localIP 和 localPort 无效
# 插件将处理从 frps 接收到的连接
[proxies.plugin]
type = "unix_domain_socket"
unixPath = "/var/run/docker.sock"
[[proxies]]
name = "plugin_http_proxy"
type = "tcp"
remotePort = 6004
[proxies.plugin]
type = "http_proxy"
httpUser = "abc"
httpPassword = "abc"
[[proxies]]
name = "plugin_socks5"
type = "tcp"
remotePort = 6005
[proxies.plugin]
type = "socks5"
username = "abc"
password = "abc"
[[proxies]]
name = "plugin_static_file"
type = "tcp"
remotePort = 6006
[proxies.plugin]
type = "static_file"
localPath = "/var/www/blog"
stripPrefix = "static"
httpUser = "abc"
httpPassword = "abc"
[[proxies]]
name = "plugin_https2http"
type = "https"
customDomains = ["test.yourdomain.com"]
[proxies.plugin]
type = "https2http"
localAddr = "127.0.0.1:80"
crtPath = "./server.crt"
keyPath = "./server.key"
hostHeaderRewrite = "127.0.0.1"
requestHeaders.set.x-from-where = "frp"
[[proxies]]
name = "plugin_https2https"
type = "https"
customDomains = ["test.yourdomain.com"]
[proxies.plugin]
type = "https2https"
localAddr = "127.0.0.1:443"
crtPath = "./server.crt"
keyPath = "./server.key"
hostHeaderRewrite = "127.0.0.1"
requestHeaders.set.x-from-where = "frp"
[[proxies]]
name = "plugin_http2https"
type = "http"
customDomains = ["test.yourdomain.com"]
[proxies.plugin]
type = "http2https"
localAddr = "127.0.0.1:443"
hostHeaderRewrite = "127.0.0.1"
requestHeaders.set.x-from-where = "frp"
[[proxies]]
name = "plugin_http2http"
type = "tcp"
remotePort = 6007
[proxies.plugin]
type = "http2http"
localAddr = "127.0.0.1:80"
hostHeaderRewrite = "127.0.0.1"
requestHeaders.set.x-from-where = "frp"
[[proxies]]
name = "plugin_tls2raw"
type = "https"
remotePort = 6008
[proxies.plugin]
type = "tls2raw"
localAddr = "127.0.0.1:80"
crtPath = "./server.crt"
keyPath = "./server.key"
[[proxies]]
name = "secret_tcp"
# 如果类型为 secret tcp，remotePort 无效
# 想要连接本地端口的用户应部署另一个带有 stcp 代理且角色为 visitor 的 frpc
type = "stcp"
# secretKey 用于认证访问者
secretKey = "abcdefg"
localIP = "127.0.0.1"
localPort = 22
# 如果不为空，仅允许指定用户的访问者连接。
# 否则，来自同一用户的访问者可以连接。'*' 表示允许所有用户。
allowUsers = ["*"]
[[proxies]]
name = "p2p_tcp"
type = "xtcp"
secretKey = "abcdefg"
localIP = "127.0.0.1"
localPort = 22
# 如果不为空，仅允许指定用户的访问者连接。
# 否则，来自同一用户的访问者可以连接。'*' 表示允许所有用户。
allowUsers = ["user1", "user2"]
# frpc 角色为 visitor -> frps -> frpc 角色为 server
[[visitors]]
name = "secret_tcp_visitor"
type = "stcp"
# 您要访问的服务器名称
serverName = "secret_tcp"
secretKey = "abcdefg"
# 连接此地址以访问 stcp 服务器
bindAddr = "127.0.0.1"
# bindPort 可以小于0，表示不绑定端口，仅接收从其他访问者重定向的连接。（SUDP 目前不支持此功能）
bindPort = 9000
[[visitors]]
name = "p2p_tcp_visitor"
type = "xtcp"
# 如果未设置服务器用户，则默认为当前用户
serverUser = "user1"
serverName = "p2p_tcp"
secretKey = "abcdefg"
bindAddr = "127.0.0.1"
# bindPort 可以小于0，表示不绑定端口，仅接收从其他访问者重定向的连接。（SUDP 目前不支持此功能）
bindPort = 9001
# 当需要自动隧道持久性时，将其设置为 true
keepTunnelOpen = false
# 当 keepTunnelOpen 设置为 true 时，每小时打洞的尝试次数
maxRetriesAnHour = 8
minRetryInterval = 90
# fallbackTo = "stcp_visitor"
# fallbackTimeoutMs = 500
 

frps.toml完整配置模板中文注释（0.60.0版本）
# 该配置文件仅供参考，请勿直接使用运行程序，可能会存在各种问题。
# 对于 IPv6 地址或主机名，必须使用方括号括起来，例如 "[::1]:80"、"[ipv6-host]:http" 或 "[ipv6-host%zone]:80"
# 对于单个 "bindAddr" 字段，不需要使用方括号，例如 bindAddr = "::"。
bindAddr = "0.0.0.0"
bindPort = 7000
# UDP 端口，用于 KCP 协议。可以与 'bindPort' 相同。
# 如果未设置，则 frps 中禁用 KCP。
kcpBindPort = 7000
# UDP 端口，用于 QUIC 协议。
# 如果未设置，则 frps 中禁用 QUIC。
# quicBindPort = 7002
# 指定代理监听的地址，默认值与 bindAddr 相同。
# proxyBindAddr = "127.0.0.1"
# QUIC 协议配置选项
# transport.quic.keepalivePeriod = 10
# transport.quic.maxIdleTimeout = 30
# transport.quic.maxIncomingStreams = 100000
# 心跳配置，不建议修改默认值。
# 默认的 heartbeatTimeout 为 90。设置为负值可禁用它。
# transport.heartbeatTimeout = 90
# 每个代理中保留的连接池数量不超过 maxPoolCount。
transport.maxPoolCount = 5
# 是否使用 TCP 流多路复用，默认为 true。
# transport.tcpMux = true
# 指定 TCP 多路复用的保持连接时间间隔。
# 仅在 tcpMux 为 true 时有效。
# transport.tcpMuxKeepaliveInterval = 30
# tcpKeepalive 指定 frpc 和 frps 之间活动网络连接的保持存活探测间隔。
# 如果为负数，则禁用保持存活探测。
# transport.tcpKeepalive = 7200
# transport.tls.force 指定是否仅接受 TLS 加密连接。默认值为 false。
transport.tls.force = false
# transport.tls.certFile = "server.crt"
# transport.tls.keyFile = "server.key"
# transport.tls.trustedCaFile = "ca.crt"
# 如果希望支持虚拟主机，必须设置监听的 HTTP 端口（可选）。
# 注意：HTTP 端口和 HTTPS 端口可以与 bindPort 相同。
vhostHTTPPort = 80
vhostHTTPSPort = 443
# 虚拟主机 HTTP 服务器的响应头超时时间（秒），默认为 60 秒。
# vhostHTTPTimeout = 60
# tcpmuxHTTPConnectPort 指定服务器监听 TCP HTTP CONNECT 请求的端口。
# 如果值为 0，服务器不会在单一端口上多路复用 TCP 请求。否则，它会监听这个值所指定的端口。
# 默认为 0。
# tcpmuxHTTPConnectPort = 1337
# 如果 tcpmuxPassthrough 为 true，frps 不会对流量进行任何更新。
# tcpmuxPassthrough = false
# 配置 Web 服务器以启用 frps 的仪表板。
# 仅在设置了 webServer.port 时，仪表板可用。
webServer.addr = "127.0.0.1"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "admin"
# webServer.tls.certFile = "server.crt"
# webServer.tls.keyFile = "server.key"
# 仪表板静态资源目录（仅用于调试模式）
# webServer.assetsDir = "./static"
# 在仪表板监听器中启用 golang pprof 处理程序。
# 必须首先设置仪表板端口。
webServer.pprofEnable = false
# enablePrometheus 将在 /metrics API 上通过 webServer 导出 prometheus 指标。
enablePrometheus = true
# 日志输出位置，可以是控制台或文件路径，如 "./frps.log"
log.to = "./frps.log"
# 日志级别：trace, debug, info, warn, error
log.level = "info"
log.maxDays = 3
# 当 log.to 为控制台时，禁用日志颜色输出，默认值为 false
log.disablePrintColor = false
# DetailedErrorsToClient 定义是否向 frpc 发送具体错误（包含调试信息）。默认值为 true。
detailedErrorsToClient = true
# auth.method 指定用于验证 frpc 和 frps 的认证方法。
# 如果指定为 "token"，则会在登录消息中读取 token。
# 如果指定为 "oidc"，则会使用 OIDC 设置发出 OIDC 令牌。默认值为 "token"。
auth.method = "token"
# auth.additionalScopes 指定包含认证信息的额外范围。
# 可选值为 HeartBeats, NewWorkConns。
# auth.additionalScopes = ["HeartBeats", "NewWorkConns"]
# 认证 token
auth.token = "12345678"
# oidc 发行者指定用于验证 OIDC 令牌的发行者。
auth.oidc.issuer = ""
# oidc 受众指定在验证 OIDC 令牌时应包含的受众。
auth.oidc.audience = ""
# oidc skipExpiryCheck 指定是否跳过检查 OIDC 令牌是否过期。
auth.oidc.skipExpiryCheck = false
# oidc skipIssuerCheck 指定是否跳过检查 OIDC 令牌的发行者声明是否与 oidcIssuer 指定的发行者匹配。
auth.oidc.skipIssuerCheck = false
# userConnTimeout 指定工作连接的最大等待时间。
# userConnTimeout = 10
# 仅允许 frpc 绑定指定的端口。默认情况下没有限制。
allowPorts = [
{ start = 2000, end = 3000 },
{ single = 3001 },
{ single = 3003 },
{ start = 4000, end = 50000 }
]
# 每个客户端可使用的最大端口数，默认为 0 表示无限制。
maxPortsPerClient = 0
# 如果 subDomainHost 不为空，则在 frpc 配置文件中使用 http 或 https 类型时，可以设置子域名。
# 当子域名为 test 时，用于路由的主机是 test.frps.com。
subDomainHost = "frps.com"
# HTTP 请求的自定义 404 页面
# custom404Page = "/path/to/404.html"
# 指定 UDP 包大小，单位为字节。如果未设置，默认值为 1500。
# 该参数应在客户端和服务器之间保持一致。
# 它影响 UDP 和 SUDP 代理。
udpPacketSize = 1500
# NAT 穿透策略数据的保留时间。
natholeAnalysisDataReserveHours = 168
# SSH 隧道网关
# 如果要启用此功能，bindPort 参数是必需的，其他为可选。
# 默认情况下，此功能是禁用的。当 bindPort 大于 0 时将启用它。
# sshTunnelGateway.bindPort = 2200
# sshTunnelGateway.privateKeyFile = "/home/frp-user/.ssh/id_rsa"
# sshTunnelGateway.autoGenPrivateKeyPath = ""
# sshTunnelGateway.authorizedKeysFile = "/home/frp-user/.ssh/authorized_keys"
[[httpPlugins]]
name = "user-manager"
addr = "127.0.0.1:9000"
path = "/handler"
ops = ["Login"]
[[httpPlugins]]
name = "port-manager"
addr = "127.0.0.1:9001"
path = "/handler"
ops = ["NewProxy"]
```
### 服务端frp配置

~~~ini
[common]
bind_port = 7500
vhost_http_port = 7501
#subdomain_host = 8.xxx.xx.xx
authentication_method = token
authenticate_new_work_conns = true
token = 123321
 
# 远访问监控面板接口
dashboard_port = 7502
 
# 登录用户名和密码
dashboard_user = xuanyue
dashboard_pwd = xxxxx
 
#dashboard_tls_mode = false
 
#enable_prometheus = true 
~~~

### 客户端配置
~~~ini
[common]
server_addr = xxxxx
server_port = 7500
authentication_method = token
authenticate_new_work_conns = true
token = 123xxxx

[web]
type = http
local_ip = 192.168.100.1
local_port = 80
custom_domains = xxxxx
#路由·
locations = /
#动态配置请求头，
host_header_rewrite = 192.168.100.1
~~~

关于动态配置请求头，正常情况下是不需要使用这个参数的。

举个例子，比如你想通过` test.yourdomain.com` 访问 `www.baidu.com`。 虽然这个请求被转发到了百度的服务器，但是你发送的 http 请求的 header 中的 host 参数是 test.yourdomain.com，百度的后端服务可能会进行检测，如果 host 不是 `www.baidu.com` 就拒绝，返回相应错误。

这个时候，如果你设置` host_header_rewrite = www.baidu.com`，那么 frp 会将这个请求的 host 动态修改为` www.baidu.com`，百度的服务器看到的就是正常的请求，才能正常访问。

如果你后端的 nginx 启用了虚拟主机这样的功能，需要根据 host 做路由，那么你才需要配置这个参数。
## ubuntu系统配置systemctl
[systemctl系统和服务管理器](systemctl系统和服务管理器.md)

服务端配置 systemctl 来控制frps，自启动
vim /etc/systemd/system/frps.service
~~~ini
[Unit]
# 服务名称，可自定义
Description = frps内网穿透服务
After = network.target syslog.target
Wants = network.target

[Service]
Type = simple
# 启动frps的命令，需修改为您的frps的安装路径
ExecStart = /root/App/frp/frps -c /root/App/frp/frps.toml

[Install]
WantedBy = multi-user.target
~~~

~~~ini
# 启动frps
systemctl start frps
# 开机自动启动frps
systemctl enable frps
# 重启frps
systemctl restart frps
# 停止frps
systemctl stop frps
# 查看frps状态
systemctl status frps
~~~

## URL 路由

frp 支持根据请求的 URL 路径路由转发到不同的后端服务。

通过配置文件中的 locations 字段指定一个或多个 proxy 能够匹配的 URL 前缀(目前仅支持最大前缀匹配，之后会考虑正则匹配)。例如指定 `locations = "/news"`，则所有 URL 以 `/news` 开头的请求都会被转发到这个服务。

```toml
# frpc.toml
[[proxies]]
name = "web01"
type = "http"
localPort = 80
customDomains = ["web.yourdomain.com"]
locations = ["/"]

[[proxies]]
name = "web02"
type = "http"
localPort = 81
customDomains = ["web.yourdomain.com"]
locations = ["/news", "/about"]
```

按照上述的示例配置后，`web.yourdomain.com` 这个域名下所有以 `/news` 以及 `/about` 作为前缀的 URL 请求都会被转发到 web02，其余的请求会被转发到 web01。

路由器配置举例
```toml
[common]
server_addr = 190.xxxx.xxxx.xxx
server_port = 7500
authentication_method = token
authenticate_new_work_conns = true
token = xxx

#log_file = /dev/null
#log_level = info
#log_max_days = 3

[家里路由]
type = http
local_ip = 192.168.123.1
local_port = 80
custom_domains = 190.xxxx.xxxx.xxx
host_header_rewrite = 192.168.123.1

[家里wifi]
type = http
local_ip = 192.168.0.1
local_port = 80
custom_domains = a.b.c

[路由ssh]
type = tcp
local_ip = 192.168.123.1         
local_port = 22
remote_port = 7503

```