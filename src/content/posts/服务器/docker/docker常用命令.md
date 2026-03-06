---
tags:
  - Ubuntu
  - docker
  - 常用命令
author: 竹林听雨
title: docker常用命令
abbrlink: 749ad7d8
published: 2024-05-26 00:00:00
---
Docker 是一个开源的平台，旨在使应用程序的开发、部署和运行更轻松。Docker 使用容器这一轻量级的虚拟化技术，使应用程序及其所有依赖项都可以打包到一个标准化的单元中。
## Docker常用命令

### Docker 容器相关命令
1. **运行容器**
   ```bash
   docker run -it --name <容器名> <镜像名>:<标签>
   ```
   例如：
   ```bash
   docker run -it --name mynginx nginx:latest
   ```

2. **列出正在运行的容器**
   ```bash
   docker ps
   ```

3. **列出所有容器（包括已停止的容器）**
   ```bash
   docker ps -a
   ```

4. **停止容器**
   ```bash
   docker stop <容器ID或容器名>
   ```

5. **启动容器**
   ```bash
   docker start <容器ID或容器名>
   ```

6. **重启容器**
   ```bash
   docker restart <容器ID或容器名>
   ```

7. **删除容器**
   ```bash
   docker rm <容器ID或容器名>
   ```

8. **查看容器日志**
   ```bash
   docker logs <容器ID或容器名>
   ```

9. **进入正在运行的容器**
   ```bash
   docker exec -it <容器ID或容器名> /bin/bash
   ```

### Docker 镜像相关命令
1. **搜索镜像**
   ```bash
   docker search <镜像名>
   ```
   例如：
   ```bash
   docker search nginx
   ```

2. **拉取镜像**
   ```bash
   docker pull <镜像名>:<标签>
   ```
   例如：
   ```bash
   docker pull nginx:latest
   ```

3. **列出本地镜像**
   ```bash
   docker images
   ```

4. **删除镜像**
   ```bash
   docker rmi <镜像ID或镜像名>
   ```

5. **构建镜像**
   ```bash
   docker build -t <镜像名>:<标签> <Dockerfile路径>
   ```
   例如：
   ```bash
   docker build -t myapp:1.0 .
   ```

### Docker 网络相关命令
1. **列出网络**
   ```bash
   docker network ls
   ```

2. **创建网络**
   ```bash
   docker network create <网络名>
   ```

3. **删除网络**
   ```bash
   docker network rm <网络名>
   ```

### Docker 卷相关命令
1. **列出卷**
   ```bash
   docker volume ls
   ```

2. **创建卷**
   ```bash
   docker volume create <卷名>
   ```

3. **删除卷**
   ```bash
   docker volume rm <卷名>
   ```

## 开机自启
要让 Docker 容器在系统启动时自动运行，你可以使用 Docker 提供的 `--restart` 选项来配置容器的重启策略。以下是几种常见的重启策略：

1. **no**: 容器不会自动重启。
2. **always**: 无论容器退出状态如何，总是自动重启。
3. **on-failure**: 只有在容器以非零退出代码退出时才自动重启。
4. **unless-stopped**: 容器将始终重新启动，除非它被手动停止。

要设置一个容器在系统启动时自动运行，可以使用 `--restart` 选项创建或更新容器。例如：

### 创建新的自动重启容器

如果你还没有创建容器，可以在运行 `docker run` 命令时添加 `--restart` 选项。例如，使用 `gotify/server` 镜像：

```bash
docker run -d --name gotify-server --restart always gotify/server
```

### 更新现有的容器以自动重启

如果你已经有一个容器，并希望更新它的重启策略，可以使用 `docker update` 命令：

```bash
docker update --restart always gotify-server
```

### 验证容器的重启策略

你可以使用 `docker inspect` 命令来验证容器的重启策略：

```bash
docker inspect gotify-server --format='{{.HostConfig.RestartPolicy}}'
```

### 示例：启动多个容器并设置自动重启

假设你有多个容器需要设置自动重启策略，你可以按如下方式操作：

1. **Bitwarden Setup**
   ```bash
   docker run -d --name bitwarden-setup --restart always bitwarden/setup:2024.1.2
   ```

2. **Qinglong**
   ```bash
   docker run -d --name qinglong --restart always whyour/qinglong:latest
   ```

3. **Certbot**
   ```bash
   docker run -d --name certbot --restart always certbot/certbot:latest
   ```

4. **Watchtower**
   ```bash
   docker run -d --name watchtower --restart always containrrr/watchtower:latest
   ```

### 管理自动启动的服务

除了使用 Docker 自身的重启策略，你还可以使用系统服务管理工具（如 `systemd`）来确保 Docker 服务在系统启动时自动启动，并配置自定义的服务单元文件来管理 Docker 容器的启动。以下是一个简单的 `systemd` 服务单元文件的示例：

```ini
[Unit]
Description=Gotify Server Container
Requires=docker.service
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker start -a gotify-server
ExecStop=/usr/bin/docker stop -t 2 gotify-server

[Install]
WantedBy=default.target
```

将上述内容保存为 `/etc/systemd/system/gotify-server.service`，然后启用和启动服务：

```bash
sudo systemctl enable gotify-server
sudo systemctl start gotify-server
```

这样配置后，系统启动时将自动启动 `gotify-server` 容器。
