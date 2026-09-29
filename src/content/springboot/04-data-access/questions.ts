import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'springboot-04-data-access-001',
    type: 'single',
    difficulty: 2,
    tags: ['MyBatis-Plus'],
    stem: 'Spring Boot 整合 MyBatis-Plus 后，调 selectPage 返回了"全部数据"而不是分页结果。最可能的原因是？',
    options: [
      { key: 'A', text: '数据库版本太低' },
      { key: 'B', text: '没有配置分页拦截器（MybatisPlusInterceptor + PaginationInnerInterceptor），Page 参数不生效' },
      { key: 'C', text: 'Page 构造参数写反了' },
      { key: 'D', text: 'MyBatis-Plus 不支持分页' },
    ],
    answers: ['B'],
    explanation:
      'MP 的分页靠拦截器改写 SQL（先 count 再加 LIMIT），未注册拦截器时插件整体失效、退化为普通查询。C 参数写反只影响页码含义；D 明显错误。',
  },
  {
    id: 'springboot-04-data-access-002',
    type: 'single',
    difficulty: 2,
    tags: ['LambdaQueryWrapper'],
    stem: '使用 LambdaQueryWrapper 的最主要好处是？',
    options: [
      { key: 'A', text: '生成的 SQL 更短' },
      { key: 'B', text: '方法引用（User::getName）在编译期检查字段，重构改名时编译报错而非运行期才炸' },
      { key: 'C', text: '支持跨数据库方言' },
      { key: 'D', text: '可以替代所有 XML 复杂 SQL' },
    ],
    answers: ['B'],
    explanation:
      '字符串列名（QueryWrapper）拼写错误只能运行期发现；Lambda 引用把字段绑定到编译期。C 是 MP 全局的事，与 Lambda 无关；D 复杂联表 SQL 仍应走 XML。',
  },
  {
    id: 'springboot-04-data-access-003',
    type: 'single',
    difficulty: 2,
    tags: ['HikariCP'],
    stem: '关于 HikariCP 的 maximum-pool-size，下列理解正确的是？',
    options: [
      { key: 'A', text: '连接池越大越好，200 个连接能扛更高并发' },
      { key: 'B', text: '过大反而增加上下文切换与数据库连接压力，常见有效配置在 10~20 起步，按 CPU/磁盘与压测调整' },
      { key: 'C', text: '它表示数据库最大连接数，与 Druid 的 maxActive 无关' },
      { key: 'D', text: 'Spring Boot 默认没有连接池' },
    ],
    answers: ['B'],
    explanation:
      '连接数超过数据库处理能力后只会互相排队，HikariCP 官方建议小池子 + 快进快出；公式性起点是 CPU 核数*2 + 有效磁盘数。A 是高频误区；C 概念混淆；D Spring Boot 2 起默认 HikariCP。',
  },
  {
    id: 'springboot-04-data-access-004',
    type: 'scenario',
    difficulty: 3,
    tags: ['连接池', '大事务'],
    scenario:
      '上线后偶发 "HikariPool-1 - Connection is not available, request timed out after 30000ms"。代码审查发现某 Service 方法在 for 循环里调用外部 HTTP 接口（平均耗时 800ms），方法上有 @Transactional。',
    stem: '根因与改进是？',
    options: [
      { key: 'A', text: '连接池太小，改成 500 就好了' },
      { key: 'B', text: '大事务在 HTTP 调用期间一直占着连接，并发一高池被占满；把远程调用移出事务（或先并行取数再短事务入库），必要时池稍加并设合理超时' },
      { key: 'C', text: '把 HikariCP 换成 Druid 就不会再超时' },
      { key: 'D', text: 'HTTP 调用与数据库连接无关，排查方向错了' },
    ],
    answers: ['B'],
    explanation:
      '@Transactional 从方法进入即绑定连接，慢 HTTP 让连接被长时间持有——这是"连接池超时"最常见的代码味。A 掩盖问题且加剧 DB 压力；C 换池不解决长事务；D 恰恰相反，事务内的连接与外部调用强相关。',
  },
  {
    id: 'springboot-04-data-access-005',
    type: 'single',
    difficulty: 2,
    tags: ['逻辑删除'],
    stem: 'MyBatis-Plus 配置 @TableLogic 逻辑删除后，下列说法正确的是？',
    options: [
      { key: 'A', text: 'removeById 会执行 UPDATE 将标记字段置为"已删除"，查询自动追加标记过滤' },
      { key: 'B', text: '数据被物理 DELETE，只是删前备份' },
      { key: 'C', text: '查询需要手动在 XML 里加 where deleted=0' },
      { key: 'D', text: '逻辑删除与唯一索引没有任何冲突' },
    ],
    answers: ['A'],
    explanation:
      '@TableLogic 的语义就是"删改写、查过滤"全自动。B 是物理删除；C 不需要手动；D 恰恰是常见坑——同一业务唯一键删除后重新创建会撞唯一索引，需用 deleted 存删除时间戳/id 类方案。',
  },
  {
    id: 'springboot-04-data-access-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['分层规范'],
    stem: '关于 Controller/Service/Mapper 分层职责，合理的说法有？',
    options: [
      { key: 'A', text: 'Controller 只做参数接收、校验与返回组装，不写业务' },
      { key: 'B', text: '业务逻辑与事务边界放在 Service 层' },
      { key: 'C', text: 'Mapper 层只负责数据访问，不掺业务判断' },
      { key: 'D', text: '为了省代码，Controller 直接注入 Mapper 操作数据库也可以接受' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'D 跳过 Service 会让事务边界、缓存、复用、审计全部失控，是反模式；A/B/C 是标准分层。',
  },
  {
    id: 'springboot-04-data-access-007',
    type: 'single',
    difficulty: 3,
    tags: ['多数据源'],
    stem: '需要同时访问业务库（MySQL）与报表库（另一个 MySQL 实例），下列方案最稳妥的是？',
    options: [
      { key: 'A', text: '一个 SqlSessionFactory 里配两个 url，MyBatis 会自动路由' },
      { key: 'B', text: '拆分两套 DataSource + 各自的 SqlSessionFactory/事务管理器，按包路径（或注解）绑定 Mapper 到对应数据源' },
      { key: 'C', text: '在同一个事务里交替写两个库，Spring 会自动保证分布式一致性' },
      { key: 'D', text: '把报表数据全部搬进业务库' },
    ],
    answers: ['B'],
    explanation:
      '多数据源的正确姿势是"多套配置 + 明确路由规则"，常用 dynamic-datasource 组件或按包分包绑定。A 不存在这种自动路由；C 是误区——Spring 事务管理器只能管一个数据源，跨库需要分布式事务方案（Seata/最终一致），不能想当然；D 与需求背道而驰。',
  },
]
