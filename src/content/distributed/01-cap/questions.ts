import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'distributed-01-cap-001',
    type: 'single',
    difficulty: 1,
    tags: ['CAP'],
    stem: `CAP 中的 P（分区容错）指的是？`,
    options: [
      { key: 'A', text: '系统性能要达到 P99 指标' },
      { key: 'B', text: '网络出现分区（节点间通信中断）时系统仍能继续运行' },
      { key: 'C', text: '数据按分区表存储' },
      { key: 'D', text: '进程优先级调度' },
    ],
    answers: ['B'],
    explanation: `P 描述的是网络分区下的容忍能力，分布式系统无法假设网络永远可靠。A 是性能指标，C 是数据库分区，D 是操作系统概念。`,
  },
  {
    id: 'distributed-01-cap-002',
    type: 'single',
    difficulty: 1,
    tags: ['BASE'],
    stem: `BASE 中的 E 代表？`,
    options: [
      { key: 'A', text: 'Eventually consistent，最终一致' },
      { key: 'B', text: 'Efficient，高效' },
      { key: 'C', text: 'Elastic，弹性' },
      { key: 'D', text: 'Exactly-once，精确一次' },
    ],
    answers: ['A'],
    explanation: `BASE = Basically Available + Soft state + Eventually consistent，强调接受中间状态、通过补偿达到最终一致。B、C、D 都不是该缩写的含义。`,
  },
  {
    id: 'distributed-01-cap-003',
    type: 'single',
    difficulty: 2,
    tags: ['CAP 取舍'],
    stem: `网络分区发生时，选择 CP 意味着？`,
    options: [
      { key: 'A', text: '优先保证数据一致，可能拒绝部分请求' },
      { key: 'B', text: '优先保证每个请求都有响应，可能返回旧数据' },
      { key: 'C', text: '同时完美保证 C 与 A' },
      { key: 'D', text: '停止所有写入但不再提供任何读' },
    ],
    answers: ['A'],
    explanation: `CP 在分区期间牺牲可用性（报错或阻塞）以避免读到不一致数据；B 是 AP 的选择；C 违背 CAP；D 把「可能」说成了绝对。`,
  },
  {
    id: 'distributed-01-cap-004',
    type: 'single',
    difficulty: 2,
    tags: ['最终一致'],
    stem: `「写主库后立刻读从库可能读到旧值」属于哪种一致性问题？`,
    options: [
      { key: 'A', text: '强一致' },
      { key: 'B', text: '主从复制延迟带来的最终一致窗口' },
      { key: 'C', text: '数据库死锁' },
      { key: 'D', text: '索引失效' },
    ],
    answers: ['B'],
    explanation: `主从复制存在延迟，读写分离场景下会出现短暂不一致；常用「写后读主库」或等待位点规避。A 不会有该窗口，C、D 是另外两类问题。`,
  },
  {
    id: 'distributed-01-cap-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['一致性'],
    stem: `关于 BASE 与最终一致，说法正确的有哪些？`,
    options: [
      { key: 'A', text: '允许系统存在短暂的中间状态' },
      { key: 'B', text: '通常需要幂等消费、重试与定时对账兜底' },
      { key: 'C', text: '注册中心等发现类场景常偏向 AP' },
      { key: 'D', text: '最终一致意味着数据永远不会出现短暂差异' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 正确。D 把最终一致误解成强一致：恰恰是允许短暂差异，才需要补偿与对账。`,
  },
  {
    id: 'distributed-01-cap-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['一致性方案'],
    scenario: `订单服务写库后要通知积分服务加积分，两个库不在同一个事务里，偶尔出现「订单成功但积分没加」。`,
    stem: `最符合 BASE 思路的方案是？`,
    options: [
      { key: 'A', text: '把两个库放进同一个本地事务' },
      { key: 'B', text: '本地消息表/事务消息 + 幂等消费 + 失败重试 + 定时对账补偿' },
      { key: 'C', text: '让用户手动刷新页面重试' },
      { key: 'D', text: '关闭积分功能' },
    ],
    answers: ['B'],
    explanation: `跨库跨服务无法靠本地事务保证，工程上用可靠消息 + 幂等 + 重试 + 对账实现最终一致。A 在跨库场景不成立，C、D 不是技术方案。`,
  },
  {
    id: 'distributed-01-cap-007',
    type: 'code',
    difficulty: 3,
    tags: ['Quorum'],
    stem: `副本数 N=3，写副本数 W=1、读副本数 R=1，关于「写后立刻读」的正确判断是？

~~~text
N = 3, W = 1, R = 1
~~~`,
    options: [
      { key: 'A', text: '可能读到未同步的旧副本，因为 W + R 不大于 N' },
      { key: 'B', text: '一定读到最新值，因为有三个副本' },
      { key: 'C', text: '写入一定失败，因为 W 小于 N' },
      { key: 'D', text: '读请求会被自动转成写请求' },
    ],
    answers: ['A'],
    explanation: `Quorum 需要 W + R > N 才能让读写副本集合必然相交；1 + 1 < 3，读到旧副本完全可能。B 忽略了相交条件，C、D 与 NWR 规则不符。`,
  },
]
