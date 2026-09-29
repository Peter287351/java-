# 03 查询 DSL

## Query DSL 心智模型：match/term、bool 算分与深分页

### 是什么
match 是全文查询：先用字段的分析器处理查询串（分词、小写），再逐词项去倒排匹配；term 是精确查询：输入原样作为一个词项比对，适合 keyword、数值、日期。bool 组合四类子句：must、should 参与 _score 计算（有 must/filter 时 should 退化为加分项，minimum_should_match 默认 0）；filter、must_not 只过滤不打分——filter 的匹配位图（bitset）还会被缓存复用，所以「状态/类目/时间范围放 filter、关键词放 must」是通用优化。分页用 from/size，默认 from+size ≤ 10000（index.max_result_window）：深翻页时每个分片都要取回 from+size 条文档到协调节点归并排序，越深越贵；跨深页用 search_after（无状态、以上一页末尾排序值为游标向后翻），全量导出用 scroll（服务端快照 + 游标上下文）。聚合分两大类：bucket 分桶（terms、date_histogram、range）与 metric 算指标（avg、sum、cardinality 等），metric 常作为子聚合嵌进每个桶。

### 常见坑
- bool 中已有 must/filter 时，should 不再强制匹配（minimum_should_match 默认 0），只加分。
- text 字段上用 term 查原文大概率查不到。
- 调大 max_result_window 治标不治本，深翻页照样把协调节点压到 OOM。
- 高亮默认从 _source 取原文、用 <em></em> 包裹命中词，前后标签可用 pre_tags/post_tags 自定义。

### 面试怎么问
「深分页怎么优化？」——先讲 from/size 的归并成本与 10000 上限的由来，再对比 search_after（实时翻页）与 scroll（离线导出），补一句 PIT + search_after 的演进，最后强调「调大 max_result_window」是错误答案。

## 动手清单

### 练习 1：对比 must 与 filter 的算分与缓存
同一查询条件分别放在 bool.must 与 bool.filter 中执行，对比命中结果的 _score（filter 版恒无得分）；再把同一 filter 查询连发两次，观察第二次明显更快。
自测标准：能说出「filter 不算分」与「filter 匹配结果位图被缓存」两个要点。

### 练习 2：用 search_after 实现翻页
对 orders 按 order_date desc + _id asc 排序取前 10 条，把最后一条的两个排序值作为 search_after 参数翻下一页，连续翻 3 页。
自测标准：能解释 search_after 为什么不能跳页、为什么适合实时翻页，以及排序键为什么要追加唯一的 _id 兜底。
