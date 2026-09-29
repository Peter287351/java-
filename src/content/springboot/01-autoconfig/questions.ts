import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'springboot-01-autoconfig-001',
    type: 'single',
    difficulty: 1,
    tags: ['自动配置'],
    stem: '@SpringBootApplication 注解等价于以下哪三个注解的组合？',
    options: [
      { key: 'A', text: '@Configuration + @ComponentScan + @EnableAutoConfiguration' },
      { key: 'B', text: '@Service + @Autowired + @Component' },
      { key: 'C', text: '@Bean + @Qualifier + @Primary' },
      { key: 'D', text: '@Controller + @RequestMapping + @ResponseBody' },
    ],
    answers: ['A'],
    explanation:
      '启动类注解三件套：@Configuration 声明配置类、@ComponentScan 扫描组件、@EnableAutoConfiguration 开启自动配置。B/C/D 是业务开发常用注解，与启动类无关。',
  },
  {
    id: 'springboot-01-autoconfig-002',
    type: 'single',
    difficulty: 2,
    tags: ['SPI'],
    stem: 'Spring Boot 2.7+ 中，自动配置类的候选清单来自哪个文件？',
    options: [
      { key: 'A', text: 'META-INF/MANIFEST.MF' },
      { key: 'B', text: 'META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports' },
      { key: 'C', text: 'application.yml 的 autoconfigure 节点' },
      { key: 'D', text: 'pom.xml 的 dependencies 列表' },
    ],
    answers: ['B'],
    explanation:
      '2.7 起 SPI 登记文件迁移为 AutoConfiguration.imports（一行一个配置类）；2.7 前是 spring.factories 的 EnableAutoConfiguration 键。A 与自动配置无关；C/D 都不是机制的一部分。',
  },
  {
    id: 'springboot-01-autoconfig-003',
    type: 'single',
    difficulty: 2,
    tags: ['条件注解'],
    stem: '自动配置类里大量使用 @ConditionalOnMissingBean，其目的是？',
    options: [
      { key: 'A', text: '防止 Bean 重复创建报错' },
      { key: 'B', text: '当用户已经自定义了同类型 Bean 时，默认配置自动让位，保证用户配置优先' },
      { key: 'C', text: '强制用户必须手动创建 Bean' },
      { key: 'D', text: '让 Bean 在容器关闭时自动销毁' },
    ],
    answers: ['B'],
    explanation:
      '这是"约定可覆盖"的核心：默认实现只补位不抢位。A 只是表象；C 与语义相反；D 与生命周期销毁无关。',
  },
  {
    id: 'springboot-01-autoconfig-004',
    type: 'multiple',
    difficulty: 2,
    tags: ['条件注解'],
    stem: '下列条件注解与其含义的对应，正确的有？',
    options: [
      { key: 'A', text: '@ConditionalOnClass：类路径存在指定类时生效' },
      { key: 'B', text: '@ConditionalOnProperty：指定配置属性满足条件（如值/存在性）时生效' },
      { key: 'C', text: '@ConditionalOnWebApplication：当前是 Web 应用时生效' },
      { key: 'D', text: '@ConditionalOnJava：JVM 版本低于指定版本时生效' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      '@ConditionalOnJava 匹配的是"等于或高于"指定版本（如 JAVA_17 表示 17 及以上），D 说反了。A/B/C 均正确。',
  },
  {
    id: 'springboot-01-autoconfig-005',
    type: 'scenario',
    difficulty: 3,
    tags: ['starter', '条件注解'],
    scenario:
      '团队写了 starter 提供 DataSource 相关的默认 Bean。业务方反馈：自己在配置类里定义了同类型 Bean 后启动报错 "expected single matching bean but found 2"。检查发现 starter 的自动配置方法上只标了 @Bean，没加条件注解。',
    stem: '正确的修复是？',
    options: [
      { key: 'A', text: '让业务方删掉自己的 Bean，一律用 starter 默认的' },
      { key: 'B', text: '在 starter 的 @Bean 方法上加 @ConditionalOnMissingBean，用户有定义时默认实现不再注册' },
      { key: 'C', text: '在业务方的 Bean 上加 @Primary，让注入时优先即可，不必改 starter' },
      { key: 'D', text: '把 starter 从依赖里去掉' },
    ],
    answers: ['B'],
    explanation:
      'starter 的默认实现必须"可让位"：@ConditionalOnMissingBean 是标准约定。A 丧失了灵活性；C 用 @Primary 能让注入不报错，但两个 Bean 并存仍是隐患且违背 starter 设计惯例；D 因噎废食。',
  },
  {
    id: 'springboot-01-autoconfig-006',
    type: 'single',
    difficulty: 2,
    tags: ['组件扫描'],
    stem: '启动类放在 com.foo.app，服务类写在 com.bar.service（不同顶层包），@Autowired 注入失败。最可能的原因是？',
    options: [
      { key: 'A', text: '@ComponentScan 默认只扫描启动类所在包及其子包，com.bar 不在范围内' },
      { key: 'B', text: 'com.bar.service 缺少 @Service 注解' },
      { key: 'C', text: 'Spring 不支持跨包注入' },
      { key: 'D', text: '必须改成字段注入才能生效' },
    ],
    answers: ['A'],
    explanation:
      '默认扫描根包（启动类所在包）以下，跨顶层包扫不到就不会注册为 Bean，注入自然失败；解法：移动启动类到共同根包，或显式 scanBasePackages。B 无从判断且题目已说服务类存在；C 错误；D 与扫描范围无关。',
  },
  {
    id: 'springboot-01-autoconfig-007',
    type: 'single',
    difficulty: 3,
    tags: ['starter'],
    stem: '第三方团队要发布自己的 Spring Boot starter，按社区命名规范，groupId 下 artifactId 应该叫？',
    options: [
      { key: 'A', text: 'spring-boot-starter-aliyun-sms' },
      { key: 'B', text: 'aliyun-sms-spring-boot-starter' },
      { key: 'C', text: 'starter-aliyun-sms' },
      { key: 'D', text: 'aliyun-sms-starter' },
    ],
    answers: ['B'],
    explanation:
      '官方保留 spring-boot-starter-xxx 命名；第三方约定 xxx-spring-boot-starter，一眼区分来源。A 冒用官方命名空间；C/D 不符合约定。',
  },
  {
    id: 'springboot-01-autoconfig-008',
    type: 'single',
    difficulty: 3,
    tags: ['自动配置'],
    stem: '排查"某个自动配置为什么没生效"，官方提供的最直接手段是？',
    options: [
      { key: 'A', text: '阅读 AutoConfiguration.imports 后逐行打断点调试 Spring 源码' },
      { key: 'B', text: '开启 --debug 启动，查看 CONDITIONS EVALUATION REPORT 中该配置的匹配/排除报告' },
      { key: 'C', text: '把 logback 日志级别调到 ERROR' },
      { key: 'D', text: '删掉 application.yml 重新启动' },
    ],
    answers: ['B'],
    explanation:
      '条件评估报告逐条列出每个自动配置类 Positive matches / Negative matches 及命中的具体条件注解——是官方设计好的诊断入口。A 成本极高且方向错；C 的 ERROR 级别反而看不到细节；D 无逻辑。',
  },
]
