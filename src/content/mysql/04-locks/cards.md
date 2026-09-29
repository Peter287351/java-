## InnoDB 锁体系：行锁锁的是索引

### 是什么
InnoDB 锁分三层：全局锁（FTWRL，备份用）、表级锁（表锁、MDL 元数据锁、意向锁、AUTO-INC 锁）、行级锁。行级锁有三种：**记录锁**（Record Lock，锁单条索引记录）、**间隙锁**（Gap Lock，锁区间防插入，RR 独有）、**临键锁**（Next-Key Lock = 记录 + 前面的间隙，RR 默认）。

### 为什么
"行锁锁的是索引记录"是核心：UPDATE 走了索引只锁命中的记录；**没走索引会全表扫描，把扫过的所有记录（甚至全部行）都锁上**，并发直接崩。

### 怎么用
- RR 下唯一索引等值命中 → 退化为记录锁；未命中 → 间隙锁。
- 范围查询 → 临键锁。
- 乐观锁：表加 `version` 字段，`UPDATE ... SET version=version+1 WHERE id=? AND version=?`，影响行数为 0 即冲突重试。
- 死锁排查：`SHOW ENGINE INNODB STATUS` 看 LATEST DETECTED DEADLOCK。

### 常见坑
- 两个事务**按不同顺序**更新同一组行是死锁最经典来源——统一按 id 排序更新可避免。
- `SELECT ... FOR UPDATE` 不走索引等于锁表级效果。

### 面试怎么问
「update 没走索引会怎样？」——全表扫描逐行加锁，等效锁全表，是线上锁雪崩的常见元凶。

## 动手清单

1. 两个会话分别按相反顺序更新 id=1 和 id=2（先 BEGIN 再 UPDATE），观察其中一个报 `Deadlock found`，再用 `SHOW ENGINE INNODB STATUS` 找到死锁日志。自测标准：能指出两个事务各自持有的锁与等待的锁。
2. 给无索引列建表，会话 A `UPDATE ... WHERE no_index_col=1`（不提交），会话 B 更新另一行，观察被阻塞。自测标准：能解释"行锁锁在扫描过的索引记录上"。
