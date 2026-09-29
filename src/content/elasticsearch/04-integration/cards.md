# 04 实战集成

## 工程集成：RestClient、数据同步与集群运维

### 是什么
Java 侧走 REST 客户端（HTTP 9200 + JSON）：low-level RestClient 只负责发请求，非 2xx 状态码抛 ResponseException（原始响应仍在异常对象里）；RestHighLevelClient / 新版 elasticsearch-java 在其上提供对象化 API。MySQL→ES 同步四大主流方案：同步双写（实现最简单，但侵入业务、易漏写）、MQ 异步（解耦削峰，需幂等 + 重试死信 + 对账三板斧保障最终一致）、canal 伪装 MySQL 从库订阅 binlog（对业务零侵入，适合改造存量系统）、DataX / Logstash JDBC（全量或周期批量迁移，Logstash 抓不到物理删除的行）。线上改 mapping 的标准姿势：新索引 → reindex → 校验 → 别名原子切换 → 删旧索引，业务全程只认别名。集群三色健康：green 主副本全就绪、yellow 主分片齐但副本未分配、red 主分片缺失数据不可读写。写入调优三板斧：导入期 refresh_interval=-1、副本临时调 0、bulk 大批量并发写，导完恢复并 force merge。

### 常见坑
- 双写漏写 ES、失败无补偿，不一致在事故后才暴露。
- 消费端不幂等，MQ 重试造成重复写入或乱序覆盖（旧值覆新值）。
- 别名切换前没校验新索引的 mapping 与文档数量。
- 把 max_result_window 调大当深分页解法（详见查询 DSL 章）。

### 面试怎么问
「MySQL 与 ES 怎么保持一致？」——先列方案与取舍（双写 / MQ / canal / DataX），再给最终一致三板斧（幂等、重试死信、对账补偿），最后点明异步链路只能到最终一致，强一致需求留在 MySQL。

## 动手清单

### 练习 1：别名无缝重建演练
建 goods_v1 写入几条数据 → 建 goods_v2（改一处 mapping）→ POST _reindex 迁移数据 → 用一个原子请求 POST /_aliases 完成 add goods_v2 + remove goods_v1 → 观察后删除 goods_v1。
自测标准：切换后通过别名 goods 查询命中的是新索引，业务侧索引名全程未变。

### 练习 2：Java RestClient 冒烟测试
用 low-level RestClient 连 localhost:9200，GET /_cluster/health 打印状态码与响应体；再 GET 一个不存在的索引，观察 ResponseException 与其中的 404。
自测标准：能解释「非 2xx 抛 ResponseException、原始响应仍在异常里」这一 low-level 客户端的核心行为。
