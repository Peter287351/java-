import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'spring-02-bean-lifecycle-001',
    type: 'single',
    difficulty: 1,
    tags: ['Bean 初始化', '执行顺序'],
    stem: `同一个 Bean 上同时存在 @PostConstruct、InitializingBean.afterPropertiesSet 和 init-method 三种初始化回调，它们的执行顺序是？`,
    options: [
      { key: 'A', text: '@PostConstruct → afterPropertiesSet → init-method' },
      { key: 'B', text: 'afterPropertiesSet → @PostConstruct → init-method' },
      { key: 'C', text: 'init-method → @PostConstruct → afterPropertiesSet' },
      { key: 'D', text: '三者顺序不确定，取决于 Bean 的注册顺序' },
    ],
    answers: ['A'],
    explanation: `三种回调的触发机制不同：@PostConstruct 由 CommonAnnotationBeanPostProcessor（JSR-250 注解）最先调用；随后容器回调 InitializingBean.afterPropertiesSet（Spring 接口契约）；最后执行 @Bean(initMethod = "...") 或 XML 配置的 init-method。记忆口诀：注解最先、接口其次、配置兜底。销毁回调完全对称：@PreDestroy → destroy() → destroy-method。B、C 把顺序记反；D 错在顺序由容器机制严格保证。`,
  },
  {
    id: 'spring-02-bean-lifecycle-002',
    type: 'single',
    difficulty: 2,
    tags: ['Bean 生命周期'],
    stem: `下列哪个选项正确描述了 Spring 单例 Bean 的完整生命周期顺序？`,
    options: [
      { key: 'A', text: '实例化（构造器）→ 属性填充 → Aware 回调 → BeanPostProcessor 前置 → 初始化（@PostConstruct → afterPropertiesSet → init-method）→ BeanPostProcessor 后置 → 使用 → 销毁回调' },
      { key: 'B', text: '属性填充 → 实例化 → 初始化 → Aware 回调 → BeanPostProcessor 后置 → 使用 → 销毁回调' },
      { key: 'C', text: '实例化 → BeanPostProcessor 前置 → 属性填充 → 初始化 → Aware 回调 → BeanPostProcessor 后置 → 使用 → 销毁回调' },
      { key: 'D', text: '实例化 → 属性填充 → 初始化 → Aware 回调 → BeanPostProcessor 前置与后置 → 使用（无销毁阶段）' },
    ],
    answers: ['A'],
    explanation: `标准流水线：实例化（调用构造器）→ 属性填充（依赖注入）→ Aware 回调（BeanNameAware、BeanFactoryAware、ApplicationContextAware 等）→ BeanPostProcessor 前置 → 初始化回调（@PostConstruct → afterPropertiesSet → init-method）→ BeanPostProcessor 后置（AOP 代理通常在此生成）→ 使用 → 销毁回调。B 错，必须先实例化才有对象可填属性，且 Aware 在初始化之前；C 错，BPP 前置与 Aware 都发生在属性填充之后、初始化之前；D 错，Aware 与 BPP 前置必须在初始化之前，且单例 Bean 有销毁阶段。`,
  },
  {
    id: 'spring-02-bean-lifecycle-003',
    type: 'code',
    difficulty: 2,
    tags: ['Bean 生命周期', '@PostConstruct'],
    stem: `阅读以下 Bean 定义（注解来自 javax.annotation 或 jakarta.annotation 包）：

~~~java
@Component
public class LifecycleBean implements InitializingBean, DisposableBean {

    public LifecycleBean() { System.out.print("ctor "); }

    @PostConstruct
    public void postConstruct() { System.out.print("post "); }

    @Override
    public void afterPropertiesSet() { System.out.print("afterProps "); }

    @PreDestroy
    public void preDestroy() { System.out.print("preDestroy "); }

    @Override
    public void destroy() { System.out.print("destroy "); }
}
~~~

容器启动完成后再调用 close() 优雅关闭，控制台的输出顺序是？`,
    options: [
      { key: 'A', text: 'ctor post afterProps preDestroy destroy' },
      { key: 'B', text: 'ctor afterProps post preDestroy destroy' },
      { key: 'C', text: 'ctor post afterProps destroy preDestroy' },
      { key: 'D', text: 'post ctor afterProps destroy preDestroy' },
    ],
    answers: ['A'],
    explanation: `初始化阶段按"构造器实例化 → @PostConstruct → afterPropertiesSet"输出 ctor post afterProps；关闭时销毁回调按"@PreDestroy → destroy()"输出 preDestroy destroy，与初始化规则对称（注解最先、接口其次、配置兜底）。B 错在 @PostConstruct 应先于 afterPropertiesSet；C 错在 @PreDestroy 应先于 destroy()；D 错在构造器一定最先执行。另注意：非 Web 环境必须显式 close() 或 registerShutdownHook()，否则销毁回调不会执行。`,
  },
  {
    id: 'spring-02-bean-lifecycle-004',
    type: 'scenario',
    difficulty: 3,
    tags: ['线程安全', '单例 Bean'],
    scenario: `压测报告显示：OrderStatsService（@Service，单例）统计口径不对——private long count 在 count++ 后远小于实际请求数；同一个类里 private Map<String, Integer> hotCache = new HashMap<>() 缓存热点数据，压测期间偶发请求 hang 住、日志出现 ConcurrentModificationException。该服务没有任何锁。`,
    stem: `作为修复负责人，下列哪个方案方向正确？`,
    options: [
      { key: 'A', text: '把服务改回无状态：计数换 AtomicLong/LongAdder，缓存换 ConcurrentHashMap，成员变量只放与请求无关的数据' },
      { key: 'B', text: '在类上把 @Scope 改成 prototype，让每次注入都拿到新实例' },
      { key: 'C', text: '把 count 和 hotCache 都声明为 static，扩大共享范围以摊薄竞争' },
      { key: 'D', text: '在每个请求入口 new 一个新的 OrderStatsService 实例，绕开容器共享' },
    ],
    answers: ['A'],
    explanation: `排查链路：单例 Bean 被所有请求共享 → count++ 非原子操作导致更新丢失 → HashMap 非线程安全，并发写入会出现数据错乱甚至结构性破坏。根治方案是让单例 Bean 无状态：计数用 AtomicLong/LongAdder，缓存用 ConcurrentHashMap（必要时再配合同步控制）。B 错，注入到单例 Controller 里的引用仍是同一个 prototype 实例，作用域改动解决不了共享；C 错，static 只是换了存储位置，并发问题依旧；D 错，绕开容器后失去依赖注入与 AOP，本质也没解决问题。`,
  },
  {
    id: 'spring-02-bean-lifecycle-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['作用域', 'singleton', 'prototype'],
    stem: `关于 singleton 与 prototype 两种作用域，下列说法正确的有？`,
    options: [
      { key: 'A', text: 'singleton 是默认作用域，容器启动时就完成实例化和初始化（标注 @Lazy 的除外）' },
      { key: 'B', text: 'prototype 每次向容器索取（getBean 或被注入）都会创建新实例' },
      { key: 'C', text: '容器会跟踪 prototype Bean 的完整生命周期，并负责调用它的销毁回调' },
      { key: 'D', text: 'singleton Bean 依赖注入 prototype Bean 时，每次调用业务方法都会拿到全新的 prototype 实例' },
    ],
    answers: ['A', 'B'],
    explanation: `A 对，singleton 是默认作用域，随容器启动预实例化；B 对，prototype 语义就是"每次索取都新建"。C 错，容器对 prototype 只负责创建与初始化，销毁回调不由容器触发，交由使用方处理；D 错，依赖注入发生在单例初始化时仅一次，之后调用共用同一个 prototype 实例，除非配置 @Scope 的 proxyMode 作用域代理。`,
  },
  {
    id: 'spring-02-bean-lifecycle-006',
    type: 'single',
    difficulty: 3,
    tags: ['@Scope', 'proxyMode'],
    stem: `关于 @Scope 的 proxyMode（如 @Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)），下列说法正确的是？`,
    options: [
      { key: 'A', text: '容器注入的是目标 Bean 的代理，每次调用代理的方法时才去对应作用域解析并获取真实 Bean' },
      { key: 'B', text: '它把 prototype 提升为 singleton，从而避免重复创建对象' },
      { key: 'C', text: '它与 @Lazy 等价，只是写法不同' },
      { key: 'D', text: '它让容器接管 prototype Bean 的销毁回调' },
    ],
    answers: ['A'],
    explanation: `proxyMode 解决"作用域不匹配的注入"：单例 Bean 注入 request/session/prototype Bean 时，真实对象要么尚未产生、要么必须每次新实例，容器于是注入一个 CGLIB（TARGET_CLASS）或 JDK（INTERFACES）代理作为占位，方法被调用时才从当前作用域解析真实对象并转发。B 错，作用域本身没有改变；C 错，@Lazy 只是延迟首次初始化，解决不了"每次获取都要新实例"；D 错，与销毁回调无关。`,
  },
  {
    id: 'spring-02-bean-lifecycle-007',
    type: 'single',
    difficulty: 2,
    tags: ['BeanPostProcessor'],
    stem: `关于 BeanPostProcessor（BPP），下列说法正确的是？`,
    options: [
      { key: 'A', text: '它为每个 Bean 的初始化阶段提供前置与后置两次回调，对所有 Bean 生效，AOP 代理通常在 postProcessAfterInitialization 中生成' },
      { key: 'B', text: '它只对实现了 InitializingBean 接口的 Bean 生效' },
      { key: 'C', text: 'postProcessBeforeInitialization 回调发生在 @PostConstruct 执行之后' },
      { key: 'D', text: '它的回调发生在 Bean 属性填充之前' },
    ],
    answers: ['A'],
    explanation: `BPP 是容器开放给开发者的扩展点：每个 Bean 在初始化前后都会经过容器注册的所有 BPP。A 对，且 @PostConstruct、@PreDestroy 本身就是由 InitDestroyAnnotationBeanPostProcessor 在前置回调阶段执行的；AOP 代理由 AbstractAutoProxyCreator 在后置回调中生成。B 错，BPP 对所有 Bean 生效，与是否实现某接口无关；C 错，@PostConstruct 就发生在"前置回调"阶段，不可能在其后；D 错，BPP 回调在初始化阶段，晚于实例化与属性填充。`,
  },
  {
    id: 'spring-02-bean-lifecycle-008',
    type: 'single',
    difficulty: 1,
    tags: ['销毁回调', '@PreDestroy'],
    stem: `关于单例 Bean 的销毁回调，下列说法正确的是？`,
    options: [
      { key: 'A', text: '执行顺序为 @PreDestroy → DisposableBean.destroy() → destroy-method，且非 Web 环境需要 close() 或 registerShutdownHook() 才会触发' },
      { key: 'B', text: 'JVM 进程结束时 Spring 一定会自动调用销毁回调，无需任何额外处理' },
      { key: 'C', text: 'prototype 作用域的 Bean 由容器负责调用其销毁回调' },
      { key: 'D', text: 'destroy-method 在 @PreDestroy 之前执行' },
    ],
    answers: ['A'],
    explanation: `销毁回调与初始化对称：注解（@PreDestroy）最先、接口（DisposableBean.destroy()）其次、配置（destroy-method）兜底；而非 Web 应用的容器不会随 JVM 退出自动关闭，需要显式 close() 或 registerShutdownHook() 注册关闭钩子。B 错，默认直接 kill 进程不会触发优雅关闭；C 错，容器对 prototype 只管创建，销毁回调由使用方负责；D 错，顺序记反了。`,
  },
]
