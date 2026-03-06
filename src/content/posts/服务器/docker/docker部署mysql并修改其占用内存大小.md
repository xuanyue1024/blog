---
author: 独酌先生QAQ
tags:
  - 转载
  - docker
  - 博客
  - mysql
title: docker部署mysql并修改其占用内存大小
abbrlink: "80661e20"
published: 2025-03-05 00:00:00
---

#### 一.安装mysql

1.下载好镜像

```cobol
docker pull mysql:8.0.18
```

2.创建`MySQL`容器

```cobol
docker run -id --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql:8.0.18
```

3.查看安装情况

```cobol
[root@ ~]# docker ps -lCONTAINER ID   IMAGE          COMMAND                  CREATED          STATUS         PORTS                               NAMESa28d702be74a   mysql:8.0.18   "docker-entrypoint.s…"   20 minutes ago   Up 6 minutes   0.0.0.0:3306->3306/tcp, 33060/tcp   mysql
```

#### 二.修改mysql占用内存大小

因为自己部署服务内存比较小，而mysql在docker初始化就占500M，所以可优化其占用内存大小

1.查看运行内存

```cobol
[root@ ~]# docker statsCONTAINER ID   NAME        CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O
PIDSa28d702be74a   mysql       0.34%     400.49MiB / 1.694GiB  24.33%     0B / 0B           19.3MB / 14.1MB   38c8adbf02c7a5   kafka       0.30%     435.7MiB / 1.694GiB   25.11%    1.77MB / 2.93MB   130MB / 86kB      6592187cc1f68e   zookeeper   0.07%     89.78MiB / 1.694GiB   5.18%     2.93MB / 1.77MB   99.5MB / 127kB    19
```

 2.[进入mysql](https://so.csdn.net/so/search?q=%E8%BF%9B%E5%85%A5mysql&spm=1001.2101.3001.7020)容器终端

```perl
docker exec -it mysql bash
```

3.切换进入/etc/mysql/conf.d 目录

```cobol
 cd /etc/mysql/conf.d
```

4.我们需要进入容器当中进行修改容器里面的配置文件，可能有的服务器是没有安装vim的，所以我们没有的需要安装的

```sql
apt-get updateapt-get install vim
```

5.docker进入mysql容器内，进入/etc/mysql/conf.d 目录执行 vim docker.cnf

```undefined
vim docker.cnf
```

6.在对应文件后面添加下面的参数

```cobol
performance_schema_max_table_instances=400  table_definition_cache=400    performance_schema=off    table_open_cache=64    innodb_buffer_pool_chunk_size=64M    innodb_buffer_pool_size=64M    
```

各参数对应的意义为

```cobol
[mysqld]
performance_schema_max_table_instances=400  
table_definition_cache=400    #缓存
performance_schema=off    #用于监控MySQL server在一个较低级别的运行过程中的资源消耗、资源东西table_open_cache=64    #打开表的缓存
innodb_buffer_pool_chunk_size=64M    #InnoDB缓冲池大小调整操作的块大小
innodb_buffer_pool_size=64M    #InnoDB 存储引擎的表数据和索引数据的最大内存缓冲区大小
```

7.退出

```php
exit
```

8.[重启mysql](https://so.csdn.net/so/search?q=%E9%87%8D%E5%90%AFmysql&spm=1001.2101.3001.7020)容器

```cobol
docker stop mysql
docker start mysql
```

9.观察修改后的内存情况

```undefined
docker stats
```

 ![](https://i-blog.csdnimg.cn/blog_migrate/aba1541644829f372287ed8ae8bca59c.png)

本文转自 <https://blog.csdn.net/qq_39449880/article/details/125887603>，如有侵权，请联系删除。