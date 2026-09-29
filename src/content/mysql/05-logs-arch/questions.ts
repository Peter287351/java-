import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'mysql-05-logs-arch-001',
    type: 'single',
    difficulty: 1,
    tags: ['redo log'],
    stem: 'InnoDB 引入 redo log（WAL 机制）最核心的目的是？',
    options: [
      { key: 'A', text: '支持事务回滚' },
      { key: 'B', text: '让修改不必等数据页刷盘即可提交，宕机后重放恢复，保证 crash-safe' },
      { key: 'C', text: '记录 SQL 语句用于主从复制' },
      { key: 'D', text: '加速全表扫描' },
    ],
    answers: ['B'],
    explanation:
      '随机写数据页代价高，redo log 把它变成顺序写日志，提交只需日志落盘，数据页由后台慢慢刷——既快又能在宕机后重放。A 是 undo log 的职责；C 是 binlog 的职责；D 无关。',
  },
  {
    id: 'mysql-05-logs-arch-002',
    type: 'single',
    difficulty: 2,
    tags: ['binlog', 'redo log'],
    stem: '关于 redo log 与 binlog 的区别，下列说法错误的是？',
    options: [
      { key: 'A', text: 'redo log 是 InnoDB 层的物理日志，binlog 是 Server 层的逻辑日志' },
      { key: 'B', text: 'redo log 循环写固定大小文件，binlog 追加写不会覆盖' },
      { key: 'C', text: 'binlog 有 STATEMENT/ROW/MIXED 三种格式，redo log 没有格式之分' },
      { key: 'D', text: 'redo log 记录的是执行过的 SQL 语句文本' },
    ],
    answers: ['D'],
    explanation:
      'redo log 记录"某个数据页做了什么物理改动"，不是 SQL 文本；记录语句的是 binlog 的 STATEMENT 格式。A/B/C 均为正确描述。',
  },
  {
    id: 'mysql-05-logs-arch-003',
    type: 'single',
    difficulty: 2,
    tags: ['两阶段提交'],
    stem: 'redo log 与 binlog 之间必须用「两阶段提交」协调。如果去掉它、先写 redo log 成功后、写 binlog 前宕机，恢复后会发生什么？',
    options: [
      { key: 'A', text: '什么都不会发生，两份日志本来就独立' },
      { key: 'B', text: '主库恢复出该事务，但从库（靠 binlog）没有这条数据，主从不一致' },
      { key: 'C', text: '主库丢数据，从库有这条数据' },
      { key: 'D', text: 'binlog 自动补齐缺失的事务' },
    ],
    answers: ['B'],
    explanation:
      'redo prepare 完成而 binlog 缺失时，恢复判定为"可以提交"（redo 完整），主库有数据；从库依赖 binlog 回放，拿不到该事务——主从不一致，反向崩溃则主库丢数据。两阶段提交用 binlog 是否完整作为"事务是否对外可见"的裁决依据。binlog 没有自动补齐机制。',
  },
  {
    id: 'mysql-05-logs-arch-004',
    type: 'multiple',
    difficulty: 2,
    tags: ['UPDATE 链路'],
    stem: '执行一条 `UPDATE` 语句，下列哪些组件/日志会参与？',
    options: [
      { key: 'A', text: 'Buffer Pool（修改数据页为脏页）' },
      { key: 'B', text: 'undo log（记录旧版本用于回滚/MVCC）' },
      { key: 'C', text: 'redo log（prepare → commit 两阶段）' },
      { key: 'D', text: '查询缓存 Query Cache' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      '更新链路：定位行 → Buffer Pool 改页 → 记 undo → redo prepare → binlog → redo commit。D 的查询缓存只作用于 SELECT，且 MySQL 8.0 已移除，与更新无关（更新反而要令相关缓存失效）。',
  },
  {
    id: 'mysql-05-logs-arch-005',
    type: 'scenario',
    difficulty: 3,
    tags: ['redo log', '持久化'],
    scenario:
      '凌晨 MySQL 所在机器断电重启。业务方在群里说"我们每天凌晨都有全量备份，数据不会丢吧"。恢复后检查：所有已提交事务的数据完好，但有一批"提交耗时约 1 秒内"的事务丢了。',
    stem: '结合参数最可能的解释是？',
    options: [
      { key: 'A', text: 'redo log 坏了，恢复不完整属于正常现象' },
      { key: 'B', text: '实例配置了 innodb_flush_log_at_trx_commit=2：提交只写操作系统缓存不落盘，断电丢最近约 1 秒的事务；redo log 本身恢复机制工作正常' },
      { key: 'C', text: 'binlog 没开启导致的，开启 binlog 就不会丢' },
      { key: 'D', text: 'Buffer Pool 太小导致的，调大即可' },
    ],
    answers: ['B'],
    explanation:
      '值为 2 时每秒刷一次 redo 到磁盘，宕机最多丢约 1 秒事务——与"提交约 1 秒内的事务丢失"完全吻合，且已提交事务大多完好说明 redo 恢复正常工作。A 与现象矛盾；C 的 binlog 在双 1 之下同样受 sync_binlog 约束，开启不等于不丢；D 与丢事务无关。要求强不丢就回到双 1 配置。',
  },
  {
    id: 'mysql-05-logs-arch-006',
    type: 'single',
    difficulty: 2,
    tags: ['脏页'],
    stem: '关于 Buffer Pool 中的「脏页」，下列说法正确的是？',
    options: [
      { key: 'A', text: '脏页就是损坏的数据页，出现即代表数据出错' },
      { key: 'B', text: '被修改但尚未刷回磁盘的数据页；由后台线程按 checkpoint 机制异步刷盘' },
      { key: 'C', text: '脏页必须立刻同步刷盘，否则事务无法提交' },
      { key: 'D', text: '脏页数量与写性能无关' },
    ],
    answers: ['B'],
    explanation:
      'WAL 下修改先记 redo，数据页在内存变"脏"，后台按 checkpoint 推进刷盘，事务提交不等数据页落盘。A 的"脏"只表示内存与磁盘不一致；C 恰恰违背 WAL 的初衷；D 错误——脏页过多会触发激进刷盘，反而拖累写入（这正是要监控 dirty pages % 的原因）。',
  },
  {
    id: 'mysql-05-logs-arch-007',
    type: 'single',
    difficulty: 3,
    tags: ['双 1', '性能'],
    stem: '写入密集业务把 `innodb_flush_log_at_trx_commit` 与 `sync_binlog` 都设为 1（双 1）后 TPS 明显下降。下列权衡理解正确的是？',
    options: [
      { key: 'A', text: '双 1 下每次提交都要 redo 刷盘并同步 binlog，安全换性能下降；可用组提交（group commit）合并刷盘来缓解' },
      { key: 'B', text: '把 sync_binlog 调成 0 完全没有风险' },
      { key: 'C', text: 'TPS 下降说明硬件故障，应立即换盘' },
      { key: 'D', text: '应关闭 binlog 换取性能' },
    ],
    answers: ['A'],
    explanation:
      '双 1 保障"事务提交即持久"，代价是提交路径的两次落盘；MySQL 的组提交会把并发事务的刷盘合并，高并发下摊薄成本——这是标准优化方向。B 在断电时同样可能丢事务，并非零风险；C 是误诊；D 牺牲复制与恢复能力，通常不可接受。',
  },
]
