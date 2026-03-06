---
tags:
  - 环境变量
  - Vaultwarden
author: 竹林听雨
title: Vaultwarden环境变量
abbrlink: 74786dc6
published: 2025-02-22 00:00:00
---
```config
# shellcheck disable=SC2034,SC2148
## Vaultwarden 配置文件
## 取消注释以下任何行以更改默认设置
##
## 请注意，如果在管理员界面中更改了这些设置，则大多数设置将被覆盖。这些覆盖会存储在 DATA_FOLDER/config.json 文件中。
##
## 默认情况下，Vaultwarden 希望此文件名为“.env”，并位于当前工作目录中。如果不是这种情况，可以在启动 Vaultwarden 之前设置环境变量 ENV_FILE 指向此文件的位置。

####################
### 数据文件夹 ###
####################

## 主数据文件夹
# DATA_FOLDER=data

## 单独的文件夹，这些选项会覆盖 %DATA_FOLDER%
# RSA_KEY_FILENAME=data/rsa_key
# ICON_CACHE_FOLDER=data/icon_cache
# ATTACHMENTS_FOLDER=data/attachments
# SENDS_FOLDER=data/sends
# TMP_FOLDER=data/tmp

## 模板数据文件夹，默认使用嵌入式模板
## 查看源代码以了解格式
# TEMPLATES_FOLDER=data/templates
## 对每个请求自动重新加载模板，较慢，仅用于开发环境
# RELOAD_TEMPLATES=false

## Web 密码库设置
# WEB_VAULT_FOLDER=web-vault/
# WEB_VAULT_ENABLED=true

#########################
### 数据库设置 ###
#########################

## 数据库 URL
## 使用 SQLite 时，这是 DB 文件的路径，默认为 %DATA_FOLDER%/db.sqlite3
# DATABASE_URL=data/db.sqlite3
## 使用 MySQL 时，请指定适当的连接 URI。
## 详情：https://docs.diesel.rs/2.1.x/diesel/mysql/struct.MysqlConnection.html
# DATABASE_URL=mysql://用户名:密码@主机[:端口]/数据库名
## 使用 PostgreSQL 时，请指定适当的连接 URI（推荐）或关键字/值连接字符串。
## 详情：
## - https://docs.diesel.rs/2.1.x/diesel/pg/struct.PgConnection.html
## - https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING
# DATABASE_URL=postgresql://用户名:密码@主机[:端口]/数据库名

## 启用 WAL（预写日志）
## 设置为 false 以避免在启动时启用 WAL。
## 注意，如果数据库已启用 WAL，您还需要在数据库中禁用 WAL，此设置仅阻止 Vaultwarden 在启动时自动启用它。
## 请先阅读项目 wiki 页面中的相关设置，因为修改此值可能会导致性能下降或使服务无法启动。
# ENABLE_DB_WAL=true

## 数据库连接重试次数
## 启动期间尝试连接数据库的次数，每次重试间隔 1 秒，设置为 0 表示无限次重试
# DB_CONNECTION_RETRIES=15

## 数据库超时时间
## 获取数据库连接的超时时间
# DATABASE_TIMEOUT=30

## 数据库最大连接数
## 定义用于连接数据库的连接池大小。
# DATABASE_MAX_CONNS=10

## 数据库连接初始化
## 允许在创建新数据库连接时运行 SQL 语句。
## 这主要用于连接范围的指令。
## 如果为空，则使用数据库特定的默认值：
## - SQLite: "PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;"
## - MySQL: ""
## - PostgreSQL: ""
# DATABASE_CONN_INIT=""

#################
### WebSocket ###
#################

## 启用 WebSocket 通知
# ENABLE_WEBSOCKET=true

##########################
### 推送通知 ###
##########################

## 启用推送通知（需要从 https://bitwarden.com/host 获取密钥和 ID）
## 关于移动客户端推送通知的详情：
## - https://github.com/dani-garcia/vaultwarden/wiki/Enabling-Mobile-Client-push-notification
# PUSH_ENABLED=false
# PUSH_INSTALLATION_ID=请替换此处
# PUSH_INSTALLATION_KEY=请替换此处

# 警告：除非完全理解其含义，否则不要修改以下设置！
# 默认推送中继和身份验证 URI
# PUSH_RELAY_URI=https://push.bitwarden.com
# PUSH_IDENTITY_URI=https://identity.bitwarden.com
# 欧盟数据区域设置
# 如果选择了“欧盟”作为您的数据区域，请使用以下 URI：
# PUSH_RELAY_URI=https://api.bitwarden.eu
# PUSH_IDENTITY_URI=https://identity.bitwarden.eu

#####################
### 计划任务 ###
#####################

## 计划任务设置
##
## 任务计划使用类似 cron 的语法（由 https://crates.io/crates/cron 解析），并且始终基于 UTC 时间（无论您的本地时区设置如何）。
##
## 该格式与 crontab 略有不同，因为 crontab 不包含秒。
## 您可以在这里测试格式：https://crontab.guru，但请删除第一个数字！
## 秒   分   小时   月份中的某天    月   星期中的某天
## "0   30   9,12,15     1,15       May-Aug  Mon,Wed,Fri"
## "0   30     *          *            *          *     "
## "0   30     1          *            *          *     "
##
## 工作调度线程检查需要运行的任务的时间间隔（毫秒）。设置为 0 可全局禁用计划任务。
# JOB_POLL_INTERVAL_MS=30000
##
## 检查已过删除日期的发送任务的计划。默认每小时一次（整点后 5 分钟）。留空可禁用此任务。
# SEND_PURGE_SCHEDULE="0 5 * * * *"
##
## 检查应永久删除的垃圾箱项目的计划。默认每天一次（午夜后 5 分钟）。留空可禁用此任务。
# TRASH_PURGE_SCHEDULE="0 5 0 * * *"
##
## 检查未完成的双因素登录的计划。默认每分钟一次。留空可禁用此任务。
# INCOMPLETE_2FA_SCHEDULE="30 * * * * *"
##
## 发送紧急访问授权人到期提醒的计划。默认每小时一次（整点后 3 分钟）。留空可禁用此任务。
# EMERGENCY_NOTIFICATION_REMINDER_SCHEDULE="0 3 * * * *"
##
## 处理已达到等待时间的紧急访问请求的计划。默认每小时一次（整点后 7 分钟）。留空可禁用此任务。
# EMERGENCY_REQUEST_TIMEOUT_SCHEDULE="0 7 * * * *"
##
## 清理事件表中旧事件的计划。默认每天执行一次。如果不设置 EVENTS_DAYS_RETAIN，此任务不会启动。
# EVENT_CLEANUP_SCHEDULE="0 10 0 * * *"
## 数据库中保留事件的天数。
## 如果未设置（默认），事件将无限期保留，并禁用计划任务！
# EVENTS_DAYS_RETAIN=
##
## 清理数据库中旧认证请求的计划。默认每分钟一次。留空可禁用此任务。
# AUTH_REQUEST_PURGE_SCHEDULE="30 * * * * *"
##
## 清理数据库中过期的 Duo 上下文的计划。如果 Duo MFA 被禁用或设置为使用旧版 iframe 提示，则不执行操作。默认每分钟一次。留空可禁用此任务。
# DUO_CONTEXT_PURGE_SCHEDULE="30 * * * * *"

########################
### 通用设置 ###
########################

## 域名设置
## 域名必须与您访问服务器的地址匹配。
## 推荐配置此值，否则某些功能可能无法工作，如附件下载、电子邮件链接和U2F。
## 要使 U2F 正常工作，服务器必须使用 HTTPS，您可以使用 Let's Encrypt 获取免费证书。
## 使用 HTTPS 的推荐方式是将 Vaultwarden 放在反向代理后面。
## 详情：
## - https://github.com/dani-garcia/vaultwarden/wiki/Enabling-HTTPS
## - https://github.com/dani-garcia/vaultwarden/wiki/Proxy-examples
## 开发环境
# DOMAIN=http://localhost
## 公共服务器
# DOMAIN=https://vw.domain.tld
## 公共服务器（带端口号的URL）
# DOMAIN=https://vw.domain.tld:8443
## 公共服务器（带路径的URL）
# DOMAIN=https://domain.tld/vw

## 控制是否允许用户创建 Bitwarden Sends。
## 此设置对所有用户全局适用。
## 若要按组织控制此设置，请使用“禁用发送”组织策略。
# SENDS_ALLOWED=true

## HIBP API 密钥
## HaveIBeenPwned API 密钥，可在此请求：https://haveibeenpwned.com/API/Key
# HIBP_API_KEY=

## 每个组织的附件存储限制（KB）
## 每个组织允许的最大附件存储量（以 KB 为单位）。
## 当达到此限制时，组织成员将不允许上传更多属于该组织的密码附件。
# ORG_ATTACHMENT_LIMIT=
## 每个用户的附件存储限制（KB）
## 每个用户允许的最大附件存储量（以 KB 为单位）。
## 当达到此限制时，用户将不允许上传更多附件。
# USER_ATTACHMENT_LIMIT=
## 每个用户的发送存储限制（KB）
## 每个用户允许的最大发送存储量（以 KB 为单位）。
## 当达到此限制时，用户将不允许上传更多发送内容。
# USER_SEND_LIMIT=

## 在自动删除已放入回收站的项目前等待的天数。
## 如果未设置（默认），则不会自动删除回收站中的项目。
## 此设置全局适用，因此请确保通知所有用户有关此设置的任何更改。
# TRASH_AUTO_DELETE_DAYS=

## 等待多少分钟后认为两次验证登录不完整，并触发电子邮件通知。不完整的两次验证登录是指提供了正确的主密码但未完成所需的二次验证步骤，这可能表示主密码被泄露。设置为 0 可禁用此检查。
## 此设置对所有用户全局适用。
# INCOMPLETE_2FA_TIME_LIMIT=3

## 禁用图标下载
## 设置为 true 以禁用内部图标服务中的图标下载。
## 这仍然会从 $ICON_CACHE_FOLDER 提供现有图标，而不生成任何外部网络请求。$ICON_CACHE_TTL 也必须设置为 0；否则，现有的图标最终会被删除，但不会再被下载。
# DISABLE_ICON_DOWNLOAD=false

## 控制是否允许新用户注册
# SIGNUPS_ALLOWED=true

## 控制新用户注册时是否需要验证其电子邮件地址。
## 注意，如果将此选项设置为 true，则在验证电子邮件地址之前禁止登录！
## 欢迎邮件中会包含一个验证链接，尝试登录时会定期触发重新发送验证邮件。
# SIGNUPS_VERIFY=false

## 如果 SIGNUPS_VERIFY 设置为 true，这限制了自上次发送电子邮件验证链接后多长时间会再次发送验证邮件（秒）
# SIGNUPS_VERIFY_RESEND_TIME=3600

## 如果 SIGNUPS_VERIFY 设置为 true，这限制了尝试登录时可以重新发送验证邮件的最大次数。
# SIGNUPS_VERIFY_RESEND_LIMIT=6

## 控制来自逗号分隔域名列表的新用户是否可以注册，即使 SIGNUPS_ALLOWED 设置为 false
# SIGNUPS_DOMAINS_WHITELIST=example.com,example.net,example.org

## 控制是否为组织启用事件日志记录。
## 此设置适用于组织。
## 默认情况下禁用。还需检查 EVENT_CLEANUP_SCHEDULE 和 EVENTS_DAYS_RETAIN 设置。
# ORG_EVENTS_ENABLED=false

## 控制哪些用户可以创建新的组织。
## 空或 'all' 表示所有用户都可以创建组织（这是默认值）：
# ORG_CREATION_USERS=
## 'none' 表示没有用户可以创建组织：
# ORG_CREATION_USERS=none
## 逗号分隔列表表示只有这些用户可以创建组织：
# ORG_CREATION_USERS=admin1@example.com,admin2@example.com

## 即使注册被禁用，邀请组织管理员邀请用户
# INVITATIONS_ALLOWED=true
## 在不属于特定组织的邀请电子邮件中显示的名称
# INVITATION_ORG_NAME=Vaultwarden

## 组织邀请令牌、紧急访问邀请令牌、电子邮件验证令牌和删除请求令牌将在多少小时后过期（必须至少为 1 小时）
# INVITATION_EXPIRATION_HOURS=120

## 控制用户是否可以启用对其帐户的紧急访问。
## 此设置对所有用户全局适用。
# EMERGENCY_ACCESS_ALLOWED=true

## 控制用户是否可以更改其电子邮件。
## 此设置对所有用户全局适用。
# EMAIL_CHANGE_ALLOWED=true

## 密码哈希迭代次数用于服务器端密码哈希。
## 新用户的默认值。如果更改，会在用户下次登录时更新现有用户的设置。
# PASSWORD_ITERATIONS=600000

## 控制用户是否可以设置或显示密码提示。此设置对所有用户全局适用。
# PASSWORD_HINTS_ALLOWED=true

## 控制当 SMTP 服务未配置且允许密码提示时，是否应在网页上直接显示密码提示。
## 不建议在公共可访问实例上使用，因为这会提供对潜在敏感数据的未经授权访问。
# SHOW_PASSWORD_HINT=false

#########################
### 高级设置 ###
#########################

## 客户端 IP 头，用于识别客户端的 IP，默认为 "X-Real-IP"
## 设置为字符串 "none"（不带引号），以禁用任何头并仅使用远程 IP
# IP_HEADER=X-Real-IP

## 图标服务
## 预定义的图标服务有：internal, bitwarden, duckduckgo, google。
## 要指定自定义图标服务，请设置一个包含一个 `{}` 的 URL 模板，该模板会被替换为域名。例如：`https://icon.example.com/domain/{}`。
##
## `internal` 指的是 Vaultwarden 内置的图标获取实现。
## 如果设置了外部服务，对 Vaultwarden 的图标请求将返回 HTTP 重定向到外部服务上的相应图标。外部服务可能在您的 Vaultwarden 实例没有外部网络连接时有用，或者如果您担心有人可能会探测您的实例以尝试检测某些站点的图标是否已缓存。
# ICON_SERVICE=internal

## 图标重定向代码
## 用于重定向到外部图标服务的 HTTP 状态码。
## 支持的代码有 301（永久）、302（临时）、307（临时）和 308（永久）。临时重定向在测试不同的图标服务时很有用，但一旦确定了服务，建议使用永久重定向以提高缓存能力。旧版代码目前在 Bitwarden 客户端中支持得更好。
# ICON_REDIRECT_CODE=302

## 成功获取的图标的缓存生存时间（秒），0 表示“永远”
## 默认值：2592000（30天）
# ICON_CACHE_TTL=2592000
## 未找到的图标的缓存生存时间（秒），0 表示“永远”
## 默认值：259200（3天）
# ICON_CACHE_NEGTTL=259200

## 图标下载超时
## 配置下载 favicon 时的超时值。
## 默认是 10 秒，但在较慢的网络连接上可能过低。
# ICON_DOWNLOAD_TIMEOUT=10

## 通过正则表达式阻止 HTTP 域名/IP
## 任何匹配此正则表达式的域名或 IP 都不会被内部 HTTP 客户端获取。
## 对于隐藏本地网络中的其他服务器很有用。更多信息请参阅 WIKI。
## 注意：始终将此正则表达式用单引号括起来！
# HTTP_REQUEST_BLOCK_REGEX='^(192\.168\.0\.[0-9]+|192\.168\.1\.[0-9]+)$'

## 启用此选项将导致内部 HTTP 客户端拒绝连接到任何非全局 IP 地址。
## 用于保护内部环境：参见 https://en.wikipedia.org/wiki/Reserved_IP_addresses 了解其会阻止的 IP 列表。
# HTTP_REQUEST_BLOCK_NON_GLOBAL_IPS=true

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
# EXPERIMENTAL_CLIENT_FEATURE_FLAGS=fido2-vault-credentials

## 要求新设备电子邮件。当用户登录时需要发送一封电子邮件。
## 如果发送电子邮件失败，则登录尝试将失败！
# REQUIRE_DEVICE_EMAIL=false

## 启用扩展日志记录，这将在日志中显示时间戳和目标。
# EXTENDED_LOGGING=true

## 扩展日志记录的时间戳格式。
## 格式说明符：https://docs.rs/chrono/latest/chrono/format/strftime
# LOG_TIMESTAMP_FORMAT="%Y-%m-%d %H:%M:%S.%3f"

## 日志记录到 Syslog
## 这需要扩展日志记录
# USE_SYSLOG=false

## 记录到文件
# LOG_FILE=/path/to/log

## 日志级别
## 更改日志输出的详细程度。
## 有效值为 "trace", "debug", "info", "warn", "error" 和 "off"。
## 将其设置为 "trace" 或 "debug" 也会显示挂载路由和静态文件、WebSocket 和 alive 请求的日志。
## 对于特定模块，可以附加一个逗号分隔的 `path::to::module=log_level`
## 例如，要只为图标查看 info 日志，使用：LOG_LEVEL="info,vaultwarden::api::icons=debug"
# LOG_LEVEL=info

## 管理界面的令牌，最好是 Argon2 PHC 字符串。
## Vaultwarden 提供了一个内置生成器，可以通过调用 `vaultwarden hash` 来生成。
## 详情请参阅：https://github.com/dani-garcia/vaultwarden/wiki/Enabling-admin-page#secure-the-admin_token
## 如果未设置，管理面板将被禁用。
## 新的 Argon2 PHC 字符串
## 注意，在某些环境中，如 docker-compose 中，您需要将所有美元符号 `$` 转义为两个美元符号 `$$`。
## 并且在必要时使用单引号 (') 而不是双引号 (") 包含字符串。
# ADMIN_TOKEN='$argon2id$v=19$m=65540,t=3,p=4$MmeKRnGK5RW5mJS7h3TOL89GrpLPXJPAtTK8FTqj9HM$DqsstvoSAETl9YhnsXbf43WeaUwJC6JhViIvuPoig78'
## 旧的明文字符串（会产生警告，建议使用 Argon2）
# ADMIN_TOKEN=Vy2VyYTTsKPv8W5aEOWUbB/Bt3DEKePbHmI4m9VcemUMS2rEviDowNAFqYi1xjmp

## 启用此选项以绕过管理面板的安全性。此选项仅适用于前面带有单独认证层的情况。
# DISABLE_ADMIN_TOKEN=false

## 在相同的 IP 地址下，两次管理登录请求之间的平均秒数，超过这个时间限制才会触发限速。
# ADMIN_RATELIMIT_SECONDS=300
## 允许的最大突发请求数，同时保持由 `ADMIN_RATELIMIT_SECONDS` 指定的平均值。
# ADMIN_RATELIMIT_MAX_BURST=3

## 设置管理员会话的有效期为此值（分钟）。
# ADMIN_SESSION_LIFETIME=20

## 允许的 iframe 祖先（了解风险！）
## https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
## 允许其他域嵌入 web vault 到 iframe 中，便于嵌入安全的内部网。
## 此值将被添加到 'Content-Security-Policy' 头部的 'frame-ancestors' 值中。
## 多个值必须用空格分隔。
# ALLOWED_IFRAME_ANCESTORS=

## 允许的 connect-src（了解风险！）
## https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src
## 允许其他域加载使用脚本接口（如转发电子邮件别名功能）的 URL。
## 此值将被添加到 'Content-Security-Policy' 头部的 'connect-src' 值中。
## 多个值必须用空格分隔，并且只允许 HTTPS 值。
## 示例："https://my-addy-io.domain.tld https://my-simplelogin.domain.tld"
# ALLOWED_CONNECT_SRC=""

## 在相同的 IP 地址下，两次登录请求之间的平均秒数，超过这个时间限制才会触发限速。
# LOGIN_RATELIMIT_SECONDS=60
## 允许的最大突发请求数，同时保持由 `LOGIN_RATELIMIT_SECONDS` 指定的平均值。
## 注意：这适用于登录和两步验证，因此建议至少允许突发大小为 2。
# LOGIN_RATELIMIT_MAX_BURST=10

## BETA 功能：组
## 控制组织是否启用组支持。
## 此设置适用于组织。
## 默认情况下禁用，因为这是一个 Beta 功能，包含已知问题！
## 了解你在做什么！
# ORG_GROUPS_ENABLED=false

## 增加安全笔记大小限制（了解风险！）
## 将安全笔记大小限制设置为 100_000 而不是默认的 10_000。
## 警告：这可能导致客户端出现问题。此外，在 Bitwarden 服务器上导出将不起作用！
## 了解你在做什么！
# INCREASE_NOTE_SIZE_LIMIT=false

## 强制单组织策略与重置密码策略
## 强制在启用重置密码策略之前启用单组织策略。
## Bitwarden 默认强制执行此策略。在 Vaultwarden 中，我们鼓励使用多个组织，因为组不可用。
## 将此设置为 true 将在启用重置密码策略之前强制启用单组织策略。
# ENFORCE_SINGLE_ORG_WITH_RESET_PW_POLICY=false

########################
### MFA/2FA 设置 ###
########################

## Yubico (Yubikey) 设置
## 设置您的 Yubikey OTP 的 Client ID 和 Secret Key。
## 您可以在此生成：https://upgrade.yubico.com/getapikey/
## 您也可以选择指定一个自定义的 OTP 服务器。
# YUBICO_CLIENT_ID=11111
# YUBICO_SECRET_KEY=AAAAAAAAAAAAAAAAAAAAAAAA
# YUBICO_SERVER=http://yourdomain.com/wsapi/2.0/verify

## Duo 设置
## 您需要配置 DUO_IKEY, DUO_SKEY 和 DUO_HOST 选项以启用全局 Duo 支持。
## 否则用户需要自己配置这些设置。
## 创建账户并保护应用程序，请参阅此链接（仅第一步，其余步骤忽略）：
## https://help.bitwarden.com/article/setup-two-step-login-duo/#create-a-duo-security-account
## 然后根据最后一步获得的值设置以下选项：
# DUO_IKEY=<Client ID>
# DUO_SKEY=<Client Secret>
# DUO_HOST=<API Hostname>
## 之后，您可以继续按照上述链接中的指南操作，
## 忽略那些您已经预先配置的字段。
##
## 如果您想尝试使用 Duo 的 'Traditional Prompt'（已弃用，基于 iframe），将 DUO_USE_IFRAME 设置为 'true'。
## Duo 不再支持此功能，但某些集成仍然有效。
## 如果不确定，请忽略此设置。
# DUO_USE_IFRAME=false

## 邮件 2FA 设置
## 邮件令牌大小
## 邮件 2FA 令牌中的数字位数（最小：6，最大：255）。
## 注意：无论此设置如何，Bitwarden 客户端都硬编码为提及 6 位代码！
# EMAIL_TOKEN_SIZE=6
##
## 令牌过期时间
## 令牌有效的最长时间（秒）。用户打开邮件客户端并复制令牌的时间。
# EMAIL_EXPIRATION_TIME=600
##
## 在重置邮件令牌并需要发送新邮件之前的最大尝试次数。
# EMAIL_ATTEMPTS_LIMIT=3
##
## 无论任何组织策略，设置邮件 2FA
# EMAIL_2FA_ENFORCE_ON_VERIFIED_INVITE=false
## 在需要时自动设置邮件 2FA 作为备用提供程序
# EMAIL_2FA_AUTO_FALLBACK=false

## 其他 MFA/2FA 设置
## 禁用记住 2FA
## 启用此选项将强制用户每次登录时使用第二因素。
## 注意：复选框仍然会显示，但会被忽略。
# DISABLE_2FA_REMEMBER=false
##
## 身份验证器设置
## 禁用身份验证器时间偏移代码的有效性。
## 前 30 秒和后 30 秒的身份验证代码将无效。
##
## 根据 RFC6238（https://tools.ietf.org/html/rfc6238），
## 我们默认允许前一步和下一步的有效 TOTP 代码。
## 但是，这可能会让攻击者更容易成功，因为有 3 个有效的代码。
## 您可以禁用此功能，以便只允许当前的 TOTP 代码。
## 请注意，如果服务器时间偏移，有效的代码可能会被标记为无效。
## 无论如何，一旦代码被使用，它就不能再次使用，并且之前的所有代码也将无效。
# AUTHENTICATOR_DISABLE_TIME_DRIFT=false

###########################
### SMTP 邮件设置 ###
###########################

## 邮件特定设置，设置 SMTP_FROM 并设置 SMTP_HOST 或 USE_SENDMAIL 以启用邮件服务。
## 为了确保电子邮件链接指向正确的主机，请设置 DOMAIN 变量。
## 注意：如果指定了 SMTP_USERNAME，则必须指定 SMTP_PASSWORD。
# SMTP_HOST=smtp.domain.tld
# SMTP_FROM=vaultwarden@domain.tld
# SMTP_FROM_NAME=Vaultwarden
# SMTP_USERNAME=username
# SMTP_PASSWORD=password
# SMTP_TIMEOUT=15

## 选择用于 SMTP 的安全连接类型。默认是 "starttls"。
## 可用选项包括：
## - "starttls": 默认端口是 587。
## - "force_tls": 默认端口是 465。
## - "off": 默认端口是 25。
## 端口 587（提交）和 25（smtp）是标准无加密和通过 STARTTLS 加密的连接。端口 465（提交）用于加密提交（隐式 TLS）。
# SMTP_SECURITY=starttls
# SMTP_PORT=587

# 是否通过 `sendmail` 命令发送邮件
# USE_SENDMAIL=false
# 使用哪个 sendmail 命令。如果没有指定，则使用 $PATH 中找到的命令。
# SENDMAIL_COMMAND="/path/to/sendmail"

## 默认情况下 SSL 是 "Plain" 和 "Login"，非 SSL 连接不使用任何机制。
## 可能的值：["Plain", "Login", "Xoauth2"]。
## 多个选项需要用逗号 ',' 分隔。
# SMTP_AUTH_MECHANISM=

## 发送 SMTP HELO 时使用的服务器名称
## 默认情况下，该值应该是机器的主机名，
## 但如果触发了一些反垃圾邮件过滤器，则可能需要更改此值。
# HELO_NAME=

## 将图像嵌入为邮件附件
# SMTP_EMBED_IMAGES=true

## SMTP 调试
## 当设置为 true 时，这将输出非常详细的 SMTP 消息。
## 警告：这可能包含敏感信息如密码和用户名！仅在故障排除时启用！
# SMTP_DEBUG=false

## 接受无效证书
## 危险：此选项引入了中间人攻击的重大漏洞！
## 仅在无法使用有效证书时作为最后手段使用。
## 如果证书有效但主机名不匹配，请使用 SMTP_ACCEPT_INVALID_HOSTNAMES。
# SMTP_ACCEPT_INVALID_CERTS=false

## 接受无效主机名
## 危险：此选项引入了中间人攻击的重大漏洞！
## 仅在无法使用有效证书时作为最后手段使用。
# SMTP_ACCEPT_INVALID_HOSTNAMES=false

#######################
### Rocket 设置 ###
#######################

## Rocket 特定设置
## 详情请参见：https://rocket.rs/v0.5/guide/configuration/
# ROCKET_ADDRESS=0.0.0.0
## 默认端口是 8000，除非在 Docker 容器中运行，在这种情况下，默认端口是 80。
# ROCKET_PORT=8000
# ROCKET_TLS={certs="/path/to/certs.pem",key="/path/to/key.pem"}

# vim: syntax=ini

```