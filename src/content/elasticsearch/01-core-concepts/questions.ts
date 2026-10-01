import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'elasticsearch-01-core-concepts-001',
    type: 'single',
    difficulty: 1,
    tags: ['倒排索引'],
    stem: 'Elasticsearch 支撑全文检索的核心数据结构是倒排索引（inverted index）。关于它，下列说法正确的是？',
    options: [
      { key: 'A', text: '由「文档 ID → 关键词列表」构成，适合按文档找内容' },
      { key: 'B', text: '由「词项（term）→ 包含该词的文档 ID 列表（posting list）」构成，适合按内容找文档' },
      { key: 'C', text: '本质是 B+ 树，按主键范围快速检索' },
      { key: 'D', text: '只记录词与文档的对应关系，不保存词频和位置信息' },
    ],
    answers: ['B'],
    explanation:
      '倒排索引的方向是「词 → 文档」，查询词项后直接拿到 posting list，这正是全文检索"按内容找文档"的形态，B 正确。A 描述的方向是正排结构（如 doc_values、_source），用途相反。C 是 MySQL InnoDB 聚簇索引的底层结构，与倒排索引无关。D 错误：posting list 通常还携带词频（TF）、位置（position）、偏移（offset），分别支撑相关性算分、短语查询与高亮。',
  },
  {
    id: 'elasticsearch-01-core-concepts-002',
    type: 'single',
    difficulty: 1,
    tags: ['概念映射'],
    stem: '以 Elasticsearch 7.x 及以后的版本为准，下列 ES 与 MySQL 的概念对应关系最贴切的是？',
    options: [
      { key: 'A', text: 'index ↔ database，document ↔ column' },
      { key: 'B', text: 'index ↔ table，document ↔ row，field ↔ column' },
      { key: 'C', text: 'index ↔ MySQL 实例，shard ↔ database' },
      { key: 'D', text: 'index ↔ row，document ↔ table' },
    ],
    answers: ['B'],
    explanation:
      '7.x 移除了 type，一个 index 只有一种文档结构，主流类比变为 index≈table、document≈row、field≈column，B 正确。A 是 6.x 之前「index≈database、type≈table」时代的旧类比，如今已不成立。C 错误：shard 是 index 的物理水平切分单元，不是独立的数据库；一个 ES 集群在架构里才大致对应一个 MySQL 实例的角色。D 把行与表的关系完全颠倒。',
  },
  {
    id: 'elasticsearch-01-core-concepts-003',
    type: 'single',
    difficulty: 2,
    tags: ['分片与副本'],
    stem: '关于主分片（primary shard）与副本分片（replica），下列说法正确的是？',
    options: [
      { key: 'A', text: 'number_of_shards 建好索引后可通过 API 随时调大' },
      { key: 'B', text: '副本分片可以服务读请求，且 number_of_replicas 可动态调整' },
      { key: 'C', text: '主分片所在节点宕机后，该分片数据全部丢失' },
      { key: 'D', text: '主分片与其副本应分配在同一个节点上，便于同步' },
    ],
    answers: ['B'],
    explanation:
      '副本既是容灾备份也能承担读请求以提升读吞吐，且副本数运行期随时可改，B 正确。A 错误：主分片数决定文档路由 hash(_routing) % number_of_shards 的落点，创建后修改会让既有文档定位全部失效，属于静态设置，扩片只能用 _split 或 reindex 迁移。C 错误：主分片丢失时其副本会被提升为新的主分片继续服务，这正是副本存在的意义。D 错误：同一分片的主副本禁止落在同一节点，否则节点故障时容灾形同虚设。',
  },
  {
    id: 'elasticsearch-01-core-concepts-004',
    type: 'single',
    difficulty: 3,
    tags: ['近实时', 'translog'],
    stem: 'ES 写入的文档默认约 1 秒后才能被搜索到，同时节点断电也不会丢失已确认写入的数据。这两个特性分别依赖的机制是？',
    options: [
      { key: 'A', text: 'JVM 堆内缓存预热 与 主从复制' },
      { key: 'B', text: 'refresh 将内存 buffer 生成新 segment 使文档可搜；translog 顺序追加落盘，宕机后重放恢复' },
      { key: 'C', text: 'force merge 合并小段 与 snapshot 快照备份' },
      { key: 'D', text: '副本同步 与 routing 路由' },
    ],
    answers: ['B'],
    explanation:
      '写入链路是：文档先进入 memory buffer 并同步追加 translog；refresh（默认 index.refresh_interval=1s）把 buffer 中的文档写成新 segment 后才进入可搜状态，这就是「近实时（NRT）」的来源；断电恢复靠重放 translog 中尚未 flush 的操作，B 正确。A 中的机制并不存在。C 错误：force merge 只是合并小段减少段数，snapshot 是快照备份，都与这两个特性无关。D 错误：副本同步和路由与可搜性、宕机恢复都不是一回事。',
  },
  {
    id: 'elasticsearch-01-core-concepts-005',
    type: 'single',
    difficulty: 2,
    tags: ['适用场景'],
    stem: '下列场景中，最不适合把 Elasticsearch 当作主存储（唯一数据源、直接承载强一致写入）的是？',
    options: [
      { key: 'A', text: '电商商品的全文搜索：搜索词匹配标题、卖点与属性' },
      { key: 'B', text: '应用日志的检索与错误率聚合分析' },
      { key: 'C', text: '订单支付状态流转与账户余额扣减' },
      { key: 'D', text: '用户行为标签的多维筛选与聚合统计' },
    ],
    answers: ['C'],
    explanation:
      '支付与余额属于强事务场景：需要 ACID 事务、行级锁与精确的资金一致性，而 ES 没有多文档事务、不支持跨索引 JOIN，可见性还有 refresh 延迟，不能承担资金主存储，C 当选。A、B、D 恰是 ES 的经典主场：全文匹配、日志分析、多维聚合都建立在其倒排索引与列式 doc_values 之上。正确架构是 MySQL 做主存储，ES 做检索层。',
  },
  {
    id: 'elasticsearch-01-core-concepts-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['倒排索引', 'doc_values'],
    stem: '关于倒排索引与正排结构 doc_values，下列说法正确的有？（多选）',
    options: [
      { key: 'A', text: '倒排索引解决「给定词项找文档」，是全文搜索过滤的基础' },
      { key: 'B', text: 'doc_values 是列式存储的正排结构，默认开启，用于排序、聚合与脚本取值' },
      { key: 'C', text: '对 text 字段排序或聚合时，通常应使用其 keyword 子字段' },
      { key: 'D', text: '倒排索引同样适合「按文档 ID 逐条取出所有字段值」的聚合场景' },
      { key: 'E', text: '对明确不需要排序聚合的字段，可关闭 doc_values 以节省磁盘' },
    ],
    answers: ['A', 'B', 'C', 'E'],
    explanation:
      'A、B 分别描述了两种结构的方向与用途，正确。C 正确：text 分词后失去了「整值」，无法直接聚合排序，keyword 子字段才保存完整原值。D 错误：「按文档找字段值」是正排的职责，倒排索引方向相反，做不了这件事。E 正确：doc_values 默认开启并占用磁盘与内存，确定用不到排序聚合的字段可以显式设置 doc_values: false 换取存储空间。',
  },
  {
    id: 'elasticsearch-01-core-concepts-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['近实时', '排查'],
    scenario:
      '电商运营后台：运营新增一款商品，页面提示「保存成功」，但在商品列表页和 C 端搜索页都搜不到；约 1 秒后刷新页面又出现了。数据库中记录完整，写入 ES 的服务日志无任何报错。',
    stem: '作为后端排查该问题，下列判断与处置最合理的是？',
    options: [
      { key: 'A', text: 'ES 写入丢数据，应立即给写入服务加重试并回补全部数据' },
      {
        key: 'B',
        text: '这是 ES 近实时特性：文档要等 refresh（默认 1 秒）生成新 segment 后才可被全文搜索，属正常现象；「保存后立即回显」的读路径改为按 _id 的 GET（实时），搜索侧接受近实时',
      },
      { key: 'C', text: '说明分片分配异常，应立即滚动重启 ES 集群' },
      { key: 'D', text: '说明 mapping 与数据库字段不一致，应删除索引重建' },
    ],
    answers: ['B'],
    explanation:
      '现象三要素——约 1 秒后自愈、写入日志无报错、库里数据完整——指向 refresh 可见性延迟而非故障：文档写入后要等 refresh 生成新 segment 才可被全文搜索；而按 _id 的 GET 走实时读取，不受 refresh 影响，所以 B 的「回显走 _id GET、搜索接受 NRT」分流处置正确。A 是误诊：没有任何丢数据的证据。C 无依据，重启并不改变 refresh 语义。D 与现象无关：mapping 错误通常表现为写入报错或字段值异常，而不是「延迟 1 秒出现」。',
  },
  {
    id: 'elasticsearch-01-core-concepts-008',
    type: 'code',
    difficulty: 2,
    tags: ['分片与副本'],
    stem: `在一个已有数据的索引 orders 上执行如下请求，最可能的结果是？

~~~json
PUT /orders/_settings
{
  "index": {
    "number_of_shards": 6
  }
}
~~~`,
    options: [
      { key: 'A', text: '成功：主分片扩为 6 个，已有数据自动重平衡到新分片' },
      { key: 'B', text: '报错：number_of_shards 是创建索引时固定的静态设置，需新建索引并通过 _split 或 reindex 迁移数据' },
      { key: 'C', text: '成功：但只有新数据写入新分片，旧数据留在原分片' },
      { key: 'D', text: '成功：ES 会先自动关闭索引，改完再自动打开' },
    ],
    answers: ['B'],
    explanation:
      '主分片数决定文档路由 hash(_routing) % number_of_shards 的落点，中途改变会让已写入文档的定位全部失效，因此它是创建时确定的静态设置，直接修改会返回 illegal_argument_exception，B 正确。扩分片的正规做法是 _split（新分片数须为原值的倍数）或建新索引 reindex，再配合别名切换。C、D 描述的自动行为并不存在；真正可以动态调整的是 number_of_replicas。',
  },
  {
    id: 'elasticsearch-01-core-concepts-009',
    type: 'scenario',
    difficulty: 2,
    tags: ['选型'],
    scenario:
      '商品列表页用 MySQL `LIKE \'%keyword%\'` 检索 2000 万行商品表，前导通配符导致全表扫描，高峰期接口超时；产品经理同时要求"搜索结果要按相关性排序、关键词命中要标红"。',
    stem: '技术方案的判断与选型，最合理的是？',
    options: [
      { key: 'A', text: '引入 Elasticsearch：商品名/描述建 text 索引配 IK 分词，match 查询 + 相关性算分 + 高亮；MySQL 仍是事实来源，按 ID 回表取详情，用同步机制保证最终一致' },
      { key: 'B', text: '给商品名加普通索引，LIKE 就能走索引了' },
      { key: 'C', text: '把商品表整体迁到 ES 作为唯一存储，业务读写全部走 ES' },
      { key: 'D', text: '把 LIKE 查询结果缓存到 Redis，命中缓存就不再查库' },
    ],
    answers: ['A'],
    explanation:
      'LIKE \'%xx%\' 前导通配符无法走 B+ 树，且关系库没有分词与相关性算分能力——这正是倒排索引的适用场景。A 是标准架构：ES 做检索视图、MySQL 保持事实来源（事务与唯一约束），回表取详情，同步靠 canal/MQ/双写。B 前导 % 照样失效；C 把强一致、唯一约束、事务all压给 ES，得付出巨大同步与一致性代价；D 缓存解决不了"没缓存过的关键词仍全表扫描"，也没有分词与排序能力。',
  },
]
