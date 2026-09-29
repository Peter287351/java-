import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'elasticsearch-03-query-dsl-001',
    type: 'single',
    difficulty: 1,
    tags: ['match 查询', 'term 查询'],
    stem: 'match 与 term 两种查询的核心区别，正确的是？',
    options: [
      { key: 'A', text: 'match 会先用字段的分析器处理查询串（分词、小写等）再去倒排匹配；term 把输入当作一个完整词项，不做任何分析' },
      { key: 'B', text: 'term 查询永远比 match 慢' },
      { key: 'C', text: 'match 只能用于 keyword 字段，term 只能用于 text 字段' },
      { key: 'D', text: '两者语义等价，只是 JSON 写法不同' },
    ],
    answers: ['A'],
    explanation:
      'match 属于全文查询，会先分析查询串再逐词项匹配；term 属于精确查询，输入什么就拿什么去和倒排里的词项做相等比较，A 正确。B 错误：term 结构更简单通常更快，但「快」不等于「能查到」。C 把适用场景说反了：match 面向 text，term 面向 keyword、数值、日期。D 错误：两者语义完全不同，在 text 字段上误用 term 是新手「查不到数据」的头号原因。',
  },
  {
    id: 'elasticsearch-03-query-dsl-002',
    type: 'code',
    difficulty: 2,
    tags: ['bool 查询'],
    stem: `users 索引的 mapping 中 city 字段为 keyword 类型（vip 为 boolean，level 为 long），现有两篇文档：

~~~json
{ "id": 1, "city": "北京", "vip": true, "level": 1 }
{ "id": 2, "city": "上海", "vip": true, "level": 5 }
~~~

执行下面的查询：

~~~json
GET /users/_search
{
  "query": {
    "bool": {
      "must":   [ { "term": { "city": "北京" } } ],
      "should": [ { "term": { "vip": true } }, { "term": { "level": 5 } } ]
    }
  }
}
~~~

返回结果是？`,
    options: [
      { key: 'A', text: '返回文档 1 和文档 2：should 表示「满足其一即可」，与 must 是或的关系' },
      { key: 'B', text: '只返回文档 1：must 已存在时 should 不再是过滤条件，仅对命中文档参与算分' },
      { key: 'C', text: '返回文档 2：它满足了 should 的一个条件' },
      { key: 'D', text: '报错：should 与 must 不能同时出现在一个 bool 里' },
    ],
    answers: ['B'],
    explanation:
      'bool 中已有 must 或 filter 时，should 的 minimum_should_match 默认为 0，即 should 子句不再作为过滤条件，只负责给匹配到的文档加分（文档 1 满足 vip=true，得分更高）；文档 2 因不满足 must 中的 city=北京 被直接排除，B 正确。A、C 把「bool 中只有 should 而没有 must/filter 时，至少要匹配 1 个 should」的规则错误外推到了有 must 的场景。D 错误：must 与 should 完全可以共存，这正是「过滤 + 加权排序」的常用写法。',
  },
  {
    id: 'elasticsearch-03-query-dsl-003',
    type: 'single',
    difficulty: 2,
    tags: ['filter'],
    stem: '关于 bool 查询中的 filter 子句，下列说法正确的是？',
    options: [
      { key: 'A', text: 'filter 也计算相关性 _score，只是得分恒为 0' },
      { key: 'B', text: 'filter 不计算相关性得分，其匹配结果（位图）会被 ES 缓存复用，重复执行时明显更快' },
      { key: 'C', text: 'filter 比 must 慢，因为每次都要额外维护缓存' },
      { key: 'D', text: 'filter 只能出现在 bool 查询的顶层，不能嵌套' },
    ],
    answers: ['B'],
    explanation:
      'filter 属于过滤上下文：只回答「匹配/不匹配」，不参与 _score 计算，匹配结果以位图（bitset）形式缓存，后续相同条件直接复用（segment 变化时自动失效），B 正确。A 自相矛盾：不算分就是没有分数贡献，谈不上「分数恒为 0」。C 错误：缓存复用收益远大于维护成本，「状态、类目、时间范围放进 filter」正是通用优化手段。D 错误：filter 可以多层嵌套（bool.filter 里再放 bool），也可用于 constant_score 等场景。',
  },
  {
    id: 'elasticsearch-03-query-dsl-004',
    type: 'single',
    difficulty: 1,
    tags: ['高亮'],
    stem: '关于搜索结果的高亮（highlight），下列说法正确的是？',
    options: [
      { key: 'A', text: '命中文档的 highlight 字段用标签包裹命中的词项，前后标签可自定义（默认 em 标签）' },
      { key: 'B', text: '高亮结果会写回倒排索引，影响后续搜索' },
      { key: 'C', text: '只有 stored=true 的字段才能高亮，从 _source 取值的字段一律不能' },
      { key: 'D', text: '高亮标签固定不可修改' },
    ],
    answers: ['A'],
    explanation:
      'highlight 会基于命中的词项在原文中定位并打上标记，默认前后标签是 <em></em>，可通过 pre_tags/post_tags 自定义，A 正确、D 错误。B 错误：高亮是查询期的展示逻辑，不改变任何索引数据。C 错误：默认从 _source 取原文即可高亮，只有 _source 被禁用或字段超大等特殊场景才需要 stored fields 或 term_vectors 来加速。',
  },
  {
    id: 'elasticsearch-03-query-dsl-005',
    type: 'single',
    difficulty: 2,
    tags: ['分页'],
    stem: '关于 from/size 分页，下列说法正确的是？',
    options: [
      { key: 'A', text: '默认 from + size 不能超过 10000（index.max_result_window），超出直接报错' },
      { key: 'B', text: 'from/size 没有任何限制，可以一直翻到第 100 万页' },
      { key: 'C', text: '把 max_result_window 调大后，深翻页就不再有性能开销' },
      { key: 'D', text: '深翻页的代价主要是慢，协调节点的内存压力基本不变' },
    ],
    answers: ['A'],
    explanation:
      '默认 max_result_window=10000，from+size 超限直接报错，这是 ES 对深分页的主动保护，A 正确。B 错误：默认就被挡在 10000。C、D 描述的是同一种误解：深翻页时每个分片都要取回 from+size 条文档，在协调节点统一排序后丢弃前面的部分，翻得越深，传输与堆内存开销越大——调大窗口只是延迟报错，把风险转移成 OOM。真正的深翻页应换用 search_after 或 scroll。',
  },
  {
    id: 'elasticsearch-03-query-dsl-006',
    type: 'single',
    difficulty: 3,
    tags: ['scroll', 'search_after'],
    stem: '关于 scroll 与 search_after 两种深遍历方案的选型，正确的是？',
    options: [
      { key: 'A', text: 'scroll 在服务端维护快照与游标上下文，适合离线全量导出；search_after 无状态，以上一页末尾的排序值为游标向后翻，适合实时性要求高的逐页浏览' },
      { key: 'B', text: 'search_after 支持从任意一页直接跳页，比 scroll 灵活' },
      { key: 'C', text: 'scroll 的快照是实时视图，导出期间新写入的数据立即可见' },
      { key: 'D', text: 'search_after 需要在 ES 服务端维护游标上下文，超时自动释放' },
    ],
    answers: ['A'],
    explanation:
      'A 正确：scroll 首次查询建立数据快照与 scroll_id，后续凭 id 续拉，代价是占用服务端资源且不反映新写入，适合导出任务；search_after 完全无状态，把上一页最后一条的排序值带回下一页请求，实时性好。B 错误：search_after 只能沿排序方向顺序向后翻，不能跳页。C 错误：scroll 是快照语义，导出期间的增量数据不可见。D 说反了：需要在服务端维护上下文、还要操心超时清理的正是 scroll。',
  },
  {
    id: 'elasticsearch-03-query-dsl-007',
    type: 'multiple',
    difficulty: 2,
    tags: ['聚合'],
    stem: '下列聚合中，属于 bucket（分桶）聚合的有？（多选）',
    options: [
      { key: 'A', text: 'terms 聚合' },
      { key: 'B', text: 'date_histogram 聚合' },
      { key: 'C', text: 'avg 聚合' },
      { key: 'D', text: 'range 聚合' },
      { key: 'E', text: 'cardinality 聚合' },
    ],
    answers: ['A', 'B', 'D'],
    explanation:
      'bucket 聚合按条件把文档「分桶」：terms 按字段值分桶、date_histogram 按时间间隔分桶、range 按区间分桶，A、B、D 正确。avg 与 cardinality（去重计数，基于近似算法）都是对一批文档计算单一指标，属于 metric 聚合；实践中 metric 常作为子聚合嵌进每个 bucket，得到「每个类目的平均价」这类结果。',
  },
  {
    id: 'elasticsearch-03-query-dsl-008',
    type: 'scenario',
    difficulty: 3,
    tags: ['深分页', 'search_after', '排查'],
    scenario:
      '运营后台「订单查询」用 from/size 实现无限翻页。订单量过千万后，运营翻到约 1000 页时页面报错 Result window is too large, from + size must be less than or equal to: [10000]。同事建议把 index.max_result_window 改成 1000000；照做后 QA 压测发现翻深页时协调节点堆内存飙升甚至 OOM。',
    stem: '最合理的处置是？',
    options: [
      {
        key: 'A',
        text: '把 max_result_window 恢复为 10000：交互式翻页改为基于唯一排序键的 search_after 顺序翻页；确有全量拉取需求的离线任务改用 scroll（或 PIT + search_after）',
      },
      { key: 'B', text: '把 max_result_window 继续调大，同时给节点加内存' },
      { key: 'C', text: '调大每个分片的 size 参数，让分片端缓存全部数据供翻页' },
      { key: 'D', text: '改成每页随机返回文档，绕开深翻页' },
    ],
    answers: ['A'],
    explanation:
      '报错本身是 ES 的保护机制：from/size 深翻页会让每个分片返回 from+size 条文档、在协调节点归并排序后丢弃，越深开销越大，堆内存飙升与 OOM 正是调大窗口的直接后果。A 针对「人翻页」与「机器导数」两类需求分别给出正确方案。B 是把保护拆掉再加码风险，方向完全错误。C 中「分片端缓存全部数据」并非 ES 的机制，调分片参数也解决不了协调节点归并的问题。D 改变了业务语义：运营分页要的是确定顺序，不是随机结果。',
  },
]
