import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'redis-01-datatypes-001',
    type: 'single',
    difficulty: 1,
    tags: ['数据类型'],
    stem: '要实现"7 天内连续签到"与"每日活跃用户数"的统计，最适合的 Redis 类型是？',
    options: [
      { key: 'A', text: 'String 按 天:key 存用户 ID 列表' },
      { key: 'B', text: 'BitMap：每天一个位图，某用户签到则把对应偏移量置 1' },
      { key: 'C', text: 'Set：每天一个集合存签到用户' },
      { key: 'D', text: 'List：每天追加签到用户 ID' },
    ],
    answers: ['B'],
    explanation:
      'BitMap 每用户每天只占 1 位，1 亿用户一天约 12MB，`BITCOUNT`/`BITOP AND` 直接算连续签到与活跃。C/D 语义可行但内存是用户 ID 长度级别，差距数量级；A 同理且还要反序列化。',
  },
  {
    id: 'redis-01-datatypes-002',
    type: 'single',
    difficulty: 1,
    tags: ['Zset'],
    stem: '游戏积分排行榜需要实时更新分数并随时取 Top 100，最适合的类型是？',
    options: [
      { key: 'A', text: 'List 用 LPUSH + LRANGE' },
      { key: 'B', text: 'Set 用 SADD，取用时排序' },
      { key: 'C', text: 'Zset：score 存积分，ZINCRBY 更新，ZREVRANGE 取 TopN' },
      { key: 'D', text: 'Hash：field=用户，value=积分' },
    ],
    answers: ['C'],
    explanation:
      'Zset 按 score 有序，跳表 + 哈希双重结构让"更新分数"与"按排名取区间"都是 O(logN)，这是排行榜标准解。A 的 List 无序且更新要重排；B 取用时要全局排序；D 无法按分数排序。',
  },
  {
    id: 'redis-01-datatypes-003',
    type: 'single',
    difficulty: 2,
    tags: ['过期删除'],
    stem: 'Redis 的过期 key 删除策略是哪种组合？',
    options: [
      { key: 'A', text: '到期瞬间由定时器精确删除' },
      { key: 'B', text: '惰性删除（访问时检查）+ 定期删除（周期性抽样清理）' },
      { key: 'C', text: '只靠内存满时的淘汰策略删除' },
      { key: 'D', text: '由客户端负责删除过期 key' },
    ],
    answers: ['B'],
    explanation:
      'Redis 不为每个 key 维护定时器：访问到过期 key 时惰性删除；后台周期性随机抽样过期字典，超过比例就继续删，兼顾 CPU 与内存。A 代价过高；C 是"内存淘汰"，在过期删除之后兜底，二者不是一回事。',
  },
  {
    id: 'redis-01-datatypes-004',
    type: 'single',
    difficulty: 2,
    tags: ['内存淘汰'],
    stem: 'Redis 配置了 `maxmemory` 且策略为默认值 `noeviction`，内存写满后再执行 SET 会发生什么？',
    options: [
      { key: 'A', text: '自动淘汰最旧的 key 后写入成功' },
      { key: 'B', text: '返回写入错误（OOM command not allowed），读操作不受影响' },
      { key: 'C', text: 'Redis 进程崩溃重启' },
      { key: 'D', text: '自动扩容磁盘继续写入' },
    ],
    answers: ['B'],
    explanation:
      'noeviction 是默认策略：内存满后所有写命令报错、读命令正常——线上常表现为"突然大量写入失败"。A 是 allkeys-lru 等策略的行为；C/D 不存在。',
  },
  {
    id: 'redis-01-datatypes-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['数据类型'],
    stem: '下列"业务场景 → 类型"的搭配，合理的有？',
    options: [
      { key: 'A', text: '商品详情页缓存对象（字段多、单独更新频繁）→ Hash' },
      { key: 'B', text: '统计文章点赞用户并支持"是否点赞过"判断 → Set' },
      { key: 'C', text: '精确统计亿级页面的每日 UV 且内存受限 → HyperLogLog' },
      { key: 'D', text: '秒杀库存扣减的高精度计数 → HyperLogLog' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'HyperLogLog 是基数估计结构，标准误约 0.81%，只适合"可容忍误差的计数"（UV），绝不能用于库存这种必须精确的扣减——库存用 String 的 `DECR` 或 Lua 原子扣减。A/B 均为经典选型。',
  },
  {
    id: 'redis-01-datatypes-006',
    type: 'code',
    difficulty: 2,
    tags: ['Zset'],
    stem: '执行以下命令后，`ZRANGE board 0 -1 WITHSCORES` 的输出是？\n\n~~~bash\nZADD board 90 alice\nZADD board 85 bob\nZADD board 95 carol\nZINCRBY board 10 bob\n~~~',
    options: [
      { key: 'A', text: 'bob 85, alice 90, carol 95' },
      { key: 'B', text: 'alice 90, bob 95, carol 95' },
      { key: 'C', text: 'carol 95, bob 95, alice 90（ZRANGE 默认按分数从大到小）' },
      { key: 'D', text: '报错，ZINCRBY 不能对已有成员加分数' },
    ],
    answers: ['B'],
    explanation:
      'ZINCRBY 把 bob 从 85 加到 95；ZRANGE 默认按 score 从小到大，故 alice(90) → bob(95) → carol(95)，同分按成员字典序。C 记反了方向（从大到小是 ZREVRANGE）；D ZINCRBY 本就支持新成员（score 从 0 起）。',
  },
  {
    id: 'redis-01-datatypes-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['SCAN', '阻塞'],
    scenario:
      '运营批量导入 10 万条数据后，Redis 出现所有请求阻塞数秒；代码里用了 `KEYS prefix:*` 做一次全量清理。',
    stem: '原因与正确做法是？',
    options: [
      { key: 'A', text: 'Redis 单线程处理命令，KEYS 是 O(N) 全量扫描会长时间阻塞其他命令；应改用 SCAN 游标分批遍历' },
      { key: 'B', text: 'Redis 内存不足，调大 maxmemory 即可继续用 KEYS' },
      { key: 'C', text: '应在业务低峰把 KEYS 换成 MGET 批量执行' },
      { key: 'D', text: '升级 Redis 到集群模式，KEYS 就变快了' },
    ],
    answers: ['A'],
    explanation:
      'KEYS 一次遍历整个键空间且执行期间不响应其他命令，10 万 key 就足以造成秒级卡顿；SCAN 通过游标分批返回（每次 O(常数)），不阻塞主线程。B 治不了阻塞；MGET 是按 key 取值，C 概念错位；D 集群里 KEYS 仍是对节点本地的 O(N) 阻塞命令。',
  },
  {
    id: 'redis-01-datatypes-008',
    type: 'single',
    difficulty: 2,
    tags: ['过期时间'],
    stem: '想给 Hash 类型 `user:1001` 中的单个字段 `vip` 设置 7 天过期，正确的做法是？',
    options: [
      { key: 'A', text: '`HEXPIRE user:1001 vip 604800`（Redis 标准命令）' },
      { key: 'B', text: 'Redis 的过期只作用于整个 key；应把 vip 拆成独立的 String key 并对其 EXPIRE' },
      { key: 'C', text: '对整个 Hash 执行 EXPIRE，其余字段不受影响' },
      { key: 'D', text: '把 vip 的过期时间戳存进字段值，读时判断' },
    ],
    answers: ['B'],
    explanation:
      'Redis 过期粒度是 key 级，field 无法单独过期（HEXPIRE 并非通用可用命令）。B 的拆 key 是标准做法；C 会让整个对象 7 天后消失；D 是应用层兜底方案但读路径都要改，通常不如拆 key 干净。',
  },
]
