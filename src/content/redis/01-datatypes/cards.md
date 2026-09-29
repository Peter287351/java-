## 五大基础类型与典型场景

### 是什么
String（缓存/计数/分布式锁）、List（消息队列/最新列表，底层 quicklist）、Hash（对象属性）、Set（去重/抽奖/共同关注，底层 intset/hashtable）、Zset（排行榜/延迟队列，跳表+哈希）。

### 为什么
选型即设计：签到用 BitMap（1 亿用户日活仅 12MB 级）、UV 用 HyperLogLog（0.81% 误差换 12KB）、附近的人用 GEO——用错类型直接决定内存与性能。

### 怎么用
- Zset：`ZADD`/`ZRANGE ... WITHSCORES`/`ZREVRANGE`；跳表让范围查询 O(logN)。
- 过期时间只到 key 级（Hash 内字段不能单独过期）；删除策略 = 惰性删除 + 定期抽样删除。
- 内存淘汰策略：`maxmemory` 满后按 `allkeys-lru` / `volatile-lru` / `noeviction`（默认，满了写入报错）等执行。

### 常见坑
- String 存对象频繁改单字段 → 用 Hash 减少网络与反序列化。
- `KEYS *` 是 O(N) 阻塞命令，线上用 `SCAN` 游标遍历。

### 面试怎么问
「排行榜怎么做？」——Zset：score 排序、`ZINCRBY` 更新、`ZREVRANGE` 取 TopN，答出跳表原理加分。

## 动手清单

1. 用 Zset 实现"文章热度榜"：`ZINCRBY hot:articles 1 "id:1001"`、取 Top10。自测标准：能说出并列分数的处理与按时间排序的变体（score 拼时间戳）。
2. 分别用 String 与 Hash 存用户对象，`redis-cli --stat` 对比内存。自测标准：能说明什么时候 Hash 更省（字段多、单改频繁）。
