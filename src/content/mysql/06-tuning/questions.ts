import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'mysql-06-tuning-001',
    type: 'single',
    difficulty: 2,
    tags: ['EXPLAIN'],
    stem: 'EXPLAIN 输出中，`Extra` 显示 `Using filesort` 意味着什么？',
    options: [
      { key: 'A', text: '排序使用了磁盘上的文件，说明磁盘坏了' },
      { key: 'B', text: '无法利用索引顺序完成排序，需要额外的排序步骤（内存或磁盘）' },
      { key: 'C', text: '查询结果为空' },
      { key: 'D', text: '该查询走了覆盖索引' },
    ],
    answers: ['B'],
    explanation:
      'filesort 是"额外排序"的标记：ORDER BY 的字段与索引顺序不一致时发生，数据量大时在磁盘排序，性能差。A 望文生义；C 无关；D 对应的是 Using index。',
  },
  {
    id: 'mysql-06-tuning-002',
    type: 'single',
    difficulty: 2,
    tags: ['EXPLAIN'],
    stem: 'EXPLAIN 的 type 列取值按性能从优到劣排列，正确的是？',
    options: [
      { key: 'A', text: 'const > eq_ref > ref > range > index > ALL' },
      { key: 'B', text: 'ALL > index > range > ref > eq_ref > const' },
      { key: 'C', text: 'ref > const > ALL > range > index > eq_ref' },
      { key: 'D', text: 'type 与性能无关，只看 rows 即可' },
    ],
    answers: ['A'],
    explanation:
      'const（主键/唯一等值）、eq_ref（联接时主键/唯一匹配）、ref（普通索引等值）、range（索引范围）、index（扫全索引）、ALL（全表扫描）。线上原则：ALL 与百万级数据的 index 需要优化。B 反了；C 乱序；D 错误，type 是核心指标之一。',
  },
  {
    id: 'mysql-06-tuning-003',
    type: 'scenario',
    difficulty: 3,
    tags: ['深分页'],
    scenario:
      '商品列表页翻到第 5000 页时接口超时：`SELECT * FROM product ORDER BY id LIMIT 100000, 20`，id 为主键。',
    stem: '下列优化方案中最不可取的是？',
    options: [
      { key: 'A', text: '游标分页：记录上一页最大 id，改写为 `WHERE id > 100000 ORDER BY id LIMIT 20`' },
      { key: 'B', text: '延迟关联：`SELECT p.* FROM product p JOIN (SELECT id FROM product ORDER BY id LIMIT 100000, 20) t ON p.id = t.id`' },
      { key: 'C', text: '给业务做"仅允许跳转最近 1000 页"的产品限制，深处用游标或搜索引擎' },
      { key: 'D', text: '给 id 再建一个普通索引，让 LIMIT 走该索引' },
    ],
    answers: ['D'],
    explanation:
      'id 本身是主键，再建普通索引毫无意义，LIMIT 的代价在"扫描并丢弃 10 万行"而非缺少索引。A 让扫描从游标位置直接开始，是首选；B 先在覆盖索引里取出 20 个 id（不回表）再回表，大幅减少随机 IO；C 是业务侧合理收敛——深分页本质是伪需求。',
  },
  {
    id: 'mysql-06-tuning-004',
    type: 'single',
    difficulty: 2,
    tags: ['count'],
    stem: '关于 `count(*)`、`count(1)`、`count(主键id)`、`count(普通列)` 的效率，一般认为？',
    options: [
      { key: 'A', text: 'count(普通列) 最快，因为列最窄' },
      { key: 'B', text: 'count(*) ≈ count(1) ≥ count(主键id) > count(普通列)' },
      { key: 'C', text: 'count(*) 最慢，因为它取出所有列' },
      { key: 'D', text: '四者完全等价' },
    ],
    answers: ['B'],
    explanation:
      'count(*) 被优化器专门优化为取最小可用索引计数，语义上不取值；count(1) 类似；count(id) 要取主键值；count(普通列) 必须逐行判 NULL 且可能用不上小索引，最慢。A/C 都是误解 count 不取值的语义。',
  },
  {
    id: 'mysql-06-tuning-005',
    type: 'scenario',
    difficulty: 3,
    tags: ['主从延迟'],
    scenario:
      '读写分离架构：用户修改头像后立刻刷新页面，偶尔仍显示旧头像，但等几秒就正常。从库 `Seconds_Behind_Master` 平时 0，高峰期飙到 30 秒。',
    stem: '解释与处置组合最合理的是？',
    options: [
      { key: 'A', text: '网络丢包导致，增加重试即可，无需其他处理' },
      { key: 'B', text: '主从延迟：高峰期从库回放跟不上；短期对"写后立读"场景强制走主库或会话内粘主，长期上并行复制/拆分写热点' },
      { key: 'C', text: '前端缓存问题，清浏览器缓存即可' },
      { key: 'D', text: '把从库数量加倍就能彻底解决' },
    ],
    answers: ['B'],
    explanation:
      '"几秒后正常 + 高峰期 Seconds_Behind_Master 飙升"是主从延迟的教科书表现；写后立读必须读到最新值，应路由到主库。A 与稳定复现矛盾；C 解释不了 Seconds_Behind_Master；D 只是稀释读流量，回放瓶颈不变——关键在提升回放并行度与拆写热点。',
  },
  {
    id: 'mysql-06-tuning-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['表设计'],
    stem: '下列表设计实践合理的有？',
    options: [
      { key: 'A', text: '能用 NOT NULL 的列尽量 NOT NULL，并给出默认值' },
      { key: 'B', text: '状态、类型等枚举值用 TINYINT 而不是 VARCHAR' },
      { key: 'C', text: '所有字段一律用 TEXT 存放，避免长度不够' },
      { key: 'D', text: '主键用与业务无关的自增 ID，业务标识另加唯一索引' },
    ],
    answers: ['A', 'B', 'D'],
    explanation:
      'NOT NULL 减少三值逻辑与索引统计误差；TINYINT 省 2~3 字节且利索引；自增主键保证聚簇索引顺序插入。C 错误——TEXT 行溢出存储拖累性能，长度应按需选择 VARCHAR。',
  },
  {
    id: 'mysql-06-tuning-007',
    type: 'single',
    difficulty: 3,
    tags: ['分库分表'],
    stem: '单表 2000 万行、查询与写入都开始变慢。在考虑分库分表之前，下列哪项通常应当优先尝试？',
    options: [
      { key: 'A', text: '直接上分库分表中间件拆成 16 库 64 表' },
      { key: 'B', text: '审查慢查询与索引、引入缓存挡读、归档冷数据到历史表' },
      { key: 'C', text: '把 MySQL 换成 MongoDB' },
      { key: 'D', text: '调大 innodb_buffer_pool_size 到物理内存的 99%' },
    ],
    answers: ['B'],
    explanation:
      '分库分表引入跨片查询、分布式事务、扩容迁移等巨大复杂度，是最后手段；大多数"2000 万行变慢"先靠索引治理、缓存与冷热分离就能解决。C 是换赛道不是优化；D 最多留出合理余量，占满内存会挤压系统与其他进程。',
  },
]
