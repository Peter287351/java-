import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'docker-04-compose-001',
    type: 'single',
    difficulty: 1,
    tags: ['Compose'],
    stem: `docker compose 主要解决什么问题？`,
    options: [
      { key: 'A', text: '用一个声明式文件定义并管理一组互相配合的容器' },
      { key: 'B', text: '替代 JVM 执行 Java 字节码' },
      { key: 'C', text: '自动生成数据库表结构' },
      { key: 'D', text: '给镜像做安全漏洞扫描' },
    ],
    answers: ['A'],
    explanation: `Compose 管的是多容器应用的编排（服务、网络、卷、启动顺序）。B、C、D 分别是 JVM、ORM/迁移工具与镜像扫描工具的职责。`,
  },
  {
    id: 'docker-04-compose-002',
    type: 'single',
    difficulty: 1,
    tags: ['Compose'],
    stem: `后台创建并启动 compose 文件里所有服务，应使用？`,
    options: [
      { key: 'A', text: 'docker compose up -d' },
      { key: 'B', text: 'docker compose config' },
      { key: 'C', text: 'docker compose down' },
      { key: 'D', text: 'docker build .' },
    ],
    answers: ['A'],
    explanation: `up -d 创建并在后台运行；config 只做语法校验与渲染，down 是停止清理，build 属于镜像构建命令。`,
  },
  {
    id: 'docker-04-compose-003',
    type: 'single',
    difficulty: 2,
    tags: ['depends_on'],
    stem: `depends_on: - db 能保证什么？`,
    options: [
      { key: 'A', text: '保证 db 完全初始化完成、可以接受连接' },
      { key: 'B', text: '只保证 db 容器先被创建/启动，不保证服务就绪' },
      { key: 'C', text: '保证 db 数据已备份' },
      { key: 'D', text: '保证 app 永不重启' },
    ],
    answers: ['B'],
    explanation: `depends_on 是启动顺序约束，不是就绪探针。要等就绪需给 db 配 healthcheck 并使用 condition: service_healthy，或在应用侧做连接重试。A 是常见误解，C、D 无关。`,
  },
  {
    id: 'docker-04-compose-004',
    type: 'single',
    difficulty: 2,
    tags: ['日志'],
    stem: `只想跟踪 compose 里 app 服务最后 100 行日志，应使用？`,
    options: [
      { key: 'A', text: 'docker compose logs --tail=100 -f app' },
      { key: 'B', text: 'docker compose ps app' },
      { key: 'C', text: 'docker compose config app' },
      { key: 'D', text: 'docker image ls app' },
    ],
    answers: ['A'],
    explanation: `logs 加 --tail 限制行数、-f 持续跟随、最后跟服务名。B 看状态，C 校验配置，D 列镜像。`,
  },
  {
    id: 'docker-04-compose-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['Compose'],
    stem: `关于 docker compose 生命周期，说法正确的有哪些？`,
    options: [
      { key: 'A', text: 'down 默认删除容器与网络，但保留命名卷' },
      { key: 'B', text: 'down -v 会连命名卷一起删除' },
      { key: 'C', text: '修改 environment 后需要让服务重建容器才会生效' },
      { key: 'D', text: 'restart 会重新读取 compose 文件并应用新的镜像标签' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 正确。D 错：restart 只重启现有容器，不重建；要应用新配置需要 up -d 触发重建。`,
  },
  {
    id: 'docker-04-compose-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['编排排障'],
    scenario: `Compose 里 app 启动时报 Communications link failure，db 容器的日志显示仍在初始化数据文件，几十秒后 db 正常。手动重启 app 就好了。`,
    stem: `最贴近根因、且能自动避免的方案是？`,
    options: [
      { key: 'A', text: '给 db 加 healthcheck，让 app 依赖 condition: service_healthy，并在应用侧保留连接重试' },
      { key: 'B', text: '把 app 的 restart 改成 no' },
      { key: 'C', text: '把数据库端口改成 3307' },
      { key: 'D', text: '删除 db 的卷让它每次重新初始化' },
    ],
    answers: ['A'],
    explanation: `depends_on 不等待就绪，db 初始化慢导致 app 首次连接失败。健康检查 + 服务就绪条件 + 应用重试是标准解法。B、C 无关，D 反而每次都触发慢初始化并丢数据。`,
  },
  {
    id: 'docker-04-compose-007',
    type: 'code',
    difficulty: 3,
    tags: ['连接串'],
    stem: `读下面 compose 片段，app 里数据库连接串的主机部分应该写什么？

~~~yaml
services:
  app:
    image: myapp:1.0
    depends_on:
      - db
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: example
~~~`,
    options: [
      { key: 'A', text: 'db' },
      { key: 'B', text: 'localhost' },
      { key: 'C', text: '127.0.0.1' },
      { key: 'D', text: '0.0.0.0' },
    ],
    answers: ['A'],
    explanation: `同一 Compose 网络里服务名 db 会被 Docker DNS 解析到 db 容器。B、C 指向 app 容器自身，D 是监听地址而不是目标主机。`,
  },
]
