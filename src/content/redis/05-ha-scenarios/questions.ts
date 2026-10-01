import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'redis-05-ha-scenarios-001',
    type: 'single',
    difficulty: 2,
    tags: ['主从复制'],
    stem: '从库第一次连接主库时执行的"全量复制"，其数据来源是？',
    options: [
      { key: 'A', text: '主库把内存数据逐条命令发给从库' },
      { key: 'B', text: '主库 BGSAVE 生成 RDB 发送给从库，期间的新写命令通过缓冲区补发' },
      { key: 'C', text: '从库自己去拉取最新 AOF 文件' },
      { key: 'D', text: '从库直接拷贝主库的数据目录文件' },
    ],
    answers: ['B'],
    explanation:
      '全量同步 = 主库 bgsave 出 RDB 传输给从库加载 + 复制缓冲区补发期间增量；此后走增量同步（repl_backlog）。A 顺序反了；C/D 是杜撰的机制。',
  },
  {
    id: 'redis-05-ha-scenarios-002',
    type: 'single',
    difficulty: 2,
    tags: ['哨兵'],
    stem: '哨兵判定主库"客观下线"的条件是？',
    options: [
      { key: 'A', text: '任意一个哨兵 ping 不通主库' },
      { key: 'B', text: '超过 quorum 配置数量的哨兵都认为主库主观下线' },
      { key: 'C', text: '所有从库都报告与主库断开' },
      { key: 'D', text: '客户端连续收到连接超时' },
    ],
    answers: ['B'],
    explanation:
      '单个哨兵 ping 超时是主观下线（可能只是它自己网络抖动）；它询问其他哨兵，达到 quorum 票数才升级为客观下线，随后进入选主与故障转移流程。A 是主观下线；C/D 都不是哨兵的判定标准。',
  },
  {
    id: 'redis-05-ha-scenarios-003',
    type: 'single',
    difficulty: 2,
    tags: ['Cluster'],
    stem: 'Redis Cluster 把数据划分到 16384 个哈希槽，单个 key 的路由规则是？',
    options: [
      { key: 'A', text: '按 key 的长度取模' },
      { key: 'B', text: 'CRC16(key) % 16384 决定所在槽，槽分配给各主节点' },
      { key: 'C', text: '按写入时间轮询分配' },
      { key: 'D', text: '由客户端自行随机选择节点，各节点全量存储' },
    ],
    answers: ['B'],
    explanation:
      'Cluster 是分片而非复制：每个主节点负责一段槽区间，key 经 CRC16 哈希取模定位；不在本节点的 key 返回 MOVED 让客户端重定向。D 描述的是"每个节点都是完整副本"的错误模型。',
  },
  {
    id: 'redis-05-ha-scenarios-004',
    type: 'code',
    difficulty: 3,
    tags: ['Cluster', 'hash tag'],
    stem: 'Cluster 模式下执行以下命令报错 CROSSSLOT，原因是？\n\n~~~bash\nMGET user:1001:profile user:1001:orders\n~~~',
    options: [
      { key: 'A', text: 'MGET 一次最多只能取一个 key' },
      { key: 'B', text: '两个 key 经 CRC16 取模落在不同槽（不同节点），多 key 命令要求同槽；应改用 hash tag 如 {user1001}:profile / {user1001}:orders' },
      { key: 'C', text: 'Cluster 模式不支持 MGET' },
      { key: 'D', text: 'key 中包含冒号是非法字符' },
    ],
    answers: ['B'],
    explanation:
      'Cluster 的多 key 命令/事务/Lua 都要求所有 key 位于同一槽，否则报 CROSSSLOT；hash tag 让 `{}` 内内容参与哈希，从而把相关 key 固定到同一槽（注意会牺牲一定的分布均匀性）。C/D 错误。',
  },
  {
    id: 'redis-05-ha-scenarios-005',
    type: 'scenario',
    difficulty: 3,
    tags: ['热 key'],
    scenario:
      '监控发现某直播间相关 key 的 QPS 占单节点总量 60%，节点 CPU 与带宽告警；这些 key 每秒被数万次读取、每分钟只更新一次。',
    stem: '治理组合最合理的是？',
    options: [
      { key: 'A', text: '把该节点的 maxmemory 调大一倍' },
      { key: 'B', text: '热 key：应用侧加本地缓存（Caffeine，秒级 TTL）拦截读流量，必要时 key 拆多副本分散；更新仍走 Redis 失效通知' },
      { key: 'C', text: '把热 key 的 value 压缩，减少带宽' },
      { key: 'D', text: '直接删除这些 key，让请求都去查数据库' },
    ],
    answers: ['B'],
    explanation:
      '"读极多写极少"是热 key 教科书特征：本地缓存就近拦截，Redis 只承担更新与兜底；多副本可再分摊。A 治内存不治带宽与 CPU；C 只减小 payload，QPS 不变；D 是反向操作，把压力转嫁给 DB。',
  },
  {
    id: 'redis-05-ha-scenarios-006',
    type: 'single',
    difficulty: 3,
    tags: ['大 key'],
    stem: '发现一个 5MB 的 Hash 大 key 需要删除，正确的姿势是？',
    options: [
      { key: 'A', text: '直接 DEL，InnoDB 会后台回收' },
      { key: 'B', text: '用 UNLINK 异步删除（或 4.0 前用 SCAN 分批 HDEL 字段），避免单线程同步释放造成阻塞' },
      { key: 'C', text: 'FLUSHDB 清掉重来' },
      { key: 'D', text: '把 value 改成 "" 之后再 DEL' },
    ],
    answers: ['B'],
    explanation:
      'DEL 一个大 key 时释放内存的动作在主线程同步执行，可能造成明显卡顿；UNLINK 把释放交给后台线程，或按字段分批删。A 把 MySQL 的机制安到 Redis 头上；C 影响面巨大；D 先写空同样是一次大 value 写入，没有解决删除阻塞。',
  },
  {
    id: 'redis-05-ha-scenarios-007',
    type: 'single',
    difficulty: 2,
    tags: ['选型'],
    stem: '业务数据总量 20GB、QPS 3 万，要求主库故障 30 秒内自动切换。更合适的架构是？',
    options: [
      { key: 'A', text: '单实例，靠备份恢复' },
      { key: 'B', text: '一主二从 + 哨兵' },
      { key: 'C', text: 'Cluster 集群 6 节点起步' },
      { key: 'D', text: '主从复制但不部署哨兵，故障时人工切换' },
    ],
    answers: ['B'],
    explanation:
      '20GB 单机轻松承载，核心诉求是自动故障转移——主从 + 哨兵即可满足，运维最简。A 不满足 30 秒恢复；D 不满足"自动"；C 的 20GB/3 万 QPS 用不上分片，反而引入多 key 命令限制等复杂度。',
  },
  {
    id: 'redis-05-ha-scenarios-008',
    type: 'multiple',
    difficulty: 2,
    tags: ['场景选型'],
    stem: '下列业务与 Redis 特性的匹配，正确的有？',
    options: [
      { key: 'A', text: '延迟队列：Zset 以执行时间戳为 score，轮询到期任务' },
      { key: 'B', text: '分布式会话：String/Hash 存 session，多实例共享' },
      { key: 'C', text: '附近的人：GEO（底层 Zset + GeoHash）' },
      { key: 'D', text: '强一致的账户余额扣减：直接用 Redis 做唯一事实来源' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A/B/C 都是经典用法。D 错误——Redis 异步持久化与主从复制决定了它不适合做强一致资金数据的唯一事实来源，余额扣减应以 DB 为准，Redis 只做加速或预扣。',
  },
  {
    id: 'redis-05-ha-scenarios-009',
    type: 'scenario',
    difficulty: 3,
    tags: ['秒杀', '预扣库存'],
    scenario:
      '秒杀方案：把 1000 件库存预热到 Redis（String DECR 原子预扣），扣到 0 的请求直接拒绝；MySQL 仍以乐观锁扣减为唯一事实来源。评审时有同事提出两个疑问：①"Redis 扣成功了但 DB 那步失败，库存岂不是永久少卖？"②"Redis 与 DB 库存怎么对账？"',
    stem: '对该架构的解释与完善，最准确的是？',
    options: [
      { key: 'A', text: 'Redis 预扣只做「挡量」，不是最终库存：DB 失败/订单超时取消时按预扣记录回补 Redis（INCR）；以 DB 扣减结果为准做对账（定时比对 DB 实际扣减量与 Redis 计数），差值告警人工或自动校准' },
      { key: 'B', text: '把 Redis 当唯一库存：DB 扣减失败就丢弃，不做回补，少卖总比超卖好' },
      { key: 'C', text: '每秒把 DB 库存全量刷新覆盖到 Redis，保证两边永远一致' },
      { key: 'D', text: '预扣成功后事务里同步等待 DB 扣减结果，失败立刻把事务回滚，Redis 不需要任何补偿' },
    ],
    answers: ['A'],
    explanation:
      '秒杀预扣的正确心智模型是「Redis 挡掉 99% 的无效流量，DB 乐观锁守住不超卖」：Redis 扣减与 DB 扣减是两个系统，必然存在中间失败，因此必须设计补偿（回补 INCR）与对账（以 DB 为准校准 Redis）。B 主动接受少卖且无对账，故障时无法发现；C 全量覆盖在并发预扣下会把已扣量的计数冲掉（覆盖窗口内的扣减全部丢失），还引入秒级延迟；D 让 DB 性能问题直接反压到 Redis 扣减路径，秒杀高频下事务长时间挂起反而放大风险——回补应异步执行。',
  },
]
