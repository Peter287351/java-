## 优化实战：从慢 SQL 到架构

### 是什么
优化路径：**慢查询日志定位 → EXPLAIN 分析 → 索引/SQL 改写 → 架构手段**（读写分离、分库分表、缓存）。EXPLAIN 重点看：`type`（system>const>eq_ref>ref>range>index>ALL，到 range 起码可用）、`key`（实际用到的索引）、`rows`（预估扫描行数）、`Extra`（Using index 覆盖索引好 / Using filesort 需额外排序 / Using temporary 用了临时表）。

### 为什么
深分页 `LIMIT 1000000,20` 要扫描并丢弃前 100 万行；优化思路是**游标法**（`WHERE id > 上页最大id LIMIT 20`）或**延迟关联**（先用覆盖索引找出 20 个 id 再回表）。

### 怎么用
- `count(*) ≈ count(1) > count(主键) > count(普通列)`（列要判 NULL），官方优化器对 `count(*)` 有专门优化。
- 主从延迟：主库并发写 > 单从库回放能力；处置——并行复制（MTS）、拆分读流量、延迟监控兜底。
- 分库分表是最后手段：先索引/缓存/归档冷数据。

### 常见坑
- "EXPLAIN 走了索引"不等于快：`type=index` 是扫全索引，可能比全表还慢。
- 读写分离后写后立读会读到旧数据（主从延迟）——关键读走主库或会话内粘主库。

### 面试怎么问
「线上 SQL 突然变慢怎么排查？」——慢日志 → EXPLAIN 看执行计划变化 → 是否索引失效/统计信息过期 → 数据量与锁等待，体现完整链路。

## 动手清单

1. 造一张 100 万行表，执行 `SELECT * FROM t ORDER BY id LIMIT 900000, 10;`，再用游标法 `WHERE id > 900000 LIMIT 10` 对比耗时。自测标准：能解释延迟关联为什么有效。
2. 对一条慢 SQL 跑 `EXPLAIN`，把 type/key/rows/Extra 四列抄下来逐列解读。自测标准：能说出当前 type 距离 range 还差什么。
