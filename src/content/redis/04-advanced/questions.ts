import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'redis-04-advanced-001',
    type: 'single',
    difficulty: 2,
    tags: ['分布式锁'],
    stem: '`SETNX lock:order 1` 与 `EXPIRE lock:order 30` 分两条命令加锁，核心问题是什么？',
    options: [
      { key: 'A', text: 'SETNX 的性能太差' },
      { key: 'B', text: '两条命令非原子：SETNX 成功后客户端宕机，EXPIRE 没执行，锁永不释放（死锁）' },
      { key: 'C', text: 'EXPIRE 会立即删除 key' },
      { key: 'D', text: 'SETNX 不支持并发' },
    ],
    answers: ['B'],
    explanation:
      '两条命令之间任何中断都会让"有过期时间的锁"变成"永不过期的死锁"；正确写法是 `SET lock:order <uuid> NX EX 30`，加锁与设置过期一步完成。A/D 不成立；C 是误解 EXPIRE 语义。',
  },
  {
    id: 'redis-04-advanced-002',
    type: 'scenario',
    difficulty: 3,
    tags: ['分布式锁', '误删'],
    scenario:
      '线程 A 加锁后执行耗时任务，锁 30 秒到期自动释放，A 完成后执行 `DEL` 删除锁。故障日志显示：A 的 DEL 执行时，锁实际属于线程 B，B 的互斥被破坏导致超卖。',
    stem: '根因与修复是？',
    options: [
      { key: 'A', text: 'DEL 是危险命令，应改用 UNLINK' },
      { key: 'B', text: 'A 的任务超时导致锁过期后 B 抢到锁，A 却无差别删除了 B 的锁；加锁时写入唯一标识（uuid），释放用 Lua"值相等才删"，并配看门狗续期' },
      { key: 'C', text: '把锁的过期时间改长到 1 小时就不会发生' },
      { key: 'D', text: '应该换 MySQL 行锁，Redis 锁不可靠' },
    ],
    answers: ['B'],
    explanation:
      '锁过期与业务未完成错位后，"无主锁"被任意删除是经典事故；uuid 校验保证只删自己的锁，看门狗解决"任务没完锁先走"。A 的 UNLINK 只是异步删除优化，与本问题无关；C 只是降低概率且锁挂死风险更高；D 一刀切，Redis 锁在多数场景足够。',
  },
  {
    id: 'redis-04-advanced-003',
    type: 'single',
    difficulty: 2,
    tags: ['Redisson'],
    stem: 'Redisson 的看门狗（watchdog）机制解决的问题是？',
    options: [
      { key: 'A', text: '自动重试加锁失败' },
      { key: 'B', text: '持锁业务未完成而锁即将过期时，自动延长锁的过期时间，防止业务执行中锁被别人抢走' },
      { key: 'C', text: '监控 Redis 主从切换' },
      { key: 'D', text: '删除过期的锁 key' },
    ],
    answers: ['B'],
    explanation:
      '看门狗在锁不指定 leaseTime（或使用默认）时启动：每 1/3 过期时间检查并续期，客户端存活则锁不过期，宕机则自然释放——平衡"锁失效"与"业务超时"。A/C/D 都不是看门狗职责。',
  },
  {
    id: 'redis-04-advanced-004',
    type: 'single',
    difficulty: 2,
    tags: ['分布式锁'],
    stem: '分布式锁的 value 使用唯一标识（如 uuid:threadId）的主要目的是？',
    options: [
      { key: 'A', text: '便于排查是哪个业务加的锁' },
      { key: 'B', text: '释放锁时校验持有者身份，防止误删其他客户端的锁；同时支撑可重入计数' },
      { key: 'C', text: '让锁支持跨语言调用' },
      { key: 'D', text: '加密锁的值防止被篡改' },
    ],
    answers: ['B'],
    explanation:
      '释放前用 Lua 比对 value 是否为自己的标识，相等才 DEL——这是防误删的核心；Redisson 的可重入也是基于"持有者标识 + 重入计数"的 Hash 结构。A 是副产品；C/D 无关。',
  },
  {
    id: 'redis-04-advanced-005',
    type: 'single',
    difficulty: 2,
    tags: ['pipeline'],
    stem: 'pipeline（管道）与 MULTI/EXEC 事务的关键区别是？',
    options: [
      { key: 'A', text: 'pipeline 是原子的，MULTI/EXEC 不是' },
      { key: 'B', text: 'pipeline 只是批量发送命令节省网络往返，不保证原子性；MULTI/EXEC 的命令打包顺序执行，中间不会插入其他客户端命令' },
      { key: 'C', text: '两者都支持部分失败后回滚' },
      { key: 'D', text: 'MULTI/EXEC 比 pipeline 快，因为省网络' },
    ],
    answers: ['B'],
    explanation:
      'pipeline 是"运输优化"，服务端仍逐条执行且中间可穿插其他命令；事务保证排他性执行但某条命令失败不会回滚其他命令（Redis 无回滚概念），需要原子组合逻辑时用 Lua。A/C/D 均为常见误解。',
  },
  {
    id: 'redis-04-advanced-006',
    type: 'code',
    difficulty: 2,
    tags: ['Lua'],
    stem: '释放分布式锁的 Lua 脚本如下，为什么必须用 Lua 而不是"GET 后比较再 DEL"？\n\n~~~lua\nif redis.call("get", KEYS[1]) == ARGV[1] then\n  return redis.call("del", KEYS[1])\nelse\n  return 0\nend\n~~~',
    options: [
      { key: 'A', text: 'Lua 脚本执行速度更快' },
      { key: 'B', text: 'Redis 执行 Lua 期间不会插入其他命令，保证"判断是自己的锁"与"删除"两步原子；分两条命令时判断与删除之间锁可能易主' },
      { key: 'C', text: 'Lua 脚本可以操作集群的所有节点' },
      { key: 'D', text: 'GET 命令在事务中不可用' },
    ],
    answers: ['B'],
    explanation:
      '单条 Lua 脚本在 Redis 中原子执行，把"比较 + 删除"合并成一个不可分割的操作；若先 GET 再 DEL，中间锁过期、他人加锁的窗口会再次造成误删。A 是次要因素；C 与原子性无关；D 错误。',
  },
  {
    id: 'redis-04-advanced-007',
    type: 'multiple',
    difficulty: 3,
    tags: ['分布式锁'],
    stem: '使用单实例 Redis 分布式锁，下列风险或注意事项真实存在的有？',
    options: [
      { key: 'A', text: '主从异步复制：主节点写入锁后未同步到从就宕机，切换后另一客户端可再次加锁（双持锁）' },
      { key: 'B', text: '锁必须设置过期时间作兜底，且释放逻辑放在 finally 中' },
      { key: 'C', text: '锁的粒度应尽量小（如锁到具体资源 id），降低冲突概率' },
      { key: 'D', text: '只要用了 Redisson，就绝对不会再出现任何锁问题' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A 是单实例/异步复制的固有风险（RedLock 即为缓解此问题提出，但争议不断，强一致锁可评估 ZooKeeper/etcd）；B/C 是工程实践铁律；D 绝对化——Redisson 解决了续期与可重入，架构级风险与业务编码错误仍需自己负责。',
  },
  {
    id: 'redis-04-advanced-008',
    type: 'single',
    difficulty: 3,
    tags: ['Lua', '原子性'],
    stem: '秒杀场景用 Lua 脚本实现"判断库存 + 扣减 + 记录用户"三步，相比三条 Java 代码依次执行，核心收益是？',
    options: [
      { key: 'A', text: '减少了一次数据库连接' },
      { key: 'B', text: '三步在 Redis 内原子完成，高并发下不会出现"判断通过但扣减被穿插"的超卖；同时省去多次网络往返' },
      { key: 'C', text: 'Lua 可以直接更新 MySQL' },
      { key: 'D', text: 'Lua 脚本会自动分布式部署到所有节点' },
    ],
    answers: ['B'],
    explanation:
      '多步逻辑在应用层逐条执行时，并发请求可能穿插执行导致竞态（判断与扣减分离）；Lua 脚本作为一个命令原子执行，是秒杀防超卖的标准做法。A 措辞错误且非核心；C 不可能；D 与脚本机制无关。',
  },
]
