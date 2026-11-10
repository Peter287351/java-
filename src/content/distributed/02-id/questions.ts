import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'distributed-02-id-001',
    type: 'single',
    difficulty: 1,
    tags: ['UUID'],
    stem: `UUID 作为数据库聚簇索引主键，最主要的缺点是？`,
    options: [
      { key: 'A', text: '无序随机，插入时容易造成页分裂，写入与索引性能差' },
      { key: 'B', text: '长度太短，极易重复' },
      { key: 'C', text: '不能跨机器生成' },
      { key: 'D', text: '必须依赖数据库自增' },
    ],
    answers: ['A'],
    explanation: `UUID 全局唯一且本地可生成，但无序写入会打散 B+Tree 顺序。B 与实际长度相反，C、D 恰好是 UUID 的优点。`,
  },
  {
    id: 'distributed-02-id-002',
    type: 'single',
    difficulty: 1,
    tags: ['雪花算法'],
    stem: `Snowflake 生成的 64 位 ID 通常不包含哪部分？`,
    options: [
      { key: 'A', text: '时间戳' },
      { key: 'B', text: '机器/工作节点标识' },
      { key: 'C', text: '同一毫秒内的序列号' },
      { key: 'D', text: '用户手机号' },
    ],
    answers: ['D'],
    explanation: `典型结构是符号位 + 41 位时间戳 + 10 位 workerId + 12 位序列号，不含任何业务字段。A、B、C 都是组成部分。`,
  },
  {
    id: 'distributed-02-id-003',
    type: 'single',
    difficulty: 2,
    tags: ['时钟回拨'],
    stem: `雪花算法遇到机器时钟回拨，合理的处理是？`,
    options: [
      { key: 'A', text: '忽略，继续使用当前时间戳' },
      { key: 'B', text: '小幅回拨可等待时钟追上，大幅回拨应拒绝生成并告警' },
      { key: 'C', text: '把 workerId 改成随机数' },
      { key: 'D', text: '改用 UUID 且不记录日志' },
    ],
    answers: ['B'],
    explanation: `回拨可能生成重复 ID 或破坏递增性，必须检测；常见策略是等待/拒绝/切换节点并告警。A 会埋下重复隐患，C、D 没有解决时间戳问题。`,
  },
  {
    id: 'distributed-02-id-004',
    type: 'single',
    difficulty: 2,
    tags: ['号段模式'],
    stem: `数据库号段模式（一次取一段 ID 区间）的主要优势是？`,
    options: [
      { key: 'A', text: '本地从内存区间发号，减少数据库访问次数' },
      { key: 'B', text: 'ID 完全无序' },
      { key: 'C', text: '不需要考虑机器重启' },
      { key: 'D', text: '可以无限生成且永不重复，即使多实例配置错' },
    ],
    answers: ['A'],
    explanation: `号段把数据库压力从「每次取号」降到「每段取一次」，且 ID 趋势递增。B 与趋势递增矛盾，C 重启会浪费一段，D 前提是多实例区间不重叠。`,
  },
  {
    id: 'distributed-02-id-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['分布式 ID'],
    stem: `一个可用的分布式 ID 方案通常要满足哪些要求？`,
    options: [
      { key: 'A', text: '全局唯一' },
      { key: 'B', text: '趋势递增，利于索引写入' },
      { key: 'C', text: '高可用，生成不依赖单点' },
      { key: 'D', text: '必须严格按 1、2、3 连续无空洞' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `唯一、递增、高可用是核心诉求。D 不是必需，号段重启、雪花跨毫秒都会产生空洞，强行连续会牺牲性能与可用性。`,
  },
  {
    id: 'distributed-02-id-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['ID 重复'],
    scenario: `扩容后新上的两台机器都用了默认 workerId=0，压测时发现订单表主键冲突，冲突集中在同一毫秒内的请求。`,
    stem: `最贴近根因的分析是？`,
    options: [
      { key: 'A', text: '数据库自增列没设置步长' },
      { key: 'B', text: '雪花 ID 的机器位相同，同毫秒同序列号会生成完全相同的 ID' },
      { key: 'C', text: 'Redis 连接池太小' },
      { key: 'D', text: '订单号包含了用户 ID' },
    ],
    answers: ['B'],
    explanation: `雪花 ID 的唯一性依赖时间戳 + workerId + 序列号三者组合，workerId 撞车就会重复。A 是自增方案的问题，C、D 与 ID 结构无关。`,
  },
  {
    id: 'distributed-02-id-007',
    type: 'code',
    difficulty: 3,
    tags: ['雪花算法'],
    stem: `已知雪花序列号占 12 位，那么单个节点在「同一毫秒内」最多能生成多少个不同 ID？

~~~text
timestamp(41) | workerId(10) | sequence(12)
~~~`,
    options: [
      { key: 'A', text: '4096' },
      { key: 'B', text: '1024' },
      { key: 'C', text: '1023' },
      { key: 'D', text: '2 的 41 次方' },
    ],
    answers: ['A'],
    explanation: `12 位序列号可表示 0~4095 共 4096 个值；超过就要等到下一毫秒。B、C 是 10 位 workerId 的量级，D 是时间戳位数。`,
  },
]
