import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'springboot-06-engineering-001',
    type: 'single',
    difficulty: 2,
    tags: ['日志'],
    stem: '写业务日志时，推荐 `log.info("order={}, user={}", orderId, userId)` 而不是字符串拼接，主要原因是？',
    options: [
      { key: 'A', text: '占位符写法更美观' },
      { key: 'B', text: '日志级别未开启时不会执行字符串拼接，避免无谓开销；且便于结构化与排查' },
      { key: 'C', text: '拼接写法在编译期报错' },
      { key: 'D', text: '占位符可以自动脱敏' },
    ],
    answers: ['B'],
    explanation:
      'SLF4J 占位符是惰性求值：日志级别关闭时参数不拼接、不调用 toString；高吞吐接口上这是实打实的性能差异。A 是次要感受；C 不成立；D 需要额外脱敏组件。',
  },
  {
    id: 'springboot-06-engineering-002',
    type: 'single',
    difficulty: 2,
    tags: ['MDC'],
    stem: '微服务里排查一次请求的完整链路日志，标准做法是？',
    options: [
      { key: 'A', text: '每条日志末尾手工补上用户名' },
      { key: 'B', text: '入口 Filter/拦截器生成或接收 traceId 放入 MDC，日志 pattern 输出 %X{traceId}，跨服务通过 header 透传' },
      { key: 'C', text: '靠时间戳对齐各服务日志' },
      { key: 'D', text: '开启 debug 级别全量输出，人工翻找' },
    ],
    answers: ['B'],
    explanation:
      'MDC（Mapped Diagnostic Context）是日志框架的线程级上下文，配合日志模板输出 traceId，一次请求所有日志可一键串联；跨服务再透传。A 信息不可靠；C 并发下时间戳完全对不上；D 成本与噪声双高。',
  },
  {
    id: 'springboot-06-engineering-003',
    type: 'single',
    difficulty: 2,
    tags: ['Actuator'],
    stem: '生产环境暴露 Actuator 端点，正确的姿势是？',
    options: [
      { key: 'A', text: 'management.endpoints.web.exposure.include 配置为 "*"，方便排查' },
      { key: 'B', text: '按需暴露（health、info、metrics 等必要项），结合 Spring Security/网关做访问控制，禁止匿名访问敏感端点' },
      { key: 'C', text: 'Actuator 是开发工具，生产必须完全禁用' },
      { key: 'D', text: 'Actuator 会自动鉴权，无需额外配置' },
    ],
    answers: ['B'],
    explanation:
      '/env、/heapdump 等端点可能泄露配置与内存信息，历史上多起安全事件源于全量暴露无鉴权；按需 + 鉴权是标准姿势。A 是反面教材；C 一刀切丢掉健康检查；D 不存在自动鉴权。',
  },
  {
    id: 'springboot-06-engineering-004',
    type: 'scenario',
    difficulty: 3,
    tags: ['定时任务', '幂等'],
    scenario:
      '订单系统 3 个实例部署，每实例都有 @Scheduled(cron = "0 0 2 * * ?") 的对账任务。上线后财务反馈：每月对账单金额恰好是正确值的两倍。',
    stem: '根因与解决方案组合是？',
    options: [
      { key: 'A', text: 'cron 表达式写错，把每天执行写成了每月执行' },
      { key: 'B', text: '多实例各自执行了一遍定时任务（重复处理且可能重复入账）；用分布式锁选主执行、任务幂等设计，或迁移到 XXL-Job 等调度中心' },
      { key: 'C', text: '数据库主从延迟导致重复统计' },
      { key: 'D', text: '把任务放到其中一个实例的代码里注释掉其他两份即可' },
    ],
    answers: ['B'],
    explanation:
      '@Scheduled 是实例内机制，多副本会各自触发；"结果翻倍"正是执行了两次。正确做法：分布式锁/调度中心保证单执行者 + 幂等兜底。A 与金额翻倍无关；C 不产生重复执行；D 靠人肉运维，发版即坏。',
  },
  {
    id: 'springboot-06-engineering-005',
    type: 'single',
    difficulty: 2,
    tags: ['测试'],
    stem: '关于 Spring Boot 单元测试，下列实践合理的是？',
    options: [
      { key: 'A', text: '所有测试都用 @SpringBootTest 启动完整上下文，够真实' },
      { key: 'B', text: '纯逻辑单测用 Mockito 隔离依赖（@MockBean/@Mock），接口测试用 MockMvc；确需真实中间件时用 Testcontainers，避免依赖共享测试库' },
      { key: 'C', text: '单测应该连接开发环境数据库，测完手动清理' },
      { key: 'D', text: '测试类里 System.out 打印结果人工核对即可' },
    ],
    answers: ['B'],
    explanation:
      '@SpringBootTest 每类启动/复用完整上下文，跑得慢且常常不必要——按需选择测试策略才可持续。A 拖慢 CI；C 依赖外部状态、结果不可重复；D 不是自动化断言。',
  },
  {
    id: 'springboot-06-engineering-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['打包部署'],
    stem: '关于 Spring Boot 应用的打包与部署，正确的说法有？',
    options: [
      { key: 'A', text: 'mvn package 产出可执行 fat jar，内嵌 Tomcat，java -jar 直接运行' },
      { key: 'B', text: 'Dockerfile 可利用分层 jar（layertools）把依赖层与代码层分开，加快镜像构建与推送' },
      { key: 'C', text: 'JVM 参数（如 -Xmx）通过 JAVA_OPTS/启动命令传入，而不是写死在 yml' },
      { key: 'D', text: 'fat jar 可以用任意解压工具解开后再以 java -cp 运行，效果完全一样' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A/B/C 均为标准实践。D 不可靠——嵌套 jar 结构不是普通 classpath，直接 java -cp 会找不到类，必须用 JarLauncher（java -jar 或 org.springframework.boot.loader 启动器）。',
  },
  {
    id: 'springboot-06-engineering-007',
    type: 'single',
    difficulty: 3,
    tags: ['启动失败'],
    stem: '应用启动失败，日志末尾是 "APPLICATION FAILED TO START — Parameter 0 of constructor in UserService required a bean of type UserDao that could not be found"。最直接的排查方向是？',
    options: [
      { key: 'A', text: '数据库连不上' },
      { key: 'B', text: 'UserDao 没有被注册为 Bean：缺注解、不在扫描包内，或对应 starter/MapperScan 未配置' },
      { key: 'C', text: '端口被占用' },
      { key: 'D', text: 'JDK 版本过高' },
    ],
    answers: ['B'],
    explanation:
      '"required a bean that could not be found"指依赖注入找不到候选 Bean——三类原因：没加注解、不在 @ComponentScan/MapperScan 范围、依赖缺失导致自动配置未装配。A/C/D 的失败形态与该报错不同。',
  },
  {
    id: 'springboot-06-engineering-008',
    type: 'single',
    difficulty: 3,
    tags: ['@Scheduled'],
    stem: '@Scheduled 的默认调度线程池大小是 1，由此带来的典型问题是？',
    options: [
      { key: 'A', text: '任务无法执行' },
      { key: 'B', text: '一个耗时长或阻塞的任务会占住唯一线程，导致其他定时任务整体延迟错过计划时间' },
      { key: 'C', text: '任务会并发执行导致数据错乱' },
      { key: 'D', text: 'cron 表达式不再生效' },
    ],
    answers: ['B'],
    explanation:
      '默认单线程调度器串行执行所有任务，慢任务是"整点任务没跑"的经典原因；解法：配置 TaskScheduler 线程池、拆分慢任务、或改用调度平台。C 恰恰相反，单线程不会并发；A/D 不成立。',
  },
]
