## 分布式锁与高级特性

### 是什么
分布式锁演进：`SETNX` + `EXPIRE` 两步非原子 → **`SET key uuid NX EX 30`** 一步原子加锁 → 释放时用 **Lua 校验 uuid 再删**（防误删他人锁）→ **Redisson**（可重入、看门狗自动续期、支持 RedLock 议题）。

### 为什么
锁的三大坑：① 加锁与过期非原子，宕机后死锁；② 业务超时锁先过期，A 删掉了 B 的锁；③ 主从切换锁丢失（异步复制）。看门狗解决 ②：持锁线程存活期间每 1/3 过期时间续期。

### 怎么用
- Lua 保证"判断+执行"原子：`if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', ...) end`
- 管道（pipeline）：一次网络往返发多条命令，省 RTT，但非原子；事务 MULTI/EXEC 打包执行但不支持回滚；需要原子组合用 Lua。
- 正确姿势：锁粒度小、过期时间兜底、释放必须 finally。

### 常见坑
- `del` 前不校验持有者 = 可能删掉别人的锁。
- 单点锁在主从切换时可能"双持锁"，强一致锁场景评估 ZooKeeper/etcd 或 RedLock 争议。

### 面试怎么问
「Redis 分布式锁怎么写才对」按演进链路讲，收尾主动提 Redisson 看门狗——体现从错误到正确的思考过程。

## 动手清单

1. 手写"SET NX EX + Lua 释放"锁工具类，两个线程并发跑计数器各加 1000 次，验证总数。自测标准：能解释 uuid 与 Lua 各自防了什么坑。
2. 用 Redisson `tryLock(3, 30, TimeUnit.SECONDS)` 实现防重复提交，日志打印看门狗续期。自测标准：能说出 tryLock 与 lock 的语义差别。
