---
author: 竹林听雨
tags:
  - 服务器
  - 安全
date: 2026-09-13
time: 17:09:17
title: VPS 基本安全配置
published: 2026-09-13T17:09:00
description: ""
draft: false
lang: ""
sticky: 103
abbrlink: 3edd5a51
updated: 2026-09-24T00:41:00
---
## 1.用户相关配置

**第 1 步：保持 root 能登录，先用 root 进去**
新机器初始状态，用 root + 密码（或云平台给的密钥）登录。这一步不要动任何配置。

**第 2 步：创建新用户并给 sudo 权限**

```bash
# 使用以下命令创建一个具有提权能力的账户
useradd -m -G sudo -s /bin/bash 用户名

# 设置密码
passwd 用户名
```

**第 3 步：给新用户配置密钥登录**

在**新用户**家目录下建 `.ssh`：

```bash
mkdir -p /home/用户名/.ssh
chmod 700 /home/用户名/.ssh
# 把你的公钥写进去
echo 'ssh-ed25519 AAAA... yourkey' >> /home/用户名/.ssh/authorized_keys
chmod 600 /home/用户名/.ssh/authorized_keys
chown -R 用户名:用户名 /home/用户名/.ssh

# SELinux 系统才需要
restorecon -R /home/用户名/.ssh
```

`restorecon` 提供了一个 `-n` 参数，用于“预演”（dry run），它不会实际修改文件，只会列出如果执行命令将会更改哪些文件[](https://manpages.debian.org/testing/policycoreutils/restorecon.8.en.html#1)。这是判断是否需要执行的最直接方法。

```bash
restorecon -R -n -v /home/用户名/.ssh/
```

**第 4 步：验证新用户能登录

**不要关闭当前 root 会话**，另开一个终端：

```bash
ssh -p 你的端口 用户名@服务器IP
```

确认能进，然后测提权：

```bash
sudo whoami    # 应输出 root
```

**第 5 步：确认无误后，再禁用 root 远程登录等配置**
建议在 `/etc/ssh/sshd_config.d/` 创建一个 conf 文件来自定义 sshd 配置，而不是直接编辑 `/etc/ssh/sshd_config`，防止 OpenSSH 更新后配置冲突。

先确认 `/etc/ssh/sshd_config` 里确实有 Include：
```bash
grep -i '^Include' /etc/ssh/sshd_config
```

另外，`sshd_config.d` 里的文件建议：

```bash
sudo chown root:root /etc/ssh/sshd_config.d/00-hardening.conf
sudo chmod 644 /etc/ssh/sshd_config.d/00-hardening.conf
```

文件名最好用 `00-hardening.conf` 这种，因为 OpenSSH 多数配置项是“第一次出现生效”，排序靠前更稳。

```bash
# 编辑 /etc/ssh/sshd_config.d/随便起名.conf

# 最好自定义端口
Port 自拟

# **完全禁止** root 用户通过 SSH 登录，无论使用密码还是密钥都不行。需要登录走VNC，忘记密码走云厂商重置
PermitRootLogin no

# 或者开放远程密钥登录，只禁止 Root 用户通过密码远程登录
# PermitRootLogin prohibit-password

# 仅允许密钥认证
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
AuthenticationMethods publickey
## 这里注意，虽然我们关闭了密码登录，但是sudo提权依旧可以输入当前用户密码提权，这是两套运行逻辑

# PAM 用于账户/会话管理
UsePAM yes

# 保活探测，3 次无响应约 180 秒断开
ClientAliveInterval 60
ClientAliveCountMax 3
```

有些云服务商为了启用远程密码登录（sshd 默认禁用 ），会在 `/etc/ssh/sshd_config.d/` 自定义一个 conf 文件，修改 sshd 配置前先要排除它们的干扰。

```bash
# 查看 sshd_config.d 是否存在其他 conf 文件
sudo ls /etc/ssh/sshd_config.d/*.conf
# 如果存在，重命名，防止后续自定义配置被覆盖
sudo mv /etc/ssh/sshd_config.d/xxx.conf /etc/ssh/sshd_config.d/xxx.conf.bak
```

sshd 配置修改完，先用 `sudo sshd -T` 看一下有效配置，免得被覆盖了都不知道

```bash
# Root 用户登录方式
sudo sshd -T | grep -i "PermitRootLogin"
# 密码认证
sudo sshd -T | grep -i "PasswordAuthentication"
# ssh 端口
sudo sshd -T | grep -i "Port"
```

对于端口修改，在**Ubuntu 22.10 或更高版本**中各位可能发现这是**无效**的，会发现SSH服务在重启后依然监听原端口。
因为在Ubuntu 22.10 或更高版本中，ssh 默认通过套接字激活。

在 Ubuntu 22.10、Ubuntu 23.04 和 Ubuntu 23.10 中进行修改的方法是：

```bash
sudo mkdir -p /etc/systemd/system/ssh.socket.d
sudo vim /etc/systemd/system/ssh.socket.d/listen.conf
sudo systemctl daemon-reload
sudo systemctl restart ssh.socket
sudo systemctl restart ssh.service
```
listen.conf的参考配置为：

```conf
[Socket]
ListenStream=
ListenStream=2233
```

在 Ubuntu 24.04 中进行修改的方法是：
```bash
sudo vim /etc/ssh/sshd_config.d/随便起名.conf
sudo systemctl daemon-reload
sudo systemctl restart ssh.service
```


切记，修改端口前先**放行本地防火墙，云厂商防火墙**，避免无法连接

**第 6 步：再次用新用户测试**

再开一个新终端，确认 `用户名` 仍能密钥登录、能 sudo。**全部通过后**，才关闭最初的 root 会话。


## 2.安全配置

### Fail2ban 防暴力破解 SSH

执行以下命令安装 Fail2ban：

```bash
sudo apt install fail2ban
```

官方推荐的做法是利用 jail.local 来进行自定义设置：

```bash
sudo vim /etc/fail2ban/jail.local
```

可以参照以下配置文件来进行自己的配置（记得删注释）：

```toml
[sshd]
ignoreip = 127.0.0.1/8 # 白名单
enabled = true
filter = sshd
port = 22 # 端口，改了的话这里也要改
maxretry = 5 # 最大尝试次数
findtime = 300 # 多少秒以内最大尝试次数规则生效
bantime = 600 # 封禁多少秒，-1是永久封禁（不建议永久封禁）
action = %(action_)s[port="%(port)s", protocol="%(protocol)s", logpath="%(logpath)s", chain="%(chain)s"] # 不需要发邮件通知就这样设置
banaction = iptables-multiport # 禁用方式
logpath = /var/log/auth.log # SSH 登陆日志位置
```
### 通知服务器SSH登录

可以通过 PAM 模块在每次ssh登录时触发脚本来实现。

编辑`/etc/pam.d/sshd`，在文件末尾添加：
```bash
session    optional    pam_exec.so 脚本路径
```

对于提到的用例，脚本大致如下：
参照：[https://developer.work.weixin.qq.com/document/path/91770](https://developer.work.weixin.qq.com/document/path/91770)

2024年11月26日注：修复了示例脚本的一些问题。

```bash
# 创建脚本存放路径
mkdir -p /opt/scripts
# 写入脚本内容
cat > /opt/scripts/login_notify.sh <<'EOF'
#!/bin/bash

# 只在会话建立时触发，过滤掉 close_session 等类型
if [ "$PAM_TYPE" != "open_session" ]; then
    exit 0
fi

# 1. 获取基础变量
user_name=$PAM_USER
remote_ip=$PAM_RHOST
login_time=$(date +"%Y-%m-%d %H:%M:%S")

# 2. 获取本机信息
local_hostname=$(hostname)
# 获取本机公网IP (增加3秒超时，防止获取失败导致登录卡顿)
local_ip=$(curl -s --connect-timeout 3 ifconfig.me || echo "未知/内网")

# 3. 配置 Webhook 地址
webhook_url="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=b14bc0dc-xxxx"

# 4. 发送通知
# --connect-timeout: 连接超时
# --max-time: 整个请求超时
curl -s -X POST "$webhook_url" \
    --connect-timeout 5 \
    --max-time 10 \
    -H "Content-Type: application/json" \
    -d "{
    \"msgtype\": \"markdown\",
    \"markdown\": {
        \"content\": \"### 🖥️ 服务器登录提醒\n> **登录机器**: $local_hostname ($local_ip)\n> **登录用户**: <font color=\\\"info\\\">$user_name</font>\n> **客户端IP**: $remote_ip\n> **登录时间**: $login_time\"
    }
}" > /dev/null 2>&1
EOF

chmod +x /opt/scripts/login_notify.sh
cat >> /etc/pam.d/sshd <<'EOF'
session    optional    pam_exec.so /opt/scripts/login_notify.sh
EOF

```

请根据自己的用例替换api及调用方式。

钉钉

```bash
# 创建脚本存放路径
mkdir -p /opt/scripts

# 写入脚本内容
cat > /opt/scripts/login_notify.sh <<'EOF'
#!/bin/bash

# 只在会话建立时触发，过滤掉 close_session 等类型
if [ "$PAM_TYPE" != "open_session" ]; then
    exit 0
fi

# 1. 获取基础变量
user_name=$PAM_USER
remote_ip=$PAM_RHOST
login_time=$(date +"%Y-%m-%d %H:%M:%S")

# 2. 获取本机信息
local_hostname=$(hostname)
# 获取本机公网IP (增加3秒超时，防止获取失败导致登录卡顿)
local_ip=$(curl -s --connect-timeout 3 ifconfig.me || echo "未知/内网")

# 3. 配置钉钉机器人
access_token="*********************************************"
# 若机器人安全设置选了"加签"，把密钥填这里；选"自定义关键词"则留空
secret="********************************************"

webhook_url="https://oapi.dingtalk.com/robot/send?access_token=${access_token}"

# 4. 加签处理（未开启加签时 secret 为空，自动跳过）
if [ -n "$secret" ]; then
    timestamp=$(date +%s%3N)
    sign=$(printf '%s\n%s' "$timestamp" "$secret" \
        | openssl dgst -sha256 -hmac "$secret" -binary \
        | base64 -w 0 \
        | sed 's/+/%2B/g; s|/|%2F|g; s/=/%3D/g')
    webhook_url="${webhook_url}&timestamp=${timestamp}&sign=${sign}"
fi

# 5. 发送通知
# --connect-timeout: 连接超时
# --max-time: 整个请求超时
curl -s -X POST "$webhook_url" \
    --connect-timeout 5 \
    --max-time 10 \
    -H "Content-Type: application/json" \
    -d "{
    \"msgtype\": \"markdown\",
    \"markdown\": {
        \"title\": \"服务器登录提醒\",
        \"text\": \"### 🖥️ 服务器登录提醒\n\n> **登录机器**：${local_hostname} (${local_ip})\n\n> **登录用户**：${user_name}\n\n> **客户端IP**：${remote_ip}\n\n> **登录时间**：${login_time}\"
    }
}" > /dev/null 2>&1
EOF

chmod +x /opt/scripts/login_notify.sh

# 注册到 PAM（保持不变）
cat >> /etc/pam.d/sshd <<'EOF'
session    optional    pam_exec.so /opt/scripts/login_notify.sh
EOF
```
**用root用户执行上述脚本一键部署。**

### 【严格】使用绝对路径运行命令

使用绝对路径可以精准指定要运行的程序或文件，可避免因环境变量被篡改等原因误执行潜在的恶意程序。

### 启用 UFW 防火墙

> [!note]
> 如果 VPS 厂商提供了防火墙功能，且没有复杂的需求，可以忽略本节内容并使用 VPS 厂商提供的防火墙（安全组）。

在正式启用 UFW 之前，我们需要先设置规则。我们首先来设置 UFW 的默认行为：

```bash
sudo ufw default allow outgoing # 默认允许所有数据出站
sudo ufw default deny incoming # 默认禁止所有数据入站
```

我们可以通过以下命令查看 UFW 当前生效的规则：

```bash
sudo ufw status
sudo ufw status numbered  # 加上数字编号
```

我们可以通过以下命令允许或拒绝某端口的传入 / 传出流量（部分以 22、80、443 端口为例）：

```bash
# 允许22端口的proto协议的流量入站
sudo ufw allow in 22/proto

#允许22端口的proto协议的流量出站
sudo ufw allow out 22/proto

# 在未指定in/out的情况下，默认为in
sudo ufw allow 22/proto

# 在未指定proto的情况下，默认为tcp和udp
sudo ufw allow 22

# 拒绝的话就把allow改成deny
sudo ufw deny 22

# 允许从start_port到end_port的端口
sudo ufw allow start_port:end_port

# 允许复数个端口，以英文逗号分隔
sudo ufw allow port1,port2

# 允许来自于特定ip或cidr段的流量
sudo ufw allow from ip/cidr

# 允许来自于特定ip或cidr段端口22的流量
sudo ufw allow from ip/cidr to any port 22

# 允许来自于特定ip或cidr段端口22的tcp协议的流量
sudo ufw allow from ip/cidr to any proto tcp port 22

# 如果指定复数个端口，则必须指定协议
sudo ufw allow from ip to any proto tcp port 80,443

# comment用于注释
sudo ufw allow from ip to any proto tcp port 80,443 comment "hello"
```

我们可以通过以下命令删除生效的规则：

```bash
sudo ufw delete allow 22 # 在规则前面加个delete
sudo ufw delete 1 # 按照numbered的编号删除也行
```

在确定所有规则均成功设置后，通过以下命令启动 \ 关闭 \ 重启 UFW

> [!caution]
> 启动防火墙前务必保证 22 端口（或者其他 SSH 端口）被放行。

```
sudo ufw enable|disable|reload
```

如果需要重置规则，请使用：

> [!caution]
> 重置规则前务必保证 UFW 处于关闭状态。

```
sudo ufw reset
```

本人建议仅放行正在使用的端口，比如22、80、443。

默认情况下，UFW仅记录不符合规则的被拒绝的数据包。如果需要记录与该服务相关的每个详细信息，可以在allow后加上log以进行记录。
```bash
ufw allow log 22/tcp
```

### 禁止ping服务器

1. 使用 iptables 禁止ping
- 查看当前iptables规则：
  - iptables -L -n
  - 这条命令可以列出当前iptables的规则，-L表示列出规则，-n表示以数字形式显示 IP 地址和端口号，而不是解析为主机名和服务名。  

- 禁止 ping（入站 ICMP Echo Request）：
  - iptables -A INPUT -p icmp --icmp - type 8 -j DROP
  - 这里-A INPUT表示在INPUT链（用于处理进入本机的数据包）的末尾添加一条规则。-p icmp指定协议为 ICMP，--icmp - type 8表示 ICMP 类型为 8（即 Echo Request），-j DROP表示将匹配的数据包丢弃。  
  
- 保存iptables规则（如果需要永久生效）：
  - 对于不同的 Linux 发行版，保存iptables规则的方式不同。
  - 在 CentOS 等基于 RHEL 的系统中，可以使用service iptables save命令来保存规则。这条命令会将当前的iptables规则保存到/etc/sysconfig/iptables文件中，这样在系统重启后规则依然生效。
  - 在 Ubuntu 等 Debian 系系统中，需要安装iptables - persistent软件包。安装后可以使用iptables - save > /etc/iptables/rules.v4（对于 IPv4 规则）来保存规则，这样在系统重启后也能恢复规则。

- 恢复 ping 功能
如果要恢复 ping 功能，可以删除刚才添加的禁止 ping 的规则。使用iptables -D INPUT -p icmp --icmp - type 8 -j DROP命令。其中-D INPUT表示从INPUT链中删除规则，其他参数和添加规则时相同。

> 保守起见，与destination-unreachable、time-exceeded、parameter-problem相关的规则已移除。


ufw本身没有直接支持阻止icmp协议的命令。ufw在/etc/ufw/before.rules中定义了针对ping的允许规则，我们可以修改ACCEPT为DROP来达成禁止ping的目的：

```
-A ufw-before-input -p icmp --icmp-type echo-request -j DROP
-A ufw-before-forward -p icmp --icmp-type echo-request -j DROP
```
这个只能禁v4的

如果需要设置ipv6的禁ping规则，可以修改`/etc/ufw/before6.rules` ：

```
-A ufw6-before-output -p icmpv6 --icmpv6-type echo-request -j DROP
-A ufw6-before-output -p icmpv6 --icmpv6-type echo-reply -j DROP
```
注意：**其余icmpv6规则应保持不变**。

### 限定SSH登录IP

我办公室的网络是固定 ip，VPS 运营商的防火墙开 22 端口然后指定 IP 地址，这样以后需要别的 IP 访问的话，直接添加 IP 即可

如果拥有动态公网IP且厂商支持通过接口修改防火墙规则，可以直接使用厂商的接口。

如果是家里没有固定ip的可以使用类似腾讯云的[orcaterm](https://orcaterm.cloud.tencent.com/)终端来访问，基础功能是永久免费的，这是[orcaterm的IP段](https://www.tencentcloud.com/zh/document/product/213/39708?lang=zh)，然后用ipset把这些IP段添加进去，设置为仅这些IP可以访问ssh端口即可，记得设置之前先测试是否可以正常使用连接。如果是腾讯云用户，安全组里甚至可以把ssh端口直接关掉，之前用腾讯云的时候就只开了80和443端口。

也可以使用ufw进行设置。

还可以使用VPS厂商提供的防火墙（如果支持），如果出现连接问题更方便更改配置。

## 3.保证软件更新

### 日常更新系统

个人建议定期登录 VPS 运行`sudo apt update && sudo apt upgrade`来保证 VPS 内所有软件包均为最新。

不过 Ubuntu 默认会每天自动安装系统的安全更新，所以说这个频率没必要太勤。

### 开启 Ubuntu Pro

> 同样出色的操作系统，更多的安全更新
> 将平均 CVE（通用漏洞披露）暴露时间从 98 天减少到 1 天
> 具备扩展的 CVE 补丁、十年的安全维护、可选的支持和对整个开源应用程序堆栈的维护。

上面是 Ubuntu 官方的广告词。到底多有用我不知道，有修复总比没修复好，而且个人免费 5 台机器，开了不亏。

我们先来创建一个 Ubuntu One 帐户：https://ubuntu.com/login

注册结束之后，转到 https://ubuntu.com/pro/dashboard 查看 Token。

得到了Token之后，前往我们的VPS，运行`sudo pro attach [YOUR_TOKEN]`。等待一段时间，我们的VPS就成功开启Ubuntu Pro了。建议在开启之后再运行一次`sudo apt update && sudo apt upgrade`以确保系统安装了最新的安全更新。

## 4.隐藏公网 IP

>[!note]
>
隐藏公网IP并不是所有VPS使用者的共同安全需求，有一个胡诌的针对未来（指ipv6广泛使用）的方案就是只暴露源站v6地址给CDN用，这样Censys这样强扫的工具耗时会很长，不过也还是要配白名单。


### 防止 SSL 证书泄露 IP

> [!note]
> 本节 “防止 SSL 证书泄露 IP” 引自 “如何避免证书泄露源站 IP”，作者为秋未萌，根据 CC BY-SA 4.0 授权协议发布。本文其他部分根据 CC BY-NC-SA 4.0 授权协议发布，但本节内容使用 CC BY-SA 4.0 授权协议。

#### 申请并下载证书

* 注册并且登录 [ZeroSSL](https://app.zerossl.com/login)
* 到 [Dashboard](https://app.zerossl.com/dashboard) 找到 Create SSL Certificate，点击 New Certificate 蓝色按钮
* 在 Enter Domains 处输入源站 IP
* 其实过期也无妨，总之不让 censys 扫描到真正的域名证书就可以。因此选择 90 天证书
* CSR & Contat 保持不变
* 验证域名的办法选择 HTTP File Upload
  * 使用 NGINX 的话，如果你保持原先设置不变，即 `/etc/nginx/sites-available/default` 不变就没问题。当然，如果你改变了，记得保留 `server {listen 80; root /var/www/html;}` 就可以
  * 然后下载 Auth File，并且把它上传到 `/var/www/html/.well-known/pki-validation`。如果没有文件夹，就新建，记得让 NGINX 有权访问这些文件，否则还是会失败
  * 按照提示，点击一下`.txt` 文件是不是可以访问。成功的话，就验证好了

#### 配置证书并且设置禁止 IP 80/433 的 HTTP 访问

* 下载 `*.zip` 文件，解压它。解压好的文件夹里面有好申请到的证书
* 将 `ca_bundle.crt` 和 `certificate.crt` 合并，方法是用 notepad3 或者 vscode 等可靠的编辑器打开 `certificate.crt`。然后把 `ca_bundle.crt` 内容复制进去。格式是：

```
-----BEGIN CERTIFICATE-----
certificate.crt内容
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
ca_bundle.crt内容
-----END CERTIFICATE-----
```

* 上传合并好的文件和 `private.key`
* 上传证书到一个 Nginx 有权限的文件夹，咱放在 `/etc/nginx/ip-certificate/`
* 设置 `/etc/nginx/sites-available/default` 文件。参考设置如下：

```conf
server {    
#HTTP Server Default Set    
    listen 80;
    listen 443 ssl http2 default_server;
    server_name ip;     

    #HTTP_TO_HTTPS_END    
    ssl_certificate /etc/nginx/ip-certificate/certificate.crt;
    ssl_certificate_key /etc/nginx/ip-certificate/private.key;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    #Server ROOT
    index index.html;
    root /var/www/html/;
    index index.html;

    return 444; #NGINX HTPP Code 444

}
```

服务器后台输入 `nginx -t` 检查是否有误，正确即可 `sudo systemctl restart nginx` 重启。

直接输入 IP 作为网址检查是不是连接后立刻变成空白页

### Nginx 1.19.4 之后的新方法

如果各位的 Nginx 版本大于等于 1.19.4，可以直接使用 ssl_reject_handshake 配置项，通过简单的配置就能拒绝所有未匹配到域名的 TLS 握手：

```
server {
    listen 443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;
}
```
如果出现如`nginx: [emerg] unknown directive “ssl_reject_handshake”`的报错，首先请检查nginx版本是否大于等于1.19.4。`ssl_reject_handshake on;` 在nginx 1.19.4 主线版加入。
如果是通过源代码编译安装的，请确认ngx_http_ssl_module模块是否启用。 该模块不是默认构建的，需要通过 `--with-http_ssl_module` 配置参数来启用。

### 真的安全了吗

前文中，我们只能确保攻击者无法通过直接访问 ip 获取默认证书来推断域名信息。然而又没有规定说攻击者只能用这种方式获取 IP 与域名的对应关系。可以看出，前文的规则依赖于 server_name 的匹配。攻击者完全可以携带正确的 server_name 握遍所有可能的非已知 CDN 的 IP 段，记录正确响应的目标。下面是判断（不包含遍历）的简单实现：

```
# https://gist.github.com/Raven95676/39ffdba22144e39d7155ad9dc1bcca55
import ssl
import socket
def check(ip, domain):
    try:
        context = ssl.create_default_context()
         with socket.create_connection((ip, 443)) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssl_sock:
                request = f"GET / HTTP/1.1\nHost: {domain}\nConnection: close\n\n"
                ssl_sock.sendall(request.encode())
                ssl_sock.recv(4096)
        return True
    except Exception:
        return False

print(check("192.168.0.256", "example.com"))
```

### 于是我们打个补丁

> 如果 VPS 厂商提供了防火墙功能，可以直接使用 VPS 厂商提供的防火墙。


我们可以仅允许 CDN 的 CIDR 段访问服务器的 80/443 端口。先来添加允许的规则：

```bash
sudo ufw allow from "cidr段" to any proto tcp port 80,443 comment "CDN服务商"
```

comment 不是必须的，只是为了方便日后能认出来这规则是干什么的才加上的。

CDN 的 CIDR 段去找 cdn 服务商要，有的在官网也有公示。比如 Cloudflare 的CIDR 段可以从这个网页获取：https://www.cloudflare.com/ips-v4
上面那个是 ipv4 的，ipv6 的可以从这个网页获取：https://www.cloudflare.com/ips-v6

对于 Cloudflare ，还有佬友编写的脚本可以在执行后更新 CF IP 到 ufw 443。

```
RULES=$(sudo ufw status numbered | grep 'Cloudflare IP' | awk -F"[][]" '{print $2}' | sort -nr)
for RULE in $RULES; do
    echo "Deleting rule $RULE"
    echo "y" | sudo ufw delete $RULE
done

for cfip in `curl -sw '\n' https://www.cloudflare.com/ips-v{4,6}`; do ufw allow proto tcp from $cfip to any port 443 comment 'Cloudflare IP'; done

ufw reload > /dev/null
```

由于特殊情况的存在，本人建议在部署该脚本之前先执行以下命令查看是否正确输出。
```
for cfip in `curl -sw '\n' https://www.cloudflare.com/ips-v{4,6}`; do echo $cfip; done
```
如果输出正常（如下），则可以部署：
```
173.245.48.0/20
103.21.244.0/22
…略
2400:cb00::/32
2606:4700::/32
…略
```

添加完了之后我们使用以下命令查看防火墙现有规则列表：

```bash
sudo ufw status numbered
```

使用以下命令删除之前可能存在的针对 80 和 443 端口允许所有流量的规则：

```bash
sudo ufw delete 序号
```

为什么不直接使用 Nginx 的 deny 配置项呢？因为 deny 会返回 403 Forbidden 状态码，而在此之前必须完成 TLS 握手。只有在 TLS 握手成功后，客户端才能发送 HTTP 请求并接收到响应。如果直接使用 deny，我们相当于在做无用功。

### 真的安全了……吗？

这其实算是 Cloudflare 特辑，不过如果使用其他 CDN 提供商，为了增强安全性也可以参考。众所周知，Cloudflare 不仅提供 CDN 服务，还有一系列其他产品，比如 Workers 和 WARP。而这些服务有一些需要注意的特点：

* 能对外发出请求
* 用的是 Cloudflare 的 IP 段

虽然 Cloudflare 对于滥用肯定是限制的，但是为了以防万一，我们还可以再做点安全措施 —— 经过身份验证的源服务器拉取。

> 必须确保SSL/TLS加密模式为完全或者完全（严格）

下载[Cloudflare证书](https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem)并进行配置即可。

```
ssl_client_certificate 证书地址;
ssl_verify_client on;
```

然后在 SSL/TLS→源服务器这里开启经过身份验证的源服务器拉取。

**雷池WAF社区版目前暂时无法稳定使用此方法，除非乐意在雷池前面再叠一层反代。**

## 5.迈向全面容器化

善用容器化技术进行隔离

### Docker基本使用

https://yeasy.gitbook.io/docker_practice

更新：添加Docker官中文档。

https://docs.docker.net.cn/manuals/

###  UFW管不了Docker的解决方案（推荐）

没必要用ufw来管理docker的端口开放，docker会自己写入iptables规则用以管控端口，以docker compose为例：

#### 1. 对于数据库或者redis之类仅在应用内使用的服务：

* 仅在容器内部网络内开放，compose拉起时会创建一个名为`第一个服务名_default`的bridge，可以用`docker network ls`查看。
* 容器默认对该内部网络开放所有端口。
* 同一网络内的其他容器可以通过容器名和端口访问该服务。
* 没有加入该网络的容器无法访问任何端口。
* 对于仅在内部网络中暴露端口的服务，**无需**在 `ports` 下指定任何映射

#### 2. 对于需要进行反代的服务：

* 仅在127.0.0.1监听即可防止外部端口访问，在对应容器处使用

```yaml
ports:
      - 127.0.0.1:端口:端口
```

#### 3. 对于需要外部直接访问端口的服务：

* 直接使用

```yaml
ports:
      - 端口:端口
```

同样的，贴一个示例compose.yml

```yaml
services:
    rsshub:
        image: diygod/rsshub:latest
        restart: always
        ports:
            - 127.0.0.1:1200:1200
        environment:
            NODE_ENV: production
            CACHE_TYPE: redis
            REDIS_URL: "redis://redis:6379/"
            PUPPETEER_WS_ENDPOINT: "ws://browserless:3000"
        env_file:
            - .env
        healthcheck:
            test: ["CMD", "curl", "-f", "http://localhost:1200/healthz"]
            interval: 30s
            timeout: 10s
            retries: 3
        depends_on:
            - redis
            - browserless
 
    browserless:
        image: browserless/chrome
        restart: always
        ulimits:
            core:
                hard: 0
                soft: 0
        healthcheck:
            test: ["CMD", "curl", "-f", "http://localhost:3000/pressure"]
            interval: 30s
            timeout: 10s
            retries: 3
 
    redis:
        image: redis:alpine
        restart: always
        volumes:
            - ./data:/data
        healthcheck:
            test: ["CMD", "redis-cli", "ping"]
            interval: 30s
            timeout: 10s
            retries: 5
            start_period: 5s
    
    sb:
        image: ghcr.io/sagernet/sing-box
        container_name: sb
        restart: always
        volumes:
            - ./sing-box:/etc/sing-box/
        command: -D /var/lib/sing-box -C /etc/sing-box/ run
```

此外，如果需要阻止外部端口访问，除去仅在127.0.0.1监听外还可以：

需要Nginx/Caddy等反代的服务，在Compose文件里可以配置一个Docker专用的172开头的内网ip，且不配置端口。这样Docker就不会暴露公共端口，反代地址写 内网ip:默认端口即可。

---

比如MySQL的Compose文件配置，指定了使用内网IP为`172.20.0.15`，注释了端口映射，在配置反向代理时 直接反代 `172.20.0.15:3306` 即可。

```yaml
networks:
  default:
    external: true
    name: ${DOCKER_MY_NETWORK}
services:
  mysql:
    container_name: mysql8
    image: mysql:8
    # ports:
    #   - "3306:3306"
    environment:
      TZ: Asia/Shanghai
    networks:
      default:
        ipv4_address: 172.20.0.15
    restart: unless-stopped
```

## 6.长亭雷池WAF+Cloudflare单节点部署

对安全要求更高的话可以像我一样再套上WAF+蜜罐。
### 部署

有一键部署命令：

```
bash -c "$(curl -fsSLk https://waf-ce.chaitin.cn/release/latest/setup.sh)"
```

或部署LTS版本：

```
RELEASE=lts bash -c "$(curl -fsSLk https://waf-ce.chaitin.cn/release/latest/setup.sh)"
```
由于本用例在雷池WAF前套了一层Cloudflare，所以说需要将防护站点→全局配置→源 IP 获取方式设置为“取 X-Forwarded-For 中上一级代理的地址”

如果出现其他问题，可前往官方文档 https://docs.waf-ce.chaitin.cn/zh/%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5 查询。

### 使用域名访问雷池控制台的问题

如果我们需要通过域名访问雷池控制台，会发现启用 Cloudflare 小黄云后，域名访问无法实现。这是因为 Cloudflare 的端口转发仅支持其指定的几个端口：

**Cloudflare 支持的 HTTP 端口：** 80,8080,8880,2052,2082,2086,2095
**Cloudflare 支持的 HTTPS 端口：** 443,2053,2083,2087,2096,8443


解决方案也很简单，打开 规则→Origin Rules，然后创建规则。传入请求匹配表达式大致如下：

```
(starts_with(http.request.full_uri, "https://域名"))
```

目标端口设置重写到9443即可

为了隐藏公网IP，请设定限定仅cloudflare cdn cidr段访问9443端口的防火墙规则。

### 重定向问题

如果重定向时 URL 中意外出现端口号，可通过防护站点→站点详情→自定义 NGINX 配置添加以下内容进行解决：

```
proxy_redirect https://$host:[port] https://$host;
```

### 使用 WireGuard 隐藏管理面板

对于VPS的管理面板，不要将管理面板（例如长亭WAF、宝塔面板等）暴露到公网
使用Wireguard等VPN访问是更加安全的选择
Wireguard可以在[Installation - WireGuard](https://www.wireguard.com/install/)查看到详细的安装方式

或者也非常推荐使用 https://netbird.io/

## 转载声明

本文从 2.安全配置 开始转载自 [# [VPS基本安全措施](https://linux.do/t/topic/267502)](https://linux.do/t/topic/267502)，并有一些改动




