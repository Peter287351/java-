import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'redis-03-cache-patterns-001',
    type: 'single',
    difficulty: 1,
    tags: ['缓存穿透'],
    stem: '攻击者用大量随机不存在的商品 id 请求详情接口，DB 压力骤增但 Redis 命中率正常。这是什么问题？',
    options: [
      { key: 'A', text: '缓存击穿' },
      { key: 'B', text: '缓存穿透' },
      { key: 'C', text: '缓存雪崩' },
      { key: 'D', text: '缓存污染' },
    ],
    answers: ['B'],
    explanation:
      '查询"数据库里也不存在"的数据，缓存永远不会命中，每次都打到 DB——这就是穿透。击穿针对"存在的热点 key 过期"；雪崩是"大面积 key 同时失效"；缓存污染指无用数据挤占内存，题干与后三者现象不符。',
  },
  {
    id: 'redis-03-cache-patterns-002',
    type: 'scenario',
    difficulty: 3,
    tags: ['缓存击穿'],
    scenario:
      '详情页 QPS 5000。某天营销活动把商品 id=888 的缓存 TTL 统一设为 "整点过期"，整点瞬间该商品查询全部落到 MySQL，DB CPU 100%，接口大量超时约 30 秒。',
    stem: '现象判断与组合处置最合理的是？',
    options: [
      { key: 'A', text: '缓存穿透：加布隆过滤器即可' },
      { key: 'B', text: '缓存击穿（热点 key 集中过期）：互斥锁只放一个请求回源重建，其余等待/返回旧值；同时把 TTL 改为随机抖动' },
      { key: 'C', text: '缓存雪崩：重启 Redis 集群恢复' },
      { key: 'D', text: 'MySQL 性能不足，立即扩容从库' },
    ],
    answers: ['B'],
    explanation:
      '"单个热点 key + 集中过期 + 并发回源打垮 DB"是标准击穿。互斥锁保证只有一个请求重建缓存，逻辑过期方案则完全不阻塞。A 的穿透是"不存在数据"，与题干矛盾；C 雪崩是"大面积失效"而非单个 key；D 没有解决根因，扩容成本也高。',
  },
  {
    id: 'redis-03-cache-patterns-003',
    type: 'multiple',
    difficulty: 2,
    tags: ['缓存雪崩'],
    stem: '为防止缓存雪崩，下列措施有效的有？',
    options: [
      { key: 'A', text: '过期时间加随机值，避免大量 key 同时失效' },
      { key: 'B', text: 'Redis 主从 + 哨兵/集群保证服务高可用' },
      { key: 'C', text: 'DB 侧限流降级，缓存重建失败时返回兜底数据' },
      { key: 'D', text: '把所有 key 的 TTL 设成相同的固定值，便于统一管理' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      '雪崩的两个成因对应两类对策：key 同时失效 → 随机 TTL；Redis 整体不可用 → 高可用 + 限流降级兜底。D 恰恰制造了同时失效，是反面教材。',
  },
  {
    id: 'redis-03-cache-patterns-004',
    type: 'single',
    difficulty: 2,
    tags: ['一致性'],
    stem: '采用 Cache Aside 模式保证缓存与数据库一致性，写操作的推荐顺序是？',
    options: [
      { key: 'A', text: '先更新缓存，再更新数据库' },
      { key: 'B', text: '先删除缓存，再更新数据库（常规场景首选）' },
      { key: 'C', text: '先更新数据库，再删除缓存（常规场景首选）' },
      { key: 'D', text: '同时更新数据库和缓存' },
    ],
    answers: ['C'],
    explanation:
      '"先更库再删缓存"（Cache Aside）是常规首选：删除是懒重建，并发写不会乱序覆盖缓存。B 的"先删后更"在删除后、更新前的窗口里，读请求会把旧值重新塞进缓存，不一致概率明显更高；A 缓存可能写到回滚的脏数据；D 无法原子化。',
  },
  {
    id: 'redis-03-cache-patterns-005',
    type: 'code',
    difficulty: 2,
    tags: ['一致性'],
    stem: '采用"先更新数据库，再删除缓存"。观察下面并发时序，最终缓存里的值是什么？\n\n~~~text\n时刻 t1: 读请求 A: 缓存未命中 → 查 DB 得 v=1\n时刻 t2: 写请求 B: 更新 DB 为 v=2 → 删除缓存\n时刻 t3: 读请求 A: 把 v=1 写回缓存\n~~~',
    options: [
      { key: 'A', text: '缓存为空，等下次读时回填 v=2' },
      { key: 'B', text: '缓存中是旧值 v=1，出现不一致' },
      { key: 'C', text: '缓存中是 v=2，因为 t2 已删除过' },
      { key: 'D', text: 'Redis 报错，禁止回填' },
    ],
    answers: ['B'],
    explanation:
      'A 在 t1 读到旧值后因为某种阻塞（GC、网络）迟迟未回填，B 完成了"更库+删缓存"，A 才把旧值写回——这是"先更库再删缓存"理论上的不一致窗口，概率低但存在。对策：延迟双删（写后延迟再删一次）或 binlog 订阅异步删除。A 与题干"回填"矛盾；C 忽略了 t3 的覆盖；D 不存在。',
  },
  {
    id: 'redis-03-cache-patterns-006',
    type: 'single',
    difficulty: 3,
    tags: ['布隆过滤器'],
    stem: '使用布隆过滤器拦截缓存穿透，下列关于其特性的说法正确的是？',
    options: [
      { key: 'A', text: '说"元素一定存在"时 100% 准确' },
      { key: 'B', text: '判断"不存在"一定准确，判断"存在"可能误判；标准实现不支持删除（计数型除外）' },
      { key: 'C', text: '判断结果 100% 准确，只是节省内存' },
      { key: 'D', text: '元素越多误判率越低' },
    ],
    answers: ['B'],
    explanation:
      '布隆过滤器用多个哈希置位：任一位为 0 → 一定不存在；全为 1 → 可能存在（其他元素的位叠加导致误判）。填充越满误判越高，所以 D 反了；C 完全相反；A 是"存在"方向恰恰不保证的点。',
  },
  {
    id: 'redis-03-cache-patterns-007',
    type: 'single',
    difficulty: 3,
    tags: ['逻辑过期'],
    stem: '与"互斥锁重建缓存"相比，"逻辑过期"方案的特点是？',
    options: [
      { key: 'A', text: '读写磁盘代替 Redis，性能更差' },
      { key: 'B', text: 'value 中自带过期时间字段：读到"已过期"的 value 返回旧值并异步重建，不阻塞用户请求，但短暂数据不新' },
      { key: 'C', text: '可以保证缓存与数据库强一致' },
      { key: 'D', text: '适合所有 key，包括冷数据' },
    ],
    answers: ['B'],
    explanation:
      '逻辑过期不设 Redis TTL，value 里带过期时间：过期后由异步线程重建、请求立即返回旧值——优点是绝不阻塞，代价是窗口内旧数据。A 杜撰；缓存方案本就非强一致，C 错；冷数据也要常驻内存维护，通常只给少数热点 key 用，D 错。',
  },
  {
    id: 'redis-03-cache-patterns-008',
    type: 'scenario',
    difficulty: 3,
    tags: ['一致性', '写多读少'],
    scenario:
      '商品详情缓存 10 分钟。DBA 反馈：每次大批量商品上下架后 1 分钟内，DB 读 QPS 出现尖峰；业务侧确认这些商品都属于"更新很频繁但查询中等"的数据。',
    stem: '结合 Cache Aside 的写路径，最可能的优化方向是？',
    options: [
      { key: 'A', text: '把"更新 DB 后删缓存"改成"更新 DB 后把新值写入缓存"，减少重建回源' },
      { key: 'B', text: '这类写多读中数据可以缩短缓存 TTL 或不缓存，改为 DB 直读 + 局部小缓存；同时批量上下架错峰执行' },
      { key: 'C', text: '把缓存 TTL 从 10 分钟延长到 24 小时' },
      { key: 'D', text: '上下架改走 Redis 的 Pub/Sub 通知前端刷新' },
    ],
    answers: ['B'],
    explanation:
      '写多场景每次删除都会触发下次读回源，尖峰正是"删缓存→集中重建"的节律；对这类数据缩短/放弃缓存、错峰批量操作更对症。A 的"更新缓存"在并发写时可能把旧值覆盖新值，且写多场景缓存命中率低、做了也白做；C 会让脏数据存活 24 小时，方向错误；D 治标不治本。',
  },
]
