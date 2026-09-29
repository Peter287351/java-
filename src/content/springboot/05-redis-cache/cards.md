## 整合 Redis 与 Spring Cache

### 是什么
- `RedisTemplate<String,Object>` 默认 JDK 序列化（key 出现乱码前缀），工程标配：key 用 String 序列化、value 用 JSON（`GenericJackson2JsonRedisSerializer`）。
- `StringRedisTemplate`：两端都是 String，手工控制 JSON，最不易踩坑。
- Spring Cache：`@Cacheable`（先查缓存，未命中执行方法并回填）、`@CachePut`、`@CacheEvict`；底层交给 RedisCacheManager。

### 为什么
注解缓存把"查缓存→查库→回填"模板化；但原理是 **AOP 代理**——同类自调用、private 方法、内部 new 的对象都不会走代理，注解静默失效。

### 怎么用
```java
@Cacheable(value = "user", key = "'u:' + #id", unless = "#result == null")
public User getUser(Long id) { return userMapper.selectById(id); }
```
null 值策略：`@Cacheable` 默认不缓存 null，需 `unless`/`condition` 控制，或开启 cache-null-values 防穿透。

### 常见坑
- key 一定带业务前缀并约定分隔符，避免与其他模块冲突。
- 注解缓存的 TTL、前缀在 RedisCacheConfiguration 里全局定制。
- 注解适合简单读写；复杂失效链路（多表联动）手写更可控。

### 面试怎么问
「@Cacheable 为什么不生效？」四连：自调用、非 public、未开启缓存、Bean 非代理——能答全说明真用过。

## 动手清单

1. 配置 RedisTemplate 的 JSON 序列化器，redis-cli 里观察 key/value 与乱码版的差异。自测标准：能说清两种序列化器各自的后果。
2. 写 @Cacheable/@CacheEvict 的用户查询与更新，再用日志验证"同类自调用不生效"。自测标准：能把失效原因与 AOP 代理机制对应。
