import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'mybatis-03-cache-plugin-001',
    type: 'single',
    difficulty: 1,
    tags: ['一级缓存'],
    stem: `MyBatis 一级缓存的默认作用域是？`,
    options: [
      { key: 'A', text: '整个应用全局共享' },
      { key: 'B', text: '单个 SqlSession 会话内' },
      { key: 'C', text: '单个 Mapper namespace 内，跨会话共享' },
      { key: 'D', text: '数据库服务器端' },
    ],
    answers: ['B'],
    explanation: `一级缓存挂在 Executor 上，随 SqlSession 创建与销毁，默认开启且不能全局关闭（可配置 statement 级）。C 描述的是二级缓存，A、D 都不符合实现。`,
  },
  {
    id: 'mybatis-03-cache-plugin-002',
    type: 'single',
    difficulty: 1,
    tags: ['二级缓存'],
    stem: `关于二级缓存，下列说法正确的是？`,
    options: [
      { key: 'A', text: '默认开启，无需任何配置' },
      { key: 'B', text: '作用域是 SqlSession，会话关闭即失效' },
      { key: 'C', text: '作用域是 Mapper namespace，需在映射文件里显式开启' },
      { key: 'D', text: '只能缓存字符串，不能缓存实体对象' },
    ],
    answers: ['C'],
    explanation: `二级缓存以 namespace 为单位，默认关闭，需要 <cache/> 或注解开启，且实体要实现 Serializable。A 与 B 混淆了默认行为和作用域，D 与缓存对象类型无关。`,
  },
  {
    id: 'mybatis-03-cache-plugin-003',
    type: 'single',
    difficulty: 2,
    tags: ['缓存失效'],
    stem: `同一 SqlSession 内先执行 update，再用相同参数执行同一条 select，通常会？`,
    options: [
      { key: 'A', text: '直接返回 update 之前的一级缓存结果' },
      { key: 'B', text: '清空一级缓存并重新查库' },
      { key: 'C', text: '抛出缓存冲突异常' },
      { key: 'D', text: '自动把 update 也缓存起来' },
    ],
    answers: ['B'],
    explanation: `写操作会 flushCache，清空该会话的一级缓存，保证后续查询不读脏数据。A 是脏读，C 不会抛异常，D 把写操作当缓存对象没有意义。`,
  },
  {
    id: 'mybatis-03-cache-plugin-004',
    type: 'single',
    difficulty: 2,
    tags: ['插件'],
    stem: `MyBatis 插件的底层实现机制是？`,
    options: [
      { key: 'A', text: '编译期字节码插桩' },
      { key: 'B', text: 'JDBC 驱动回调' },
      { key: 'C', text: '基于 JDK 动态代理的 Interceptor 责任链' },
      { key: 'D', text: '数据库触发器' },
    ],
    answers: ['C'],
    explanation: `插件用 Plugin.wrap 生成代理对象，多个插件按顺序形成责任链，拦截四大对象的方法调用。A、B、D 都不是 MyBatis 的扩展机制。`,
  },
  {
    id: 'mybatis-03-cache-plugin-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['插件'],
    stem: `MyBatis 插件可以拦截哪些对象？`,
    options: [
      { key: 'A', text: 'Executor' },
      { key: 'B', text: 'StatementHandler' },
      { key: 'C', text: 'ResultSetHandler' },
      { key: 'D', text: 'Spring 的 DispatcherServlet' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `官方文档明确可拦截 Executor、ParameterHandler、StatementHandler、ResultSetHandler 四类。D 是 Spring MVC 组件，不在 MyBatis 生命周期里。`,
  },
  {
    id: 'mybatis-03-cache-plugin-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['分页插件'],
    scenario: `Spring Boot + MyBatis-Plus 项目里调用 selectPage(new Page<>(1, 10), wrapper)，日志只有一条不带 LIMIT 的 SELECT，total 也不对。`,
    stem: `最可能的原因和修复是？`,
    options: [
      { key: 'A', text: '数据库不支持分页，改成内存分页' },
      { key: 'B', text: '没注册 MybatisPlusInterceptor 与 PaginationInnerInterceptor，补上分页拦截器' },
      { key: 'C', text: 'Page 对象必须序列化后才能生效' },
      { key: 'D', text: '把 wrapper 换成 XML 才能分页' },
    ],
    answers: ['B'],
    explanation: `MP 的分页由拦截器改写 SQL 并额外执行 count，没注册就退化成全量查询。A 不是数据库能力问题，C 与序列化无关，D 与 SQL 书写位置无关。`,
  },
  {
    id: 'mybatis-03-cache-plugin-007',
    type: 'code',
    difficulty: 3,
    tags: ['一级缓存'],
    stem: `下面代码在同一个 SqlSession 内执行，关于两次查询哪个说法正确？

~~~java
User a = mapper.selectById(1);
User b = mapper.selectById(1);
System.out.println(a == b);
~~~`,
    options: [
      { key: 'A', text: '一定输出 false，每次都新建对象' },
      { key: 'B', text: '通常输出 true，第二次命中一级缓存返回同一对象引用' },
      { key: 'C', text: '编译不通过，User 不能用 == 比较' },
      { key: 'D', text: '一定抛空指针异常' },
    ],
    answers: ['B'],
    explanation: `同会话、同 SQL、同参数且中间无写操作时，一级缓存直接返回缓存中的同一对象引用，因此 == 为 true。若中间执行了 update 或配置了 flushCache，则选 A 的情形才成立。`,
  },
]
