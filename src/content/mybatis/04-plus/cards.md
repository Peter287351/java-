## MyBatis-Plus 的常用增强

### 是什么
MyBatis-Plus 是 MyBatis 的增强工具，不改原生能力：`BaseMapper<T>` 提供单表 CRUD，`LambdaQueryWrapper` 用方法引用写条件，`IService` 提供批量与链式操作，另有分页、逻辑删除、自动填充、乐观锁、代码生成。

### 怎么用
实体用 `@TableName` / `@TableId` / `@TableField` 标注；条件用 `lambdaQuery().eq(User::getStatus, 1).list()`；逻辑删除加 `@TableLogic`；创建时间用 `MetaObjectHandler` 统一填充。

### 常见坑
- `LambdaQueryWrapper` 靠方法引用取列名，字段名写错在编译期就暴露，比字符串列名安全。
- 逻辑删除后所有查询自动追加 `deleted = 0`，但自定义 XML 的 SQL 不会自动追加，容易把已删数据查出来。
- 逻辑删除与数据库唯一索引冲突：删除后同名记录再插入会撞唯一键，通常改用「删除标记 + 时间戳」组合或物理归档。

### 面试怎么问
「MP 相比原生 MyBatis 多了什么、有什么代价？」答单表 CRUD 与条件构造器的效率提升，以及复杂联表仍要写 XML、逻辑删除的坑。

## Spring Boot 整合与事务

### 是什么
引入 `mybatis-plus-boot-starter` 后，Spring Boot 自动配置 DataSource、SqlSessionFactory、SqlSessionTemplate；`@MapperScan` 扫描接口，事务由 `@Transactional` 统一管理。

### 怎么用
多数据源要为每个数据源单独配置 SqlSessionFactory 与事务管理器，并明确包扫描边界，别让两个工厂抢同一批 Mapper。开发期开 SQL 日志，上线前关掉或降级。

### 常见坑
- 忘加 `@MapperScan` 或包路径写错，启动报找不到 Mapper Bean。
- 同类内部方法调用 `@Transactional` 不经过代理，事务不生效。
- 只读查询别一律加事务；长事务会占着连接并放大锁竞争。

### 面试怎么问
「MyBatis 的事务到底谁管？」答单独使用由 SqlSession 手动 commit，整合 Spring 后交给 `@Transactional` 与 SqlSessionTemplate。

## 动手清单
1. 用 LambdaQueryWrapper 写一个两条件查询，打开 SQL 日志核对生成的 WHERE；把条件换成字符串列名版本对比可读性。
2. 给实体加 @TableLogic 后分别用 BaseMapper 和自定义 XML 查询，观察哪条 SQL 自动带了删除标记。
