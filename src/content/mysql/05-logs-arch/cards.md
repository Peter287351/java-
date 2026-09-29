## 三大日志与一条 UPDATE 的旅程

### 是什么
- **redo log**（InnoDB，物理日志）：记录"某页做了某修改"，先写日志再刷盘（WAL），循环写，保证 **crash-safe**（宕机重启重放恢复）。
- **undo log**：记录反向操作，用于回滚与 MVCC 版本链。
- **binlog**（Server 层，逻辑日志）：追加写，用于主从复制与时间点恢复。

### 为什么
两阶段提交（redo log prepare → 写 binlog → redo log commit）：保证两份日志一致。反例：若先写 redo 后写 binlog 时崩溃，主库恢复出该事务、从库却没有——主从不一致。

### 怎么用
一条 UPDATE：Buffer Pool 改页（脏页）→ 写 undo → 写 redo（prepare）→ 写 binlog → redo 置为 commit。脏页由后台线程按 checkpoint 机制刷盘。参数 `innodb_flush_log_at_trx_commit=1` + `sync_binlog=1`（双 1）最安全，代价是每次提交都刷盘。

### 常见坑
- "MySQL 奇怪地重启后数据没丢"——是 redo log 在兜底，不是数据页已刷盘。
- `innodb_flush_log_at_trx_commit=2` 性能好但宕机可能丢 1 秒事务，金融类业务慎用。

### 面试怎么问
「redo log 和 binlog 区别」三层作答：层次（InnoDB vs Server）、内容（物理 vs 逻辑）、写入方式（循环写 vs 追加写）。

## 动手清单

1. 开两个窗口，`SET GLOBAL innodb_flush_log_at_trx_commit = 2;` 前后各做一次 1 万条插入压测，对比耗时。自测标准：能说出双 1 设置换取了什么、牺牲了什么。
2. 查 `SHOW VARIABLES LIKE '%binlog%';` 确认 binlog 格式为 ROW。自测标准：能解释 ROW 格式对主从一致性与恢复的优势。
