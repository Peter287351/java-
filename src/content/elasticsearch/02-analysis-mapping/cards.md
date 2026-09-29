# 02 分词与 Mapping

## 分词（analysis）与 Mapping 设计

### 是什么
文本进入倒排索引前要经过 analysis 三阶段的串行管道：character filter（清洗原始字符流，如 html_strip 去 HTML 标签）→ tokenizer（切词，产出 token）→ token filter（小写、去停用词、同义词、词干化）。中文场景一般安装 IK 分词器：ik_max_word 按词典做最细粒度切分（索引侧用，可命中的词项多、召回高），ik_smart 粗粒度切分（查询侧用，词项少、更干净）。字段类型决定匹配行为：text 分词后进倒排，配 match 做全文搜索；keyword 不分词、整值索引，配 term 做精确匹配、排序与聚合。不写 mapping 就直接灌数据，dynamic mapping 会自动"猜"类型：字符串默认 text + keyword 子字段，符合日期格式的字符串被猜成 date。

### 怎么用
- 生产必须显式写 mapping 再导数据：搜索字段用 text 主字段 + keyword 子字段（fields）双能力，子字段名任意（raw 只是惯例），子字段还能配不同的分析器。
- IK 固定搭配：索引侧 ik_max_word、查询侧 ik_smart。

### 常见坑
- 纯数字字符串默认推断为 text（numeric_detection 默认关闭），之后数值聚合会失败。
- "2024-06-18" 形态的值被 date_detection 猜成 date，格式一变就 mapper_parsing_exception 拒写。
- text 字段用 term 查原文大概率 miss：倒排里只有分词后的小写词项。
- 已定义字段的类型不能原地修改，修复只能新索引 + reindex + 别名切换。

### 面试怎么问
「keyword 和 text 的区别？」——四步答全：是否分词 → 倒排内容差异 → 各配什么查询（term vs match）→ 排序聚合选谁；再补一句 fields 多字段是生产最常见的写法，体现实战。

## 动手清单

### 练习 1：用 _analyze 看清分词差异
POST /_analyze 分别以 ik_max_word 与 ik_smart 分析「中华人民共和国国歌」，对比两者产出的 token 数量与内容。
自测标准：能说清两者粒度差异，以及各自应放在索引侧还是查询侧。

### 练习 2：亲历 dynamic mapping 的坑
不建 mapping 直接写入 {"code": "2024-06-18"}，GET /<index>/_mapping 观察它被推断成了 date；随后写入 {"code": "ABC-123"}，看文档被 mapper_parsing_exception 拒绝。
自测标准：能复述 date_detection 的风险与规避手段（显式 mapping，或关闭 date_detection / 显式指定字段类型）。
