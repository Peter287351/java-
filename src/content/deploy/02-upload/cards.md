## 从本地到服务器：打包与上传

### 是什么
Spring Boot 用 `mvn package` 产出可执行 fat jar（内嵌 Tomcat），`java -jar app.jar` 即可运行。上传常用 `scp` / `sftp` / `rsync`，大文件与频繁更新优先 rsync（增量）。

### 怎么用
标准流程：本地构建 → 传到 `/opt/app/` → 备份旧 jar → 替换 → 停旧进程 → 起新进程 → 看健康检查。永远保留上一版 jar，回滚只需要换回来。

### 常见坑
- fat jar 不能当普通 jar 用 `java -cp` 启动，嵌套 jar 需要 Spring Boot 的 JarLauncher。
- 直接覆盖正在运行的 jar 可能导致类加载异常，先停进程再替换。
- 把数据库密码写进 jar 或启动命令，会随脚本泄露，应放环境变量或配置中心。

### 面试怎么问
「怎么把一个 Spring Boot 应用部署到服务器？」答构建、传输、进程守护、反向代理、健康检查、回滚预案这条完整链路。

## 进程守护与优雅停机

### 是什么
`nohup java -jar app.jar > app.log 2>&1 &` 让进程在 SSH 断开后继续跑；生产更推荐 systemd：定义 Unit 的 `ExecStart`、`Restart=always`、`After=network.target`，用 `systemctl start/enable/status` 管理。

### 怎么用
systemd 里配 `Environment=` 注入 profile 与 JVM 参数，配 `WorkingDirectory` 固定相对路径，配 `StandardOutput` 或让应用自己写日志。发版用 `systemctl restart` 并观察状态。

### 常见坑
- `&` 只放到后台，不等于守护；终端关闭仍可能收到 SIGHUP。
- `Restart=always` 会掩盖启动即崩的问题，要配合日志与告警看重启次数。
- 直接 kill -9 会跳过优雅停机，可能造成正在处理的请求中断；优先 `kill -TERM` 或 actuator shutdown。

### 面试怎么问
「SSH 一断开应用就停了，为什么？」答没做进程守护，会话结束时收到挂断信号。

## 动手清单
1. 用 nohup 起一个后台进程，退出终端后重连验证它是否还在。
2. 写一个最小 systemd unit（ExecStart / Restart / WorkingDirectory），用 systemctl status 观察状态与最近日志。
