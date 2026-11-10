## Compose 文件结构

### 是什么
`docker-compose.yml` 用声明式方式定义一组服务：`services` 下每个服务指定 image/build、ports、environment、volumes、networks、depends_on、restart、healthcheck；顶层 `volumes` / `networks` 声明共享资源。

### 怎么用
`docker compose up -d` 创建并后台启动，`docker compose ps` 看状态，`docker compose logs -f app` 看日志，`docker compose exec app sh` 进容器，`docker compose down` 停止并清理容器与网络。

### 常见坑
- `depends_on` 只控制启动顺序，不等待依赖「就绪」；数据库还在初始化时应用就可能连不上。
- `down` 默认删容器与网络但保留卷，加 `-v` 会连卷一起删。
- 改了 `environment` 或镜像后要 `up -d` 让 Compose 重建容器，光重启不生效。

### 面试怎么问
「depends_on 能保证数据库可用吗？」答不能，要配合 healthcheck + condition: service_healthy 或应用侧重试。

## 编排排障顺序

### 是什么
多容器问题的排查顺序：看容器状态 → 看单个服务日志 → 确认网络与端口 → 确认环境变量与配置 → 确认依赖是否就绪。

### 怎么用
`docker compose ps` 找出 Restarting / Exited 的服务，`docker compose logs --tail=100 app` 定位异常，`docker compose exec app ping db` 验证网络连通，最后检查连接串里的主机名是否用了服务名。

### 常见坑
- 应用连接串写成 `localhost`，在容器里指自己，永远连不上 db 服务。
- 宿主机端口被占用会导致 up 失败，报错在端口映射那一行。
- 只重启 app 不重建，旧环境变量还在，改配置看起来「没生效」。

### 面试怎么问
「Compose 里 app 起不来你怎么查？」答状态 → 日志 → 网络 → 配置 → 依赖就绪，并说出具体命令。

## 动手清单
1. 写一个 app + db 两服务的 compose 文件，故意把数据库地址写成 localhost，观察报错后改成服务名。
2. 给 db 加 healthcheck，让 app 用 depends_on 的 service_healthy 条件启动，对比加之前的启动失败率。
