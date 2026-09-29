import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'redis-02-thread-persistence-001',
    type: 'single',
    difficulty: 1,
    tags: ['线程模型'],
    stem: 'Redis 核心命令执行一直保持单线程，为什么性能还能很高？',
    options: [
      { key: 'A', text: 'Redis 使用了多核并行计算数据' },
      { key: 'B', text: '纯内存操作 + 高效数据结构 + IO 多路复用 + 无锁与上下文切换开销' },
      { key: 'C', text: 'Redis 把数据压缩后处理，数据量小' },
      { key: 'D', text: '因为 Redis 是编译型语言写的' },
    ],
    answers: ['B'],
    explanation:
      '瓶颈在内存与网络而非 CPU，单线程反而省去锁竞争与线程切换，配合 epoll 事件驱动支撑高并发。A 与"命令执行单线程"矛盾；C/D 都是杜撰。',
  },
  {
    id: 'redis-02-thread-persistence-002',
    type: 'single',
    difficulty: 2,
    tags: ['IO 多线程'],
    stem: 'Redis 6 引入的 IO 多线程，下列理解正确的是？',
    options: [
      { key: 'A', text: '命令执行改为多线程并行，天然解决并发修改问题' },
      { key: 'B', text: '多线程只用于网络 IO（读取请求、写回响应）与协议解析，命令执行仍单线程' },
      { key: 'C', text: '持久化由多个线程并行写 RDB' },
      { key: 'D', text: '开启后无需再考虑大 key 问题' },
    ],
    answers: ['B'],
    explanation:
      'Redis 6 的 io-threads 并行的是网络读写与解析——瓶颈在网络带宽/系统调用时收益明显；数据结构操作仍单线程，串行语义不变。A 是常见误读；C 由 fork 的子进程负责；D 大 key 的网络与阻塞成本依旧存在。',
  },
  {
    id: 'redis-02-thread-persistence-003',
    type: 'single',
    difficulty: 2,
    tags: ['RDB'],
    stem: 'BGSAVE 生成 RDB 快照时，Redis 主进程是怎么做到"边服务边写文件"的？',
    options: [
      { key: 'A', text: '主进程暂停几秒把内存序列化完再继续' },
      { key: 'B', text: 'fork 子进程负责写快照；借助操作系统的写时复制（COW），主进程继续处理命令' },
      { key: 'C', text: '主进程把内存数据发送给从库，由从库生成快照' },
      { key: 'D', text: 'RDB 只能在停机维护时手动生成' },
    ],
    answers: ['B'],
    explanation:
      'fork 共享父进程内存页，子进程按 fork 瞬间的数据写快照；之后主进程修改数据时内核才复制对应内存页（COW）。A 是 SAVE（前台）的行为；C 与从库无关；D 误解了 BGSAVE。',
  },
  {
    id: 'redis-02-thread-persistence-004',
    type: 'single',
    difficulty: 2,
    tags: ['AOF'],
    stem: 'AOF 配置 `appendfsync everysec` 时，最坏情况下宕机会丢多少数据？',
    options: [
      { key: 'A', text: '一条命令都不会丢' },
      { key: 'B', text: '最多约 1 秒的写入' },
      { key: 'C', text: '最多 30 秒' },
      { key: 'D', text: '整个 AOF 文件可能损坏无法恢复' },
    ],
    answers: ['B'],
    explanation:
      'everysec 由后台线程每秒 fsync 一次，宕机最多丢上一次成功刷盘之后的约 1 秒数据——这是官方给出的权衡点。A 是 always 的语义；C/D 无依据。',
  },
  {
    id: 'redis-02-thread-persistence-005',
    type: 'single',
    difficulty: 3,
    tags: ['fork', 'COW'],
    stem: '大内存实例（如 30GB）执行 BGSAVE 时偶发服务抖动甚至 OOM，最合理的解释是？',
    options: [
      { key: 'A', text: 'fork 本身要拷贝 30GB 内存，耗时且占双倍内存' },
      { key: 'B', text: 'fork 只复制页表，很快；但期间主进程大量写入会触发写时复制，内存占用增长明显，极端时超过物理内存触发 OOM' },
      { key: 'C', text: 'RDB 文件写入占满带宽导致请求超时' },
      { key: 'D', text: 'BGSAVE 会阻塞所有读命令' },
    ],
    answers: ['B'],
    explanation:
      'fork 复制的是页表（几十毫秒级），数据页共享；COW 在写多场景下逐页复制，内存峰值可能接近"修改量级"的增长，是抖动与 OOM 的根因——对策：控制实例大小、错峰、减少写入毛刺。A 误解 fork 机制；C/D 与事实不符。',
  },
  {
    id: 'redis-02-thread-persistence-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['持久化'],
    stem: '关于 RDB 与 AOF 的取舍，下列说法正确的有？',
    options: [
      { key: 'A', text: 'RDB 文件紧凑、恢复快，但会丢失最后一次快照之后的数据' },
      { key: 'B', text: 'AOF 更安全但文件大、恢复慢，靠重写机制瘦身' },
      { key: 'C', text: '开启混合持久化后，AOF 重写文件前半段是 RDB 格式' },
      { key: 'D', text: 'AOF 重写是把旧 AOF 文件压缩去重' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A/B/C 均为正确机制描述。D 错误——重写不是压缩旧文件，而是 fork 子进程按当前内存数据重新生成一份最小命令集，旧文件在替换前仍然生效。',
  },
  {
    id: 'redis-02-thread-persistence-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['混合持久化', 'AOF'],
    scenario:
      '缓存集群实例开了混合持久化。某天运维误删了 RDB 备份目录，但 AOF 文件完整；实例重启后数据基本完好，只有最后约 1 秒的写入丢失。',
    stem: '对该现象最准确的解释是？',
    options: [
      { key: 'A', text: 'AOF 恢复时只回放了一半，属于混合持久化的缺陷' },
      { key: 'B', text: '混合持久化下 AOF 文件头部是重写时刻的 RDB 快照、其后是增量命令；重启加载 AOF 即可恢复到故障前，丢失量由 appendfsync 策略决定（everysec 约 1 秒）' },
      { key: 'C', text: '说明 Redis 自动从主库同步了数据，与本地持久化无关' },
      { key: 'D', text: '属于巧合，正常情况下 AOF 无法独立恢复数据' },
    ],
    answers: ['B'],
    explanation:
      '混合持久化的产物就是"AOF 文件 = RDB 头 + 增量 AOF 尾"，加载时先读 RDB 部分再回放增量，天然支持独立恢复；丢失的 1 秒来自 everysec。A 恰好说反；C 与单机恢复过程无关；D 错误。',
  },
  {
    id: 'redis-02-thread-persistence-008',
    type: 'single',
    difficulty: 2,
    tags: ['持久化'],
    stem: '纯缓存场景（后端数据库是唯一事实来源），最常推荐的持久化组合是？',
    options: [
      { key: 'A', text: '关闭所有持久化，丢失可随时由 DB 重建' },
      { key: 'B', text: 'RDB（或混合持久化），重启后快速恢复热点数据，减少缓存雪崩' },
      { key: 'C', text: 'AOF always，保证缓存一条不丢' },
      { key: 'D', text: 'RDB + AOF always 双开，越安全越好' },
    ],
    answers: ['B'],
    explanation:
      '缓存数据可重建，但仍建议留 RDB/混合——重启后不必让全量流量瞬间打到数据库（雪崩）。A 在"冷启动压垮 DB"风险下并不稳妥；C 对缓存毫无必要且性能最差；D 过度配置。',
  },
]
