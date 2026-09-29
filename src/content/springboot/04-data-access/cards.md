## 数据访问：MyBatis-Plus 与连接池

### 是什么
MyBatis-Plus 在 MyBatis 之上增强：`BaseMapper<T>` 提供单表 CRUD、`LambdaQueryWrapper` 类型安全条件、分页插件（`PaginationInnerInterceptor`）物理分页、逻辑删除（`@TableLogic`）、自动填充（`MetaObjectHandler`）。

### 为什么
单表 CRUD 占业务代码大头，MP 消灭模板代码；分页插件把 `LIMIT` 拼接与 count 查询自动化——**没有插件时 Page 参数是摆设**（查全表）。

### 怎么用
```java
Page<User> page = userMapper.selectPage(
    new Page<>(2, 10),
    new LambdaQueryWrapper<User>()
        .eq(User::getStatus, 1)
        .like(StrUtil.isNotBlank(name), User::getName, name));
```
连接池默认 **HikariCP**：`maximum-pool-size` 不是越大越好（通常 10~20，公式 CPU 核数*2 + 磁盘数 起步），连接泄漏表现为"获取连接超时"。

### 常见坑
- 逻辑删除后唯一索引冲突：唯一列+deleted 列联合设计（deleted 存时间戳/id）。
- Service 层直接拿 Wrapper 写复杂 SQL 会失控——复杂查询仍走 XML/SQL 文件。

### 面试怎么问
「分页插件原理」——拦截器改写 SQL：先 count 再拼 LIMIT；能答出"没配置插件就不生效"是常见事故点。

## 动手清单

1. 配置分页插件 + 写一个两条件动态查询分页接口，日志观察生成的 count 与 LIMIT SQL。自测标准：能指出未配置插件时的现象。
2. 用 `show processlist` / HikariCP 监控观察连接数变化，故意 sleep 占住连接模拟泄漏。自测标准：能解释 maximum-pool-size 过大的反效果。
