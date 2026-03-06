---
author: 彭狗头
tags:
  - docker
  - 转载
title: 搭建一个属于自己的docker镜像加速器
abbrlink: 4a585e53
published: 2025-01-30 00:00:00
---
转载至：
[搭建一个属于自己的docker镜像加速器 - 彭狗头 - 博客园](https://www.cnblogs.com/pkyit/p/18259923)

近期国内的docker镜像加速器已经失效，导致docker镜像拉不下来。  
如图所示，阿里云镜像加速器已经失效了：  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015043761-1311381345.png)

（有人可能会问我，为什么不直接自建harbor仓库把镜像包都放在harbor上，其实这也是种方法，但是本人很不喜欢harbor私服仓库的镜像名字一长串的写法，如 192.168.33.234:5000/harbor/neo4j:5.20.0-ubi9这种拉取镜像的方法看着就心烦。还是简简单单的neo4j:5.20.0-ubi9这种写法方便）。下面我们利用nginx的反向代理实现自建docker镜像加速服务器实现这种效果。先看我自己做的效果：  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015204107-1709315836.png)

怎么样？成功拉取，和之前的一样的效果。上图的这个地址就是我自建的镜像加速器。

一、准备工作
------

首先，你必须有一台带公网IPv4的海外云服务器。我这里推荐你使用香港的云服务器（不是中国大陆的服务器就OK），尽可能离我们近，这样延时低响应快，新加坡韩国的也行吧。我自己使用的是一台阿里云香港轻量级应用服务器20-30块钱一个月，如果你觉得太贵可以和别人合买，大家一起用就是了。[点击这里直接购买阿里云服务器](https://www.aliyun.com/product/swas?scm=20140722.S_product@@%E4%BA%91%E4%BA%A7%E5%93%81@@65233._.ID_product@@%E4%BA%91%E4%BA%A7%E5%93%81@@65233-RL_%E8%BD%BB%E9%87%8F%E5%BA%94%E7%94%A8%E6%9C%8D%E5%8A%A1%E5%99%A8-LOC_llm-OR_ser-V_3-RE_new2-P0_0&source=5176.11533457&userCode=apvtdcf3)

![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015252199-1100143271.png)

30M的带宽足够下载docker镜像了。  
然后去买一个域名，就买那种最便宜的域名，大概是几块钱就能买一年的那种。[点击这里购买域名](https://www.namesilo.com/)  
也可以去cloudflare购买域名。（反正怎么便宜怎么来）  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015305099-1458965804.png)

二、服务器的准备工作
----------

购买的阿里云海外轻量级服务器推荐安装centos系统  
连接服务器，在阿里云安全面板里放行安全组端口，  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015316493-453897966.png)

连接服务器，centos系统运行如下命令安装宝塔面板：

```bash
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec
```

如果你是安装的Ubuntu系统则执行如下命令安装宝塔面板：

```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484bec
```

安装完成显示如下：  
![image.png](https://cdn.nlark.com/yuque/0/2024/png/39106204/1718897011242-d9435242-3ba3-4d65-bfe3-532dba235a64.png)  
**记得放开上图中的端口，80，22，443，8888，8080，8443等端口，最好是直接关闭防火墙。**  
浏览器中访问外网面板地址：  
第一进入会推荐安装一些常用软件，我们这里就只安装nginx就好了：  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015400015-849741358.png)

在等待安装过程中我们先去把公网IPv4和域名绑定好。

三、绑定域名
------

在你买的域名下面找到DNS解析选项，添加一条A记录，名称自定义就行，如图我这里填写abc,  
IP地址填你云服务器的公网ipv4地址，然后点击保存。我的是如图所示：  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015418749-549455468.png)

那么你服务器对应的域名就是你填写的名称加上你买的域名，例如我上图中红色框里的域名。其他的域名厂商买的域名也是类似的操作。例如namesilo家的域名操作页面如下所示  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015430212-476570970.png)

保存后我们看看能不能通过ping这个域名得到我们服务器的公网ipv4地址：  
[https://www.itdog.cn/ping/](https://www.itdog.cn/ping/)  
![image.png](https://cdn.nlark.com/yuque/0/2024/png/39106204/1718898892557-13e74548-0613-4e22-af8a-fe0d659220f3.png)  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015456156-1284432105.png)

等全国各地乃至全世界得到的响应都是绿色通过状态那么我们就可以进行下一步操作了。（这个过程可能需要10几分钟，慢一点可能需要几个小时，我是等了一个多小时才全部变绿色的）

四、使用服务器和域名搭建docker镜像加速器
-----------------------

回到我们的宝塔面板：  
点击左侧网站按钮，点击添加站点，填入域名，点击确定保存。如下图所示：  
![image.png](https://cdn.nlark.com/yuque/0/2024/png/39106204/1718899258614-4d8cbd3c-d5e0-46ab-b77b-8316b454d59c.png)  
点击域名站点右侧的未部署按钮，选择Let's Encrypt 选中域名并申请证书。稍等片刻，证书申请成功，如果失败可以多试几次。  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015604048-1024076392.png)

证书申请成功如图所示。  
![image.png](https://cdn.nlark.com/yuque/0/2024/png/39106204/1718899758642-712ddab8-79bc-4fd2-a810-da3d8a1d7cf7.png)  
然后我们设置nginx反向代理，**点击配置文件，在原来的配置文件最后面的 } 之前插入如下配置：**

```vue
  location / {
                     proxy_pass https://registry-1.docker.io;  
                     proxy_set_header Host registry-1.docker.io;
                     proxy_set_header X-Real-IP $remote_addr;
                     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                     proxy_set_header X-Forwarded-Proto $scheme;               
                     proxy_buffering off;
                     proxy_set_header Authorization $http_authorization;
                     proxy_pass_header  Authorization;
                     proxy_intercept_errors on;
                     recursive_error_pages on;
                     error_page 301 302 307 = @handle_redirect;

             }
                          location @handle_redirect {
                     resolver 1.1.1.1;
                     set $saved_redirect_location '$upstream_http_location';
                     proxy_pass $saved_redirect_location;
             }
    
```

如图所示：  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015626545-912582124.png)

这一步其实就是设置nginx的默认配置文件，确认以上无误，就可以点击保存，至此完成了nginx反代docker hub的配置。

五、测试并验证
-------

如果你在浏览器里访问你的域名，会是404页面，这是正常的：  
如果访问不通，看看是不是80和443端口没开放。  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015639869-1110979694.png)  
我们在docker里验证一下是否能拉取镜像了，修改docker的配置文件  
vim /etc/docker/daemon.json  
把镜像改为你的域名：

```json
{
  "registry-mirrors": ["https://你的域名地址"],
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "128m"
  },
  "storage-driver": "overlay2"
}
```

保存，然后重启docker验证是否有效：  
systemctl daemon-reload  
systemctl restart docker  
尝试拉取一个dockerhub上的redis镜像，速度非常快。  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015659064-504155040.png)

![image.png](https://cdn.nlark.com/yuque/0/2024/png/39106204/1718900594865-1ef295d3-6819-4d4b-88bf-8e854763eeac.png)  
![](https://img2024.cnblogs.com/blog/3470163/202406/3470163-20240623015710678-996596683.png)

1.反向代理取决于海外服务器的速度，所以如果服务器速度太慢，建议换个服务器，一般来说香港的服务器速度快点。  
2.反向代理也需要消耗服务器的流量，但是一般情况下个人使用不会消耗太多，如果服务器成本太高，可以多个人合租也行。  
3.不要随意把访问地址告诉他人，不然服务器被攻击或者被刷流量，损失的的是自己，并且建议做好防护措施。  
**最后欢迎大家在评论区留言讨论。**  
我的技术分享博客地址：[CSDN＠ｐｋｙｉｔ](https://blog.csdn.net/pky86676022)

本文转自 <https://www.cnblogs.com/pkyit/p/18259923>，如有侵权，请联系删除。