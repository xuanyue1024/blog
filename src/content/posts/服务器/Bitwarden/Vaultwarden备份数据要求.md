---
author: 竹林听雨
tags:
  - Bitwarden
  - Vaultwarden
  - 翻译
time: 00:36:51
title: Vaultwarden备份数据要求
abbrlink: 5839238a
published: 2025-02-21 00:00:00
---
翻译而来
概述
--

vaultwarden 数据应该定期备份，优先使用自动化过程（例如：cron 作业）。理想情况下，至少应将备份存储在远程位置（例如：云存储或不同计算机）。避免依赖文件系统或虚拟机快照作为备份方法，因为这些是更复杂的操作，更多的东西可能会出错，且在这种情况下恢复可能会很困难或不可能。 在备份中添加额外的加密层通常是一个好主意（尤其是当备份还包括配置数据，如[admin token](https://github.com/dani-garcia/vaultwarden/wiki/Enabling-admin-page)时），但如果您对主密码（以及其他用户的密码，如果有）感到自信，可以跳过这个步骤。

备份数据
----

默认情况下，vaultwarden 将所有数据存储在一个名为 `data` (与 `vaultwarden` 可执行文件位于同一目录) 的目录下。可以通过设置 [DATA_FOLDER](https://github.com/dani-garcia/vaultwarden/wiki/Changing-persistent-data-location)环境变量来更改此位置。 如果您使用 SQLite（这是最常见的设置），则 SQL 数据库就是数据文件夹中的一个文件。如果您使用 MySQL 或 PostgreSQL，则必须单独导出该数据——这超出了本文的范围，但进行网络搜索会找到许多其他教程，涵盖了这个主题。

当使用 SQLite 后端时，vaultwarden `data` 目录结构如下：

```
数据
├── attachments          # 每个附件作为单独的文件存储在此目录下。
│   └── <uuid>           # （如果没有创建过附件，attachments 目录将不存在。）
│       └── <随机_id>
├── config.json          # 存储管理员页面配置；仅在管理员页面曾经启用过时存在。
├── db.sqlite3           # 主SQLite数据库文件。
├── db.sqlite3-shm       # SQLite共享内存文件（并不总是存在）。
├── db.sqlite3-wal       # SQLite预写日志文件（并不总是存在）。
├── icon_cache           # 站点图标（收藏夹图标）在此目录下缓存。
│   ├── <域名>.png
│   ├── example.com.png
│   ├── example.net.png
│   └── example.org.png
├── rsa_key.der          # `rsa_key.*` 文件用于签署身份验证令牌。
├── rsa_key.pem
├── rsa_key.pub.der
└── sends                # 每个Send附件作为单独的文件存储在此目录下。
    └── <uuid>           # （如果没有创建过Send附件，sends 目录将不存在。）
        └── <随机_id>
```


当使用 MySQL 或 PostgreSQL 后端时，目录结构与 SQLite 一致，除了没有 SQLite 文件。您仍然希望备份 `data` 目录中的文件，以及 MySQL 或 PostgreSQL 表的备份。

每个文件集的详细信息将在下一节讨论。

### SQLite 数据库文件

_**备份需要。**_

SQLite 数据库文件（ `db.sqlite3` ）存储了几乎所有重要的 vaultwarden 数据/状态（数据库条目、用户/组织/设备元数据等），主要的例外是附件，它们以单独的文件形式存储在文件系统中。

您应该在 SQLite CLI（ `sqlite3` ）中使用 `.backup` 命令来备份数据库文件。这条命令使用在线备份 API，这是 SQLite 文档中推荐的备份可能正在使用中的数据库文件的最佳方法。如果您可以确保数据库在备份时不会被使用，那么您也可以使用其他方法，如 `.dump` 命令，或者简单地复制所有 SQLite 数据库文件（包括 `-wal` 文件，如果存在）。

一个基本的备份命令看起来像这样，假设你的数据文件夹是 `data` （默认值）：

```bash
sqlite3 data/db.sqlite3 ".backup '/path/to/backups/db-$(date '+%Y%m%d-%H%M').sqlite3'"
```

你也可以使用 VACUUM INTO，它会压缩空余空间，但需要稍微多一些处理时间：

```bash
sqlite3 data/db.sqlite3 "VACUUM INTO '/path/to/backups/db-$(date '+%Y%m%d-%H%M').sqlite3'"
```

假设这个命令在 2021 年 1 月 1 日 12:34pm (本地时间) 运行，这会将您的 SQLite 数据库文件备份到 `/path/to/backups/db-20210101-1234.sqlite3` 。

可以通过 cron 作业定期运行此命令（最好每天至少一次）。如果您正在通过 Docker 运行，请注意 Docker 镜像不包括 `sqlite3` 二进制文件或 `cron` 守护进程，因此您通常会在 Docker 主机上安装这些并在容器外运行 cron 作业。如果您真的想在容器内运行备份，例如某些原因，您可以在容器启动时安装必要的包，或者创建一个自定义的 Docker 镜像，使用您偏好的 `vaultwarden/server:<tag>` 镜像作为父镜像。

如果你想将备份数据复制到云存储中，rclone 是一个有用的工具，可以与各种云存储系统进行接口。 restic 或 rustic 是其他好的选择，尤其是如果你有较大的附件并且想避免将它们作为每次备份的一部分重新复制。

###  `attachments` 目录

_**备份需要。**_

文件附件是唯一一个不存储在数据库表中的重要数据类别，主要是因为它们可以任意大，而 SQL 数据库通常不设计来高效处理大块数据。这一目录不会存在如果从未创建过文件附件。

###  `sends` 目录

_**备份可选。**_

像普通文件附件一样，发送文件附件不存储在数据库表中。 (发送文本笔记是存储在数据库中的，然而。)

与普通附件不同，Send 附件是临时的。因此，如果您想最小化备份大小，您可能不想备份这个目录。另一方面，如果您更关心恢复时维持 Send 的正常功能，那么您应该备份这个目录。

如果从来没有创建过发送附件，则这个目录不会存在。

###  `config.json` 目录

_**建议进行备份。**_

如果您使用管理员页面配置您的 Vaultwarden 实例，并且没有通过其他方式备份您的配置，那么您可能希望备份这个文件，以免再次尝试找到您的偏好配置。

请注意，这个文件包含一些明文数据，这些数据可能被认为是敏感的（管理员令牌、SMTP 凭证等），因此如果你担心有人可能会访问它（例如，当它上传到云存储时），请确保加密这些数据。

###  `rsa_key*` 文件

_**建议进行备份。**_

这些文件用于签署当前登录用户的 JWTs（认证令牌）。删除它们将简单地将每个用户登出，迫使他们再次登录，并且还将使任何通过邮件发送的开放邀请令牌失效。

该 `rsa_key.pem` （私钥）文件可能被认为是相当敏感的。在原则上，它可以用来伪造服务器的安全库登录会话，但在实践中，这将需要额外的 UUID（例如，从数据库副本中获取的）知识。使用伪造的会话获得的任何数据仍将使用个人和/或组织密钥加密，因此要获得这些密钥所需的相关主密码的暴力破解仍然需要。然而，管理员面板登录会话可以轻松伪造（这只会在管理员面板启用时起作用）。这不会提供对安全库数据的访问，但它会允许一些管理操作，如删除用户或移除 2FA。

如果您担心有人可能会访问它（例如，上传到云存储时），那么建议加密私钥。

###  `icon_cache` 目录

_**备份可选。**_

图标缓存存储网站图标，以便它们不需要从登录网站反复获取。它可能不值得备份，除非你真的想避免重新获取大量图标。

恢复备份数据
------

确保 Vaultwarden 停止后，简单地将 `data` 目录中的每个文件或目录替换为其备份版本。

当恢复使用 `.backup` 或 `VACUUM INTO` 创建的备份时，请先删除任何现有的 `db.sqlite3-wal` 文件，因为 SQLite 尝试使用过时/不匹配的 WAL 文件恢复 `db.sqlite3` 时可能会导致数据库损坏。然而，如果您使用 `db.sqlite3` 和其匹配的 `db.sqlite3-wal` 文件的直接拷贝备份了数据库，那么您必须以配对的形式恢复两个文件。您不需要备份或恢复 `db.sqlite3-shm` 文件。

定期运行从备份恢复的过程，仅仅是为了验证你的备份是否正常工作。当进行此操作时，请确保将你的原始数据复制一份或移动一份，以防你的备份实际上没有正常工作。

示例
--

这个部分包含第三方备份示例的索引。您应该仔细查看一个示例并了解它在做什么，然后再使用它。

*   [https://github.com/ttionya/vaultwarden-backup](https://github.com/ttionya/vaultwarden-backup)
*   [https://github.com/shivpatel/bitwarden\_rs-local-backup](https://github.com/shivpatel/bitwarden_rs-local-backup)
*   [https://github.com/shivpatel/bitwarden\_rs\_dropbox\_backup](https://github.com/shivpatel/bitwarden_rs_dropbox_backup)
*   [https://gitlab.com/1O/vaultwarden-backup](https://gitlab.com/1O/vaultwarden-backup)
*   [https://github.com/jjlin/vaultwarden-backup](https://github.com/jjlin/vaultwarden-backup)
*   [https://github.com/jmqm/vaultwarden\_backup](https://github.com/jmqm/vaultwarden_backup)

## 阿里云docker镜像加速

阿里云镜像加速有问题，请换其它加速服务

[【求助】Vaultwarden数据恢复问题-美国VPS综合讨论-全球主机交流论坛 - Powered by Discuz!](https://hostloc.com/thread-1356392-1-1.html)
