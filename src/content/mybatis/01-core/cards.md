## MyBatis 的核心组件与一次查询的链路

### 是什么
MyBatis 是半自动 ORM：SQL 由开发者写在 XML 或注解里，框架负责参数映射、执行与结果映射。核心对象是 `SqlSessionFactory`（应用级单例，读配置构建）、`SqlSession`（一次会话，非线程安全）、`Executor`（真正执行 SQL 并管缓存）、`MappedStatement`（一条 SQL 的完整配置）。

### 怎么用
启动期解析 `mybatis-config.xml` 与 Mapper XML，把每条 SQL 注册成 MappedStatement；运行期 `session.getMapper(UserMapper.class)` 拿到 JDK 动态代理对象，调用方法时由 `MapperProxy` 按「接口全限定名 + 方法名」找到 MappedStatement，交给 Executor 执行。

### 常见坑
- `SqlSession` 不能存成单例字段：多线程复用会串数据、报 `Executor was closed`。
- Mapper 接口方法名必须与 XML 的 `id` 一致，命名空间必须是接口全限定名，否则报 `Invalid bound statement`。
- 一级缓存默认开启且是 SqlSession 级别，同一会话里改了数据再查可能读到旧值。

### 面试怎么问
「MyBatis 里 Mapper 接口没有实现类，为什么能调用？」答 JDK 动态代理 + MapperProxy + MappedStatement 定位，顺带说出 SqlSession 生命周期。

## 参数占位符与 SqlSession 生命周期

### 是什么
`#{id}` 会编译成 JDBC 的 `?` 占位符，由 PreparedStatement 绑定参数；`${id}` 是纯字符串替换，直接拼进 SQL 文本。

### 怎么用
写条件值一律用 `#{}`；只有动态表名、动态排序列这类「SQL 结构本身要变」的场景才用 `${}`，且必须白名单校验。Spring 整合后由 `SqlSessionTemplate` 管理会话，业务代码只注入 Mapper 接口。

### 常见坑
- `${name}` 拼用户输入 = SQL 注入，是安全审计高频问题。
- 忘记关闭 SqlSession 会耗尽连接池；用 try-with-resources 或交给 Spring 管理。
- `openSession()` 默认不自动提交，写操作需要 `commit()` 或交给 Spring 事务。

### 面试怎么问
「#{} 和 ${} 的区别？」答预编译占位符与字符串拼接、注入风险，再补动态表名的例外与白名单约束。

## 动手清单
1. 手写一个 Mapper 接口 + XML，故意把 namespace 写错，观察 `Invalid bound statement` 报错信息，再改回。
2. 分别用 `#{}` 与 `${}` 查同一条记录，打开 SQL 日志对比发出的语句；自测标准：能说清哪种写法带 `?`。
