import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'spring-03-aop-001',
    type: 'single',
    difficulty: 1,
    tags: ['AOP 术语', '切点'],
    stem: `在 AOP 术语中，"用表达式筛选哪些方法需要被拦截"（如 execution(* com.demo.service..*.*(..))）对应的概念是？`,
    options: [
      { key: 'A', text: '切点（Pointcut）' },
      { key: 'B', text: '连接点（JoinPoint）' },
      { key: 'C', text: '通知（Advice）' },
      { key: 'D', text: '织入（Weaving）' },
    ],
    answers: ['A'],
    explanation: `切点（Pointcut）是筛选连接点的谓词表达式，决定"拦哪里"；连接点（JoinPoint）是被切点命中的具体方法执行点；通知（Advice）是拦截后执行的增强逻辑，决定"做什么"；织入（Weaving）是把切面应用到目标对象的过程。B 错，连接点是具体的点而非筛选规则；C 错，通知是增强内容；D 错，织入是动作而非规则。切面（Aspect）就是切点 + 通知的组合。`,
  },
  {
    id: 'spring-03-aop-002',
    type: 'single',
    difficulty: 2,
    tags: ['通知', '执行顺序'],
    stem: `同一个 @Aspect 切面中同时声明了 @Around、@Before、@AfterReturning、@After 四种通知，目标方法正常返回（Spring 5.2.7+），执行顺序是？`,
    options: [
      { key: 'A', text: '@Around 前半 → @Before → 目标方法 → @AfterReturning → @After → @Around 后半' },
      { key: 'B', text: '@Around 前半 → @Before → 目标方法 → @After → @AfterReturning → @Around 后半' },
      { key: 'C', text: '@Before → @Around 前半 → 目标方法 → @After → @Around 后半 → @AfterReturning' },
      { key: 'D', text: '@Before → 目标方法 → @Around 前半 → @AfterReturning → @After → @Around 后半' },
    ],
    answers: ['A'],
    explanation: `同一 @Aspect 内通知优先级为 @Around、@Before、@After、@AfterReturning、@AfterThrowing，但 @After 是 finally 语义，实际总在 @AfterReturning/@AfterThrowing 之后执行，Spring 5.2.7 起该顺序被统一明确。因此正常返回时：Around 前半 → Before → 目标方法 → AfterReturning → After → Around 后半。B 错在把 @After 排到 @AfterReturning 之前；C 错在 @Before 位于 @Around 的通知链内部执行，且 @AfterReturning 在 @After 之前；D 错在 @Around 包裹整个流程，其前半段代码最先执行。抛异常时 @AfterThrowing 顶替 @AfterReturning 的位置，@After 依旧执行。`,
  },
  {
    id: 'spring-03-aop-003',
    type: 'code',
    difficulty: 2,
    tags: ['@Around', '执行顺序'],
    stem: `阅读以下切面（目标方法执行时打印 "T "）：

~~~java
@Aspect
@Component
public class LogAspect {

    @Pointcut("execution(* com.demo.service.OrderService.create(..))")
    public void pc() {}

    @Around("pc()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        System.out.print("A ");
        try {
            return pjp.proceed();
        } finally {
            System.out.print("D ");
        }
    }

    @Before("pc()")
    public void before() { System.out.print("B "); }

    @After("pc()")
    public void after() { System.out.print("C "); }
}
~~~

通过代理调用 create() 并正常返回，控制台输出顺序是？`,
    options: [
      { key: 'A', text: 'A B T C D' },
      { key: 'B', text: 'A B T D C' },
      { key: 'C', text: 'B A T C D' },
      { key: 'D', text: 'A B T' },
    ],
    answers: ['A'],
    explanation: `进入代理后先执行 @Around 的前半段打印 A；proceed() 进入通知链，@Before 打印 B；目标方法打印 T；方法正常返回后链内触发 @After 打印 C（@After 是 finally 语义，处于 @Around 内部，先于其后半段完成）；最后回到 @Around 的 finally 打印 D。B 错在 C 与 D 的顺序，@After 深于 @Around 的后半段代码；C 错在 A 必须最先执行；D 错在 @After 与 @Around 后半段都会执行。`,
  },
  {
    id: 'spring-03-aop-004',
    type: 'scenario',
    difficulty: 3,
    tags: ['自调用', 'AOP 失效'],
    scenario: `你给 UserService 配了日志切面（切点覆盖 service 包全部方法）。Controller 调 service.update() 时日志正常打印，但 update() 内部通过 this.save() 调用自己的 save() 时，save 上的切面日志始终不打印。切面类加了 @Aspect 和 @Component，save 是 public 且切点表达式无误。`,
    stem: `切面为什么"时灵时不灵"？下面哪个分析处置是正确的？`,
    options: [
      { key: 'A', text: '自调用走的是 this（原始对象）而非代理对象，所以增强不执行；可通过注入自身代理（@Lazy 自注入/ObjectProvider）、AopContext.currentProxy()（需 exposeProxy）或把 save 挪到另一个 Bean 解决' },
      { key: 'B', text: '切点表达式没有覆盖到 save 方法，把 execution 表达式改成 save 的方法全限定名即可' },
      { key: 'C', text: '给 save 方法额外加一个 @Transactional 注解，事务代理会顺带触发日志切面' },
      { key: 'D', text: '把 save 方法改成 static，静态方法调用会被编译器织入切面逻辑' },
    ],
    answers: ['A'],
    explanation: `排查链路：切面对外部调用生效（Controller 调 update 有日志）说明 Bean、切点、代理都正常 → 问题锁定在 this.save() 这一步：自调用拿到的是原始对象，不经过代理，增强自然不执行。解决思路都是"让调用重新走代理"：注入自身代理、开启 exposeProxy 后用 AopContext.currentProxy()，或按职责把 save 拆到另一个 Bean（最推荐）。B 错，外部调用已证明切点能命中；C 错，事务与日志切面是两套增强，互不触发，且同样绕过代理；D 错，static 方法不属于对象实例方法，代理更无法增强。`,
  },
  {
    id: 'spring-03-aop-005',
    type: 'single',
    difficulty: 2,
    tags: ['JDK 动态代理', 'CGLIB'],
    stem: `关于 Spring AOP 代理方式的选择，下列说法正确的是？`,
    options: [
      { key: 'A', text: '目标类实现了接口时默认使用 JDK 动态代理（代理与目标实现同一接口），没有接口时使用 CGLIB 生成子类代理；Spring Boot 2.x 起默认统一使用 CGLIB（proxyTargetClass = true）' },
      { key: 'B', text: 'JDK 动态代理通过继承目标类生成子类，因此 final 类无法被 JDK 代理' },
      { key: 'C', text: 'CGLIB 代理对象只能赋值给接口类型的引用' },
      { key: 'D', text: 'Spring Boot 2.x 起若目标类没有实现接口，启动会直接报错，要求必须提供接口' },
    ],
    answers: ['A'],
    explanation: `A 对，Spring AOP 的默认策略是"有接口用 JDK 动态代理、无接口用 CGLIB"，而 Spring Boot 2.x 起 spring.aop.proxy-target-class 默认 true，统一走 CGLIB。B 错，通过继承生成子类的是 CGLIB，JDK 动态代理基于接口反射实现，不存在继承目标类；C 错，CGLIB 代理是目标类的子类，可以赋给目标类类型引用；D 错，没有接口正是 CGLIB 的用武之地，不会报错。`,
  },
  {
    id: 'spring-03-aop-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['AOP 失效'],
    stem: `切面明明写对了，通知却不执行。下列哪些属于 Spring AOP（代理机制）下"切面不生效"的真实原因？`,
    options: [
      { key: 'A', text: '在同一个类里通过 this 调用另一个方法，被调方法上的增强不会执行' },
      { key: 'B', text: '目标方法被 private 修饰，基于代理的 Spring AOP 拦截不到' },
      { key: 'C', text: '目标对象是用 new 创建的，没有交给 Spring 容器管理' },
      { key: 'D', text: '目标方法返回值是 void，导致通知无法增强该方法' },
      { key: 'E', text: '目标类被 final 修饰，Spring Boot 2.x 默认的 CGLIB 代理无法生成子类' },
    ],
    answers: ['A', 'B', 'C', 'E'],
    explanation: `Spring AOP 的本质是代理对象拦截外部调用：A 对，this 自调用走的是原始对象，绕过代理；B 对，private 方法无法被 CGLIB 子类覆写，也无法被接口代理匹配；C 对，脱离容器的对象根本不存在代理；E 对，CGLIB 靠生成子类增强，final 类无法继承、final 方法无法覆写。D 错，返回值类型与能否增强无关，void 方法照样被通知。`,
  },
  {
    id: 'spring-03-aop-007',
    type: 'single',
    difficulty: 3,
    tags: ['Spring AOP', 'AspectJ'],
    stem: `关于 Spring AOP 与 AspectJ 的对比，下列说法正确的是？`,
    options: [
      { key: 'A', text: 'Spring AOP 在运行时通过动态代理织入，只支持方法执行级别的连接点；AspectJ 在编译期或类加载期织入，还支持构造器、字段等更细粒度的切点，无代理调用开销' },
      { key: 'B', text: 'Spring AOP 必须使用 AspectJ 的 ajc 编译器重新编译项目才能生效' },
      { key: 'C', text: 'AspectJ 在运行时生成代理子类，性能不如 Spring AOP' },
      { key: 'D', text: '用 @Aspect 注解写的切面必须切换到 AspectJ 环境才能运行' },
    ],
    answers: ['A'],
    explanation: `A 对，两者最大的差异是织入时机与能力范围：Spring AOP 运行时代理、方法级连接点，足以覆盖绝大多数业务场景；AspectJ 编译期/类加载期织入，无代理开销，支持字段、构造器等切点。B 错，Spring AOP 是纯 Java 运行时实现，不需要 ajc；C 错，说反了，AspectJ 是编译期织入、无代理开销；D 错，Spring AOP 支持用 AspectJ 的注解风格（@Aspect、execution 表达式）声明切面并自行解析，无需切换环境。`,
  },
  {
    id: 'spring-03-aop-008',
    type: 'scenario',
    difficulty: 2,
    tags: ['@Aspect', 'execution 表达式'],
    scenario: `上线前评审要求：统计 service 层每个方法的耗时，格式为"方法名 入参 耗时ms"，要求对业务代码零侵入、便于以后统一开关。团队提出了四种实现思路。`,
    stem: `哪种方案最符合要求？`,
    options: [
      { key: 'A', text: '写一个 @Aspect 切面，@Around 中 proceed() 前后用 System.nanoTime() 计时，通过 JoinPoint 获取方法签名与入参，切点用 execution(* com.demo.service..*.*(..)) 覆盖包及子包' },
      { key: 'B', text: '用 @Before 把开始时间记到切面类的成员变量里，@AfterReturning 用当前时间减去它得到耗时' },
      { key: 'C', text: '在每个方法的首尾手动加计时代码，用统一工具类输出日志' },
      { key: 'D', text: '写一个 Servlet Filter，在 doFilter 里统计 service 层每个方法的耗时' },
    ],
    answers: ['A'],
    explanation: `A 对：@Around 包裹目标方法，前半段取起始时间、proceed() 返回后计算耗时，JoinPoint.getSignature().getName() 拿方法名、getArgs() 拿入参，execution 表达式一把覆盖整个包，业务代码零改动、统一开关只需注掉切面。B 错，切面是单例，成员变量存开始时间在并发下互相覆盖，两个通知间传状态需要 ThreadLocal，方案脆弱；C 错，侵入每个业务方法，新增接口容易漏加；D 错，Filter 工作在请求层，粒度是 HTTP 请求，无法细分到 service 方法的调用。`,
  },
  {
    id: 'spring-03-aop-009',
    type: 'scenario',
    difficulty: 3,
    tags: ['切面顺序', '@Order'],
    scenario:
      '写单方法上同时叠加 @Transactional 与自定义 LogAspect（@Around 记录入参/出参）。需求是"日志要记录方法最终状态（提交成功还是回滚）"，但上线后发现日志打印的返回值总是出现在事务结果之前，回滚时日志仍显示"成功返回"。',
    stem: '对现象的解释与修复，最准确的是？',
    options: [
      { key: 'A', text: '事务本身也是一个切面：LogAspect 默认优先级高于事务切面（在内层），proceed() 返回时事务尚未提交/回滚。用 @Order 调整优先级让日志切面包在事务外层，或把"结果记录"放在 proceed() 之后并捕获异常判断是否回滚' },
      { key: 'B', text: '切面执行顺序由 Spring 随机决定，无法控制，只能放弃这个需求' },
      { key: 'C', text: '把 LogAspect 的通知从 @Around 换成 @After，就一定在事务提交之后执行' },
      { key: 'D', text: '在日志切面里直接调用 TransactionSynchronizationManager 查询事务是否已提交，与切面顺序无关' },
    ],
    answers: ['A'],
    explanation:
      '事务用 AOP 实现，与自定义切面在同一条代理链上，顺序由 @Order/PriorityOrdered 决定（默认未排序时顺序不确定，但现象表明日志在内层）。理解这条链就明白：内层 proceed() 返回 ≠ 外层事务结束。修复就是控制顺序（日志外层）或在事务边界后判断。B 错误——顺序完全可控；C 错误——@After（after finally 语义）仍属于当前切面链，若日志切面在内层，@After 依旧先于外层事务收尾执行；D 方向可行但表述错误——查询同步器状态拿不到"本次是否回滚"的结论，正确做法是 Synchronization.afterCompletion 回调，而那本质上也要求理解事务边界。',
  },
]
