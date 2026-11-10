import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'docker-03-volume-network-001',
    type: 'single',
    difficulty: 1,
    tags: ['数据卷'],
    stem: `给数据库容器挂数据卷的主要目的是？`,
    options: [
      { key: 'A', text: '让容器删除重建后数据仍然保留' },
      { key: 'B', text: '让镜像体积变小' },
      { key: 'C', text: '自动给容器分配公网 IP' },
      { key: 'D', text: '替代 Dockerfile 的 FROM 指令' },
    ],
    answers: ['A'],
    explanation: `容器可写层随容器销毁，卷把数据保存在容器之外，重建容器时重新挂载即可。B、C、D 都不是卷的作用。`,
  },
  {
    id: 'docker-03-volume-network-002',
    type: 'single',
    difficulty: 1,
    tags: ['挂载'],
    stem: `docker run -v /opt/conf:/app/conf nginx 属于哪种挂载？`,
    options: [
      { key: 'A', text: '命名卷' },
      { key: 'B', text: '绑定挂载（宿主机目录挂到容器路径）' },
      { key: 'C', text: '内存文件系统 tmpfs' },
      { key: 'D', text: '镜像分层' },
    ],
    answers: ['B'],
    explanation: `-v 左边是宿主机绝对路径时是 bind mount；左边只是一个名字（如 dbdata）才是命名卷。C 需要 --tmpfs，D 是构建期概念。`,
  },
  {
    id: 'docker-03-volume-network-003',
    type: 'single',
    difficulty: 2,
    tags: ['容器网络'],
    stem: `在 Compose 的同一自定义网络里，app 容器访问 db 容器应写？`,
    options: [
      { key: 'A', text: '127.0.0.1:3306' },
      { key: 'B', text: 'db:3306（服务名由 Docker DNS 解析）' },
      { key: 'C', text: 'localhost:3306' },
      { key: 'D', text: '宿主机的公网 IP:3306' },
    ],
    answers: ['B'],
    explanation: `自定义网络内 Docker 内置 DNS 按服务名解析到容器 IP。A、C 指的是 app 容器自己，D 绕到外网且依赖额外放行。`,
  },
  {
    id: 'docker-03-volume-network-004',
    type: 'single',
    difficulty: 2,
    tags: ['端口'],
    stem: `容器里的应用只监听 127.0.0.1:8080，即使做了 -p 8080:8080，外部仍访问不到，原因是？`,
    options: [
      { key: 'A', text: '端口映射只转发到容器网卡，应用没在 0.0.0.0 上监听就收不到' },
      { key: 'B', text: 'Docker 不支持 8080 端口' },
      { key: 'C', text: '必须把镜像换成 alpine 版本' },
      { key: 'D', text: '-p 需要写成 8080:8081' },
    ],
    answers: ['A'],
    explanation: `映射到容器的流量到达容器网卡地址，只绑回环地址的进程不会接收；应用需监听 0.0.0.0。B、C、D 与该现象无关。`,
  },
  {
    id: 'docker-03-volume-network-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['卷与网络'],
    stem: `下列说法正确的有哪些？`,
    options: [
      { key: 'A', text: '命名卷由 Docker 管理，删除容器不会默认删除卷' },
      { key: 'B', text: '绑定挂载会用宿主机目录内容覆盖容器内对应路径' },
      { key: 'C', text: '自定义 bridge 网络支持按服务名做 DNS 解析' },
      { key: 'D', text: 'docker compose down -v 只停容器，卷一定保留' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 正确。D 错：-v 参数会同时删除 Compose 项目声明的卷，是生产上最危险的命令之一。`,
  },
  {
    id: 'docker-03-volume-network-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['数据持久化'],
    scenario: `MySQL 容器用 docker run 直接启动、没挂任何卷。一次发版把容器 rm 后重建，发现业务数据全没了。`,
    stem: `根因与最直接的改进是？`,
    options: [
      { key: 'A', text: 'MySQL 镜像版本太旧，升级即可' },
      { key: 'B', text: '数据写在容器可写层，随容器删除丢失；改用命名卷挂载 /var/lib/mysql 并做定期备份' },
      { key: 'C', text: '给容器加 --restart always 就能保留数据' },
      { key: 'D', text: '把数据写到容器内的 /tmp 目录即可' },
    ],
    answers: ['B'],
    explanation: `容器可写层不是持久存储，必须挂卷并配套备份。A 与数据丢失无关，C 只管进程重启，D 仍在容器可写层。`,
  },
  {
    id: 'docker-03-volume-network-007',
    type: 'code',
    difficulty: 3,
    tags: ['挂载判读'],
    stem: `读下面命令，应用写的 /app/logs/a.log 实际落在哪？

~~~bash
docker run -d -v /opt/logs:/app/logs -v dbdata:/var/lib/mysql myapp:1.0
~~~`,
    options: [
      { key: 'A', text: '宿主机 /opt/logs/a.log' },
      { key: 'B', text: '命名卷 dbdata 里' },
      { key: 'C', text: '只存在于容器可写层，删容器即丢' },
      { key: 'D', text: '镜像的只读层里' },
    ],
    answers: ['A'],
    explanation: `/app/logs 绑定挂载到宿主机 /opt/logs，写入直接落到该目录；dbdata 只对应 /var/lib/mysql。B 挂错路径，C 忽略了挂载，D 与只读层矛盾。`,
  },
]
