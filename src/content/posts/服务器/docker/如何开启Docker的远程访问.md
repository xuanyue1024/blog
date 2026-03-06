---
author: niceyoo
tags:
  - docker
  - 远程
  - Ubuntu
  - 服务器
  - 转载
title: 如何开启Docker的远程访问
abbrlink: 71cc795
published: 2024-12-02 00:00:00
---

> 本文为转载文章，主要介绍如何开启docker的远程访问并通过idea进行远程操作。
> 
> 原文地址：[Docker开启远程安全访问 - niceyoo - 博客园](https://www.cnblogs.com/niceyoo/p/13270224.html "Docker开启远程安全访问 - niceyoo - 博客园")

### 1、编辑docker.server文件

```bash
vi /usr/lib/systemd/system/docker.service
```

找到 **\[Service\]** 节点，修改 ExecStart 属性，增加 `-H tcp://0.0.0.0:2375`

```cobol
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock -H tcp://0.0.0.0:2375
```

![](https://i-blog.csdnimg.cn/blog_migrate/3e0e1cea1b854fe9582c51af25394d61.png)

 这样相当于对外开放的是 **2375** 端口，当然也可以根据自己情况修改成其他的。

### 2、重新加载Docker配置生效

```undefined
systemctl daemon-reload 
systemctl restart docker 
```

通过浏览器访问 **2375** 测试一下，格式为：http://ip:2375/version

![](https://i-blog.csdnimg.cn/blog_migrate/03d5e1a7dcad5edc4cd25a2a618e5427.png)

如果无法访问的话，可以尝试一下开放防火墙2375端口，具体命令如下：

```cobol
firewall-cmd --zone=public --add-port=2375/tcp --permanent
firewall-cmd --reload
```

如果还是不能访问，如果使用的机器是云服务器，比如阿里云、腾讯云等等，需要到服务器安全组规则中看看是否开放2375端口，如未配置，增加该端口配置即可。

这样我们就可以直接在Idea中的Docker插件中直接连接测试了：

![](https://i-blog.csdnimg.cn/blog_migrate/b2641cd33f849029972b303bdadf7b32.png)

### 3、配置Docker安全访问 

如上两步切勿用于生产环境！在开发环境用用就行了，如果直接把Docker这样对外暴露是非常危险的，就跟你Redis对外开放6379还不设置密码一样。

基本网上好多文章都是如上两步，裸奔的步骤... 你品，你细品，不给你挂马给谁挂。

其实官方文档已经提供基于CA证书的加密方法了，[详情点击此处链接](https://docs.docker.com/engine/security/https/#create-a-ca-server-and-client-keys-with-openss "详情点击此处链接")

#### 3.1、创建CA私钥和CA公钥

首先创建一个ca文件夹用来存放私钥跟公钥

```cobol
mkdir -p /usr/local/ca
cd /usr/local/ca
```

 然后在**Docker守护程序的主机上**，生成CA私钥和公钥：

```cobol
openssl genrsa -aes256 -out ca-key.pem 4096
```

 执行完如上指令后，会要求我们输入密码（yhc123321)才能进行下一步。

![](https://i-blog.csdnimg.cn/blog_migrate/7f4f1481118b5cac8bea7a138b96f901.png)

#### 3.2、补全CA证书信息 

执行如下指令：

```cobol
openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem
```

然后依次输入：访问密码、国家、省、市、组织名称、单位名称、随便一个名字、邮箱等。为了省事，组织、单位之类的。 

![](https://i-blog.csdnimg.cn/blog_migrate/69b846641f0284124aed2e7a04029ba7.png)

至此，CA证书就创建完成了，有了CA之后，就可以创建服务器密钥和证书签名请求(CSR)了，确保“通用名称”与你连接Docker时使用的主机名相匹配。

#### 3.3、生成server-key.pem 

```csharp
openssl genrsa -out server-key.pem 4096
```

#### 3.4、用CA签署公钥 

由于可以通过IP地址和DNS名称建立TLS连接，因此在创建证书时需要指定IP地址。例如，允许使用`10.211.55.4`进行连接：

```vbscript
openssl req -subj "/CN=10.211.55.4" -sha256 -new -key server-key.pem -out server.csr
```

如果你是用的网址(比如:www.sscai.club)则替换一下即可：

```vbscript
openssl req -subj "/CN=www.sscai.club" -sha256 -new -key server-key.pem -out server.csr
```

 注意：这里指的ip或者是域名，都是指的将来用于对外的地址。

#### 3.5、匹配白名单

配置白名单的意义在于，允许哪些ip可以远程连接docker。

配置0.0.0.0，允许所有的ip可以链接（但只允许永久证书的才可以连接成功）

```cobol
echo subjectAltName = DNS:www.yumeng.com,IP:0.0.0.0 >> extfile.cnf
```

#### 3.6、执行命令

将Docker守护程序密钥的扩展使用属性设置为仅用于服务器身份验证：

```cobol
echo extendedKeyUsage = serverAuth >> extfile.cnf
```

#### 3.7、生成签名整数 

```objectivec
openssl x509 -req -days 365 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \  -CAcreateserial -out server-cert.pem -extfile extfile.cnf
```

执行后需要输入上方设置的密码。 

![](https://i-blog.csdnimg.cn/blog_migrate/c281edf6f92b536486e9ae6f660c376e.png)

#### 3.8、生成客户端的key.pem 

```cobol
openssl genrsa -out key.pem 4096 
openssl req -subj '/CN=client' -new -key key.pem -out client.csr
```

#### 3.9、要使秘钥适合客户端身份验证 

创建扩展配置文件：

```cobol
echo extendedKeyUsage = clientAuth >> extfile.cnf
echo extendedKeyUsage = clientAuth > extfile-client.cnf
```

#### 3.10、生成签名整数 

```objectivec
openssl x509 -req -days 365 -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem \  -CAcreateserial -out cert.pem -extfile extfile-client.cnf
```

生成cert.pem，需要再次输入之前设置的密码。

![](https://i-blog.csdnimg.cn/blog_migrate/59cec7df518cefdf8365b3be96dab913.png)

#### 3.11、删除不需要的文件，两个整数签名请求 

 生成后`cert.pem`，`server-cert.pem`您可以安全地删除两个证书签名请求和扩展配置文件：

```vbscript
rm -v client.csr server.csr extfile.cnf extfile-client.cnf
```

![](https://i-blog.csdnimg.cn/blog_migrate/0dbe0fe484ebe939138dff1e58a07088.png)

#### 3.12、可修改权限 

 为了保护您的密钥免于意外损坏，请删除其写入权限。要使它们仅供您阅读，请按以下方式更改文件模式：

```vbnet
chmod -v 0400 ca-key.pem key.pem server-key.pem
```

证书可以使对外可读的，删除写入权限以防止意外损坏：

```vbscript
chmod -v 0444 ca.pem server-cert.pem cert.pem
```

#### 3\. 13、归集服务器证书

```cobol
cp server-*.pem /etc/docker/
cp ca.pem /etc/docker/
```

#### 3.14、修改Docker配置

使Docker守护程序仅接收来自提供CA信任的证书的客户端的链接

```cobol
vim /lib/systemd/system/docker.service
```

将 `ExecStart` 属性值进行替换：

```cobol
ExecStart=/usr/bin/dockerd --tlsverify --tlscacert=/usr/local/ca/ca.pem --tlscert=/usr/local/ca/server-cert.pem --tlskey=/usr/local/ca/server-key.pem -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock
```

![](https://i-blog.csdnimg.cn/blog_migrate/38111ec4eaaa9de8f75cd50f0da3e6de.png)

#### 3.15、重新加载daemon并重启docker

```undefined
systemctl daemon-reload 
systemctl restart docker
```

我们去IDEA中的docker模块验证一下，先看一下之前的连接：

![](https://i-blog.csdnimg.cn/blog_migrate/f79a992b7086d61357dcfbf26d5ee219.png)

显然是无法连接了，此时我们需要去拿到docker宿主机创建的证书，使用证书才可以进行连接：

![](https://i-blog.csdnimg.cn/blog_migrate/27d2b65bac979fe76ddf2f48aaa5b98c.png)

拉取这四个证书文件至本地文件夹，这个文件夹将用于在idea指定，需要说的是，TCP 里的链接需要改成 Https 格式，具体内容如下图所示：

![](https://i-blog.csdnimg.cn/blog_migrate/dcbc182c57fdb99585e0f9ae82e3d951.png)

* * *


记录分享程序进阶之路中的点点滴滴。

本文转自 <https://blog.csdn.net/sg_knight/article/details/126319965>，如有侵权，请联系删除。