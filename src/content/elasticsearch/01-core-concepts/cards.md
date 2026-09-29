# 01 核心概念

## ES 的存储与搜索模型：倒排索引、分片与近实时

### 是什么
Elasticsearch 全文检索的基石是倒排索引（inverted index）：文档写入时先被分词成词项（term），再建立「词项 → 包含它的文档 ID 列表（posting list）」的映射——与"文档 → 内容"的正排方向相反，故名倒排。posting list 里还记录词频（TF）、位置（position）、偏移（offset），分别支撑相关性算分、短语查询与高亮；排序和聚合则依赖列式正排结构 doc_values。物理上，一个 index 会被切成多个主分片（primary shard），文档按 `hash(_routing) % 分片数` 落片；副本（replica）用于容灾并分担读流量。ES 是近实时（NRT，Near Real-Time）系统：文档先进 memory buffer 并同步追加 translog，默认每 1 秒 refresh 一次生成新 segment 后才可被搜索，节点宕机靠重放 translog 恢复数据。

### 怎么用（对齐 MySQL 的心智模型）
7.x 起的常用类比：index ≈ table、document ≈ row、field ≈ column（type 已移除）。分工上：MySQL 做主存储与强事务，ES 做搜索与聚合的检索层，两者通过同步机制保持数据一致。

### 常见坑
- `number_of_shards` 是创建索引时的静态设置，建成后改不了（只能 reindex 或 _split 迁移）；`number_of_replicas` 是动态设置，随时可调。
- 单节点集群配了 `replicas > 0` 会 yellow：主分片都在，只是副本无处分配。
- 写入成功不等于立即可搜（refresh 延迟），但按 `_id` 的 GET 是实时的。
- ES 没有事务、不支持 JOIN，不能当唯一数据源扛强一致业务。

### 面试怎么问
「为什么 ES 写入后约 1 秒才搜得到？」——按"memory buffer + translog → refresh 生成 segment → flush 真正持久化"把链路讲完整，再点出 NRT 的含义与"按 _id 查询是实时的"这一对比，体现理解深度。

## 动手清单

### 练习 1：亲眼看见 refresh 延迟
Docker 起单节点 ES，在 Kibana Dev Tools 里依次操作：新建索引 → 写入一篇文档 → 立刻用 match 全文查询（搜不到）→ 等约 1 秒再查（出现）→ 同一刻用 `GET /<index>/_doc/1` 按 _id 查（立刻能查到）。
自测标准：能用 refresh、translog、NRT 说清"全文查不到但按 _id 查得到"的原因。

### 练习 2：观察分片、副本与三色健康
建索引指定 `number_of_shards: 3`、`number_of_replicas: 1`，单节点执行 `GET _cat/shards?v` 与 `GET _cluster/health`，随后把副本数改为 0 再看健康值变化。
自测标准：能解释 3 个 UNASSIGNED 副本从哪来、yellow 与 green 之间切换的原因。
