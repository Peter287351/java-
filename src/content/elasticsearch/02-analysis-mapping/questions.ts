import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'elasticsearch-02-analysis-mapping-001',
    type: 'single',
    difficulty: 1,
    tags: ['analysis'],
    stem: '文本写入 ES 时会经过 analysis 三个阶段，最终产出倒排索引中的词项。三个阶段的正确顺序是？',
    options: [
      { key: 'A', text: 'tokenizer → character filter → token filter' },
      { key: 'B', text: 'character filter → tokenizer → token filter' },
      { key: 'C', text: 'token filter → tokenizer → character filter' },
      { key: 'D', text: '三者并行处理，没有先后关系' },
    ],
    answers: ['B'],
    explanation:
      '分析链路是「先清洗、再切词、后加工」：character filter 先对原始字符流预处理（如 html_strip 去 HTML 标签、字符映射替换）；tokenizer 接着把文本切成一个个 token；token filter 最后做规范化（lowercase 小写、停用词过滤、同义词、词干化），B 正确。A、C 顺序颠倒：不先清洗就可能把标签文本误切，token filter 也必须等 tokenizer 产出 token 后才能逐词加工。D 错误：三阶段是串行管道，前一阶段的输出是后一阶段的输入。',
  },
  {
    id: 'elasticsearch-02-analysis-mapping-002',
    type: 'single',
    difficulty: 1,
    tags: ['IK 分词器'],
    stem: '安装 IK 分词器后，关于 ik_max_word 与 ik_smart 的区别，正确的是？',
    options: [
      { key: 'A', text: 'ik_max_word 按词典做最细粒度切分，会切出更多重叠词项；ik_smart 做粗粒度切分，词项更少更「干净」' },
      { key: 'B', text: '只有 ik_smart 支持自定义词典扩展' },
      { key: 'C', text: 'ik_max_word 应该用在查询语句上，ik_smart 用在建立索引时' },
      { key: 'D', text: '两者切词结果完全一致，只是性能不同' },
    ],
    answers: ['A'],
    explanation:
      'ik_max_word 会把文本按词典尽可能细地切分（如「中华人民共和国国歌」能切出多个重叠词项），索引侧用它让可命中的词项更多、召回更高；ik_smart 粗粒度切分、词项更少，查询侧用它减少无意义组合、提升效率与精度，A 正确。B 错误：两种分析器共用同一套 IK 主词典与扩展词库配置。C 把常见的最佳实践说反了：索引 ik_max_word、查询 ik_smart。D 错误：两者切分粒度不同，结果明显不同。',
  },
  {
    id: 'elasticsearch-02-analysis-mapping-003',
    type: 'single',
    difficulty: 2,
    tags: ['keyword', 'text', 'term 查询'],
    stem: `索引 goods 的 mapping 与已写入文档如下（title 经标准分词，产出 iphone、15、pro 三个词项）：

~~~json
PUT /goods
{
  "mappings": {
    "properties": {
      "title":    { "type": "text" },
      "category": { "type": "keyword" }
    }
  }
}

{ "title": "iPhone 15 Pro", "category": "手机通讯" }
~~~

下列查询【能】命中该文档的是？`,
    options: [
      { key: 'A', text: 'term 查询 category = "手机通讯"' },
      { key: 'B', text: 'term 查询 title = "iPhone 15 Pro"' },
      { key: 'C', text: 'match 查询 category = "手机 通讯"' },
      { key: 'D', text: 'match 查询 title = "iphone15pro"' },
    ],
    answers: ['A'],
    explanation:
      'keyword 不分词、按完整原值索引，term 对其做精确匹配，A 命中。B 错误：text 入倒排的是分词后的小写词项（iphone、15、pro），整句 "iPhone 15 Pro" 不是任何一个词项，term 匹配不上。C 错误：match 在 keyword 字段上不再做分析，"手机 通讯"（含空格）与存储值 "手机通讯" 不相等。D 错误：查询串经分析器产出词项 iphone15pro，与倒排中的 iphone、15、pro 都不相等。规律：term 配 keyword（精确值），match 配 text（全文）。',
  },
  {
    id: 'elasticsearch-02-analysis-mapping-004',
    type: 'single',
    difficulty: 3,
    tags: ['dynamic mapping'],
    stem: '未预先定义 mapping，直接向索引写入一篇 JSON 文档。下列关于 ES 自动推断（dynamic mapping）的说法正确的是？',
    options: [
      { key: 'A', text: '所有字符串字段一律映射为纯 text，不带任何子字段' },
      { key: 'B', text: '符合默认日期格式的字符串会被推断为 date；普通字符串默认是 text 并自动带 keyword 子字段' },
      { key: 'C', text: '纯数字字符串默认会被推断为 long 或 double' },
      { key: 'D', text: '值为 null 的字段也会建立倒排索引，便于按 null 过滤' },
    ],
    answers: ['B'],
    explanation:
      'dynamic mapping 默认开启 date_detection：形如 2024-06-18 的字符串被推断成 date，这是著名事故源；其余字符串默认 text + .keyword 子字段，B 正确。A 错误：默认字符串是 text + keyword 双结构。C 错误：numeric_detection 默认关闭，纯数字字符串仍是 text，之后做数值聚合会直接报错。D 错误：null 不会进入倒排，也无法按 null 过滤，只能用 exists 查询反向排除「无值」的文档。',
  },
  {
    id: 'elasticsearch-02-analysis-mapping-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['fields'],
    stem: `mapping 中字段定义如下。关于多字段（fields），下列说法正确的有？（多选）

~~~json
"brand": {
  "type": "text",
  "analyzer": "ik_max_word",
  "fields": {
    "raw": { "type": "keyword" }
  }
}
~~~`,
    options: [
      { key: 'A', text: 'brand 主字段用于全文检索，brand.raw 用于精确匹配、排序与聚合' },
      { key: 'B', text: 'brand.raw 索引的值与 brand 相同，但不分词、按整值处理' },
      { key: 'C', text: '写入文档时只需要写 brand 字段，raw 子字段自动同步生成' },
      { key: 'D', text: '子字段名只能叫 raw 或 keyword，不能自定义' },
      { key: 'E', text: '子字段可以配置与主字段不同的分析器（如 english）' },
    ],
    answers: ['A', 'B', 'C', 'E'],
    explanation:
      'fields 让同一份字段值以多种方式索引：主字段 text 分词服务全文搜索，raw 子字段 keyword 服务 term 精确查询、排序与聚合，A、B 正确。C 正确：写入只写主字段，ES 自动把值派发到各子字段，_source 中并不会出现 brand.raw。D 错误：子字段名任意，raw、keyword 只是社区惯例。E 正确：每个子字段可以独立设置 type 与 analyzer，这正是「同一个值、多种分析方式」的标准手段。',
  },
  {
    id: 'elasticsearch-02-analysis-mapping-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['dynamic mapping', 'reindex', '排查'],
    scenario:
      '团队把 MySQL 订单数据同步到 ES 时没有预先定义 mapping。上线两周后反馈两个问题：① 按「下单月份」month_no（业务上是 1~12 的整数）聚合销量时报错 Field [month_no] of type [text] is not supported for aggregation；② 活动字段 start_date 起初同步的都是 "2024-06-18" 这类字符串，某天运营把值填成「2024年6月18日」后，该文档同步到 ES 时报 mapper_parsing_exception 被拒绝写入。',
    stem: '最可能的原因与正确处置是？',
    options: [
      { key: 'A', text: 'ES 集群版本 bug，应升级到最新小版本' },
      {
        key: 'B',
        text: 'dynamic mapping 把 month_no 推断成了 text（无法聚合）、把 start_date 推断成了 date（格式不符即拒绝写入）；已定义字段的类型不可原地修改，应显式设计 mapping 后新建索引，reindex 迁移历史数据并经别名切换上线',
      },
      { key: 'C', text: '同步服务丢了部分消息，应改为双写并全量重灌' },
      { key: 'D', text: '对现有索引用 PUT mapping 直接把 month_no 改成 integer、start_date 改成 text 即可' },
    ],
    answers: ['B'],
    explanation:
      '两个现象分别命中 dynamic mapping 的两大坑：纯数字字符串默认推断为 text（numeric_detection 默认关闭），聚合自然报「不支持」；date_detection 默认开启，"2024-06-18" 被推断成 date，换成中文日期格式就解析失败、文档被拒写。ES 不允许原地修改已有字段的类型，只能「新索引 + 正确 mapping + reindex + 别名切换」，B 正确。A 无证据。C 误诊：丢消息解释不了与字段类型直接相关的报错。D 想当然：已定义字段的类型就是改不动，这正是必须 reindex 的原因。',
  },
  {
    id: 'elasticsearch-02-analysis-mapping-007',
    type: 'code',
    difficulty: 2,
    tags: ['keyword', 'match 查询'],
    stem: `索引 goods 已存在一篇文档 brand = "HuaWei"（写入成功），mapping 如下：

~~~json
PUT /goods
{
  "mappings": {
    "properties": {
      "brand": { "type": "keyword" }
    }
  }
}
~~~

执行查询：

~~~json
GET /goods/_search
{
  "query": {
    "match": { "brand": "HuaWei" }
  }
}
~~~

查询结果是？`,
    options: [
      { key: 'A', text: '命中：match 会把查询串分词并小写化后再匹配' },
      { key: 'B', text: '命中：match 作用在 keyword 字段上时不做分析，把 "HuaWei" 作为整体精确匹配' },
      { key: 'C', text: '不命中：keyword 字段只能用 term 查询' },
      { key: 'D', text: '不命中：match 一律小写化，与 "HuaWei" 不相等' },
    ],
    answers: ['B'],
    explanation:
      'match 查询在非 text 字段（keyword、数值、日期）上不会经过分析器，查询串原样作为一个 term 去精确匹配，因此 "HuaWei" 命中 brand="HuaWei"，B 正确。C 错误：match 在 keyword 字段上不仅可用，行为还与 term 等价；真正的禁忌是反过来在 text 字段上用 term 查原文。A、D 把 text 字段的行为（查询串先分析、标准分词会小写化）错误地套到了 keyword 字段上。',
  },
]
