---
author: 竹林听雨
tags:
  - Bitwarden
  - Vaultwarden
title: Vaultwarden备份脚本
abbrlink: 4d6390f3
published: 2025-02-20 00:00:00
---
# 打包备份版本

```bash
#!/bin/bash

# 设置备份存储目录（请根据需要修改路径）
BACKUP_DIR="./rclone_backup"

# 当前日期
DATE=$(date +%F-%H%M%S)

# Vaultwarden 数据目录
VW_DATA_DIR="./vw_data"

# 备份文件名
BACKUP_FILE="$BACKUP_DIR/vw-backup-$DATE.tar.gz"

#定义远程数组
REMOTE_DIRS=("jianguoyun:/Vaultwarden备份/" "onedrive:/Vaultwarden备份/")

# 日志文件
LOG_FILE="./rclone-days.log"

# 创建备份，并排除 vaultwarden.log 文件和 icon_cache，sends 目录
tar --exclude='vaultwarden.log' --exclude='icon_cache' --exclude='sends' -czvf $BACKUP_FILE $VW_DATA_DIR

# 保留最近 7 天的备份，删除旧备份
find $BACKUP_DIR -type f -name "vw-backup-*.tar.gz" -mtime +7 -exec rm {} \;

for remote_dir in "${REMOTE_DIRS[@]}"
do
	# 备份文件
	rclone -v copy "$BACKUP_FILE" "$remote_dir" -P --log-file=$LOG_FILE
done

echo "Vaultwarden 数据备份已完成: $BACKUP_FILE"

```

# 每日备份（不打包）
```bash
#!/bin/bash

#定义数据库匹配
SOURCE_P_SQL="db.sqlite3*"
#定义rsa_key* 匹配
SOURCE_P_KEY="rsa_key*"
#定义配置文件名
SOURCE_CONFIG="config.json"
#定义数据目录
SOURCE_DATA_DIR="./vw_data/"
#定义日志存放目录
LOGS_DIR="./rclone_logs"
#定义数据目录内需要备份的子目录数组
SOURCE_BACKUP_DIRS=("attachments" "sends")
#定义远程数组
REMOTE_DIRS=("jianguoyun:/Vaultwarden备份t/" "onedrive:/Vaultwarden备份t/")


for remote_dir in "${REMOTE_DIRS[@]}"
do
    # 日志文件
	LOG_FILE="./rclone-days.log"

	# 使用 --include 备份 db.sqlite3* 文件
	rclone -v copy "$SOURCE_DATA_DIR" "$remote_dir" --include "$SOURCE_P_SQL" -P --log-file=$LOG_FILE

	# 使用 --include 备份 rsa_key* 文件
	rclone -v copy "$SOURCE_DATA_DIR" "$remote_dir" --include "$SOURCE_P_KEY" -P --log-file=$LOG_FILE

	# 备份 config.json 文件
	rclone -v copy "$SOURCE_DATA_DIR$SOURCE_CONFIG" "$remote_dir" -P --log-file=$LOG_FILE

	# 备份目录文件
	for dir in "${SOURCE_BACKUP_DIRS[@]}"
	do
		rclone -v sync "$SOURCE_DATA_DIR$dir" "$remote_dir$dir" -P --log-file=$LOG_FILE
	done
done

```

