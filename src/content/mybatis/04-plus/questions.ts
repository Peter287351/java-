import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'mybatis-04-plus-001',
    type: 'single',
    difficulty: 1,
    tags: ['MyBatis-Plus'],
    stem: `MyBatis-Plus 的 BaseMapper 主要提供什么能力？`,
    options: [
      { key: 'A', text: '自动生成前端页面' },
      { key: 'B', text: '内置单表 CRUD 方法，无需写 XML' },
      { key: 'C', text: '替代数据库连接池' },
      { key: 'D', text: '把 SQL 自动转成 NoSQL 查询' },
    ],
    answers: ['B'],
    explanation: `继承 BaseMapper 后即得 insert/selectById/updateById/deleteById 等单表方法，复杂联表仍需自写 XML。A、C、D 都不是持久层框架的职责。`,
  },
  {
    id: 'mybatis-04-plus-002',
    type: 'single',
    difficulty: 1,
    tags: ['逻辑删除'],
    stem: `@TableLogic 注解的作用是？`,
    options: [
      { key: 'A', text: '让 delete 变成 UPDATE 设置删除标记，查询自动过滤已删数据' },
      { key: 'B', text: '把删除操作同步到从库' },
      { key: 'C', text: '删除时自动备份到另一张表' },
      { key: 'D', text: '禁止该表执行任何删除' },
    ],
    answers: ['A'],
    explanation: `逻辑删除把 DELETE 改写为更新 deleted 字段，MP 的查询会自动追加 deleted = 0。B、C 不是它的行为，D 把「改写」误当成「禁止」。`,
  },
  {
    id: 'mybatis-04-plus-003',
    type: 'single',
    difficulty: 2,
    tags: ['分页'],
    stem: `MyBatis-Plus 里让 Page 参数真正生效的前提是？`,
    options: [
      { key: 'A', text: 'Page 对象必须是 static 字段' },
      { key: 'B', text: '注册 MybatisPlusInterceptor 并添加 PaginationInnerInterceptor' },
      { key: 'C', text: '数据库必须关闭索引' },
      { key: 'D', text: '所有查询都必须写在 XML 里' },
    ],
    answers: ['B'],
    explanation: `分页是拦截器改写 SQL 实现的，必须先注册分页内部拦截器，否则 selectPage 退化成全表查询。A、C、D 都与分页机制无关。`,
  },
  {
    id: 'mybatis-04-plus-004',
    type: 'single',
    difficulty: 2,
    tags: ['条件构造器'],
    stem: `相比字符串列名，LambdaQueryWrapper 的主要优势是？`,
    options: [
      { key: 'A', text: '执行速度一定更快' },
      { key: 'B', text: '字段引用由方法引用提供，改名或拼错在编译期暴露' },
      { key: 'C', text: '可以绕过数据库权限校验' },
      { key: 'D', text: '自动生成索引' },
    ],
    answers: ['B'],
    explanation: `User::getName 这类方法引用让列名与实体属性绑定，重构字段名时编译器会报错；而 "name" 字符串拼错只能到运行时才发现。A、C、D 都不是它的能力。`,
  },
  {
    id: 'mybatis-04-plus-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['整合'],
    stem: `Spring Boot 整合 MyBatis-Plus 时，下列说法正确的有哪些？`,
    options: [
      { key: 'A', text: '@MapperScan 用于指定 Mapper 接口的扫描包' },
      { key: 'B', text: '@Transactional 由 Spring 管理会话与提交回滚' },
      { key: 'C', text: '多数据源需要为不同数据源配置各自的 SqlSessionFactory' },
      { key: 'D', text: '自定义 XML 里的 SQL 也会自动追加逻辑删除条件' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 是标准整合方式。D 错：逻辑删除条件由 MP 的 SQL 注入器在自动生成的语句上追加，手写 XML 的 SQL 不会自动改写，需要自己加条件。`,
  },
  {
    id: 'mybatis-04-plus-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['逻辑删除'],
    scenario: `用户表对 phone 建了唯一索引并启用逻辑删除。用户注销后，用同一手机号重新注册时插入报唯一键冲突。`,
    stem: `最贴近根因的分析是？`,
    options: [
      { key: 'A', text: '逻辑删除后旧行仍在表里且 phone 值不变，唯一索引仍认为重复' },
      { key: 'B', text: 'MyBatis-Plus 不支持唯一索引' },
      { key: 'C', text: '注册接口的 @Transactional 没生效' },
      { key: 'D', text: '数据库不支持 UPDATE 语句' },
    ],
    answers: ['A'],
    explanation: `逻辑删除只是打标记，行并没有消失，唯一索引照样约束。常见解法是把唯一键改成业务键 + 删除标记的组合、删除时把手机号改成带后缀的归档值，或改用物理删除。B、C、D 都与现象无关。`,
  },
  {
    id: 'mybatis-04-plus-007',
    type: 'code',
    difficulty: 3,
    tags: ['条件构造器'],
    stem: `读下面的查询，status 为 1 且 name 传了「张三」时，生成的 WHERE 形式是？

~~~java
lambdaQuery()
  .eq(User::getStatus, status)
  .like(name != null, User::getName, name)
  .list();
~~~`,
    options: [
      { key: 'A', text: 'WHERE status = ? AND name LIKE ?' },
      { key: 'B', text: 'WHERE status = ? 恒不带 name 条件' },
      { key: 'C', text: 'WHERE name LIKE ? 恒不带 status 条件' },
      { key: 'D', text: '不带 WHERE 的全表查询' },
    ],
    answers: ['A'],
    explanation: `eq 无条件追加 status，like 的第一个参数是布尔条件开关，name 非空时该片段生效，于是两个条件用 AND 连接且都用 ? 占位符。B 忽略了生效的 like，C 丢了 eq，D 忽略了全部条件。`,
  },
]
