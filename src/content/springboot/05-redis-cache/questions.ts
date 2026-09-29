import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'springboot-05-redis-cache-001',
    type: 'single',
    difficulty: 1,
    tags: ['RedisTemplate'],
    stem: '使用默认 RedisTemplate 写入后，redis-cli 里看到 key 形如 "\\xac\\xed\\x00\\x05t\\x00\\x04user"。原因是？',
    options: [
      { key: 'A', text: 'Redis 存储出现损坏' },
      { key: 'B', text: '默认使用 JDK 序列化器，对象被序列化成二进制字节流，key 不可读且跨语言不兼容' },
      { key: 'C', text: 'Redis 版本与客户端不匹配' },
      { key: 'D', text: 'key 里有非法字符被转义' },
    ],
    answers: ['B'],
    explanation:
      '开头 "\\xac\\xed" 是 Java 序列化流的魔数。工程实践：key 用 StringRedisSerializer、value 用 JSON 序列化器（或直接用 StringRedisTemplate 手工 JSON），可读、可跨语言、便于运维排查。',
  },
  {
    id: 'springboot-05-redis-cache-002',
    type: 'single',
    difficulty: 2,
    tags: ['Spring Cache'],
    stem: '@Cacheable 的标准行为是？',
    options: [
      { key: 'A', text: '每次都执行方法，执行完把结果写入缓存' },
      { key: 'B', text: '先按 key 查缓存，命中则不执行方法直接返回；未命中执行方法并把结果回填缓存' },
      { key: 'C', text: '删除缓存并执行方法' },
      { key: 'D', text: '只对写方法生效' },
    ],
    answers: ['B'],
    explanation:
      '"先查后执行再回填"是 @Cacheable 语义；A 是 @CachePut；C 是 @CacheEvict；D 与读写无关。',
  },
  {
    id: 'springboot-05-redis-cache-003',
    type: 'scenario',
    difficulty: 3,
    tags: ['Spring Cache', 'AOP'],
    scenario:
      '同一个 Service 里有两个方法：`updateUser()` 更新后调用 `this.getUser(id)`（标注 @Cacheable）刷新缓存，但缓存里始终是旧值；把调用方移到另一个 Service 注入调用后就正常了。',
    stem: '原因与结论是？',
    options: [
      { key: 'A', text: '@Cacheable 有延迟，等待后即生效' },
      { key: 'B', text: 'Spring Cache 基于 AOP 代理：this 自调用不经过代理对象，注解被跳过；结论是缓存注解必须通过代理调用（跨 Bean 注入或 AopContext）才生效' },
      { key: 'C', text: 'getUser 方法的 SpEL key 写错了' },
      { key: 'D', text: 'Redis 连接池抖动导致写失败' },
    ],
    answers: ['B'],
    explanation:
      '注解由代理拦截，this.xxx() 绕过代理是"注解静默失效"第一名；与 @Transactional 失效同源。A 不存在；C 与"跨 Bean 就正常"矛盾；D 是臆测。',
  },
  {
    id: 'springboot-05-redis-cache-004',
    type: 'single',
    difficulty: 2,
    tags: ['Spring Cache'],
    stem: '查询接口在"数据不存在"时返回 null，希望这个 null 也缓存一小段时间防止穿透。使用 Spring Cache 应该？',
    options: [
      { key: 'A', text: '什么都不用做，@Cacheable 默认会缓存 null' },
      { key: 'B', text: '默认 @Cacheable 会缓存 null 返回值，无需配置' },
      { key: 'C', text: '开启缓存管理器的 cache-null-values（或用 unless 精确控制），并配置较短 TTL' },
      { key: 'D', text: 'Spring Cache 无法缓存 null，只能放弃' },
    ],
    answers: ['C'],
    explanation:
      'Spring Cache 支持 null 缓存，但需要在 RedisCacheConfiguration 里显式允许（disableCachingNullValues 默认拒绝 null 写入，会抛异常），并配合短 TTL；也可用 unless 自定义。A/B 与默认配置相反；D 错误。',
  },
  {
    id: 'springboot-05-redis-cache-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['缓存设计'],
    stem: '关于缓存 key 的设计，下列实践合理的有？',
    options: [
      { key: 'A', text: '带业务前缀与分隔符，如 "user:info:1001"，避免冲突便于扫描' },
      { key: 'B', text: '统一设置 TTL（含随机抖动），避免永不过期堆积' },
      { key: 'C', text: 'key 里拼上所有可能的查询参数，越多越好' },
      { key: 'D', text: '禁止使用 KEYS 命令按前缀清理，用 SCAN 或维护索引集合' },
    ],
    answers: ['A', 'B', 'D'],
    explanation:
      'C 错误——把大量低基数控件拼进 key 会造成组合爆炸与命中率暴跌，key 设计要"恰好区分数据版本"。A/B/D 均为标准实践。',
  },
  {
    id: 'springboot-05-redis-cache-006',
    type: 'single',
    difficulty: 3,
    tags: ['缓存失效'],
    stem: '订单更新后需要失效"订单详情"与"用户订单列表"两类缓存。用 Spring Cache 实现最合理的方式是？',
    options: [
      { key: 'A', text: '在更新方法上叠加多个 @CacheEvict（或 @Caching 组合），分别对两类缓存做精确失效' },
      { key: 'B', text: '全部用 @CacheEvict(value="order", allEntries=true) 清空整个 order 缓存最保险' },
      { key: 'C', text: '更新后 sleep 1 秒等缓存自然过期' },
      { key: 'D', text: '在 Controller 里手动删两个 key' },
    ],
    answers: ['A'],
    explanation:
      '@Caching/@CacheEvict 支持多缓存精确失效，语义清晰；B 的 allEntries 是"误伤式清空"，缓存量大时引发回源风暴；C 荒谬；D 把缓存职责错放进 Controller，且绕过了 Service 事务边界。',
  },
  {
    id: 'springboot-05-redis-cache-007',
    type: 'single',
    difficulty: 3,
    tags: ['StringRedisTemplate'],
    stem: '团队约定"简单场景直接用 StringRedisTemplate + 手工 JSON"，主要理由是？',
    options: [
      { key: 'A', text: 'StringRedisTemplate 性能比 RedisTemplate 高一个数量级' },
      { key: 'B', text: '两端都是 String 序列化，存取内容透明可读，规避对象序列化器的类型与兼容坑；配合显式 JSON 库控制字段行为' },
      { key: 'C', text: 'StringRedisTemplate 支持集群模式而 RedisTemplate 不支持' },
      { key: 'D', text: 'Spring 官方已废弃 RedisTemplate' },
    ],
    answers: ['B'],
    explanation:
      '优势在"可控与可读"，不在性能数量级（A 夸大）；两者都支持集群（C 错）；D 不实。手工 JSON 让反序列化目标类型显式化，避免 JDK/泛型序列化的隐形坑。',
  },
]
