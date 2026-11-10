## 一级缓存与二级缓存

### 是什么
一级缓存是 SqlSession 级别，默认开启，同一会话内相同的 SQL 与参数会直接复用结果；二级缓存是 Mapper namespace 级别，跨 SqlSession 共享，需要在 XML 里加 `<cache/>` 且实体可序列化。

### 怎么用
读多写少的字典表可以开二级缓存；写频繁的表不要开。任何 insert/update/delete 都会清空同作用域的缓存，避免脏读。

### 常见坑
- 同一会话里改了数据再查，一级缓存可能返回旧值；必要时 `clearCache()` 或配置 `flushCache`。
- 二级缓存是 namespace 级，跨表关联查询容易与别的 namespace 的缓存不一致，分布式部署下本地缓存还会各节点不同步。
- Spring 整合后每次调用可能是新会话，一级缓存常常「看起来没生效」。

### 面试怎么问
「一级缓存和二级缓存的作用域？」答 SqlSession 与 namespace，并补写操作清缓存、分布式下建议用 Redis 集中缓存。

## 插件、分页与延迟加载

### 是什么
MyBatis 插件基于 `Interceptor` + JDK 动态代理，可拦截 Executor、StatementHandler、ParameterHandler、ResultSetHandler 四类对象。分页插件就是在 SQL 执行前改写语句并附加 count 查询。

### 怎么用
Spring Boot 里注册 `MybatisPlusInterceptor` 并添加 `PaginationInnerInterceptor(DbType.MYSQL)`，Page 参数才会物理分页。延迟加载用 `lazyLoadingEnabled` 配合 association/collection 的 select。

### 常见坑
- 没注册分页拦截器时 `selectPage` 会退化成查全部，只在内存里截一段，结果和性能都错。
- 多个插件形成责任链，顺序写错会互相覆盖改写结果。
- 延迟加载遇到会话已关闭会抛异常，别在事务外返回懒加载对象给序列化层。

### 面试怎么问
「分页插件的原理？」答拦截器改写 SQL、先 count 再 limit，并说明没配插件时的症状。

## 动手清单
1. 同一 SqlSession 连查两次同一条记录，打开 SQL 日志确认第二次没发语句；再执行一次 update 观察缓存被清空。
2. 在 Spring Boot 项目里去掉分页拦截器跑一次 selectPage，对比返回的 total；自测标准：能解释为什么 total 不对。
