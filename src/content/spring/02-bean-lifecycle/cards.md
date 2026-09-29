## Bean 生命周期与作用域

### 是什么
Spring 管理的 Bean 从创建到销毁走一条固定流水线：**实例化（调构造器）→ 属性填充（依赖注入）→ Aware 回调 → BeanPostProcessor 前置处理 → 初始化（@PostConstruct → afterPropertiesSet → init-method）→ BeanPostProcessor 后置处理（AOP 代理多在此生成）→ 使用 → 销毁回调（@PreDestroy → destroy() → destroy-method）**。作用域（Scope）决定"有几个实例"：默认 singleton 全容器一个，prototype 每次索取都新建，另有 request/session 等 Web 作用域。

### 为什么
理解这条流水线才能回答"切面为什么没生效""代理对象什么时候创建""初始化逻辑写在哪"。三个初始化回调按"注解最先、接口其次、配置兜底"的口诀执行：@PostConstruct 由 JSR-250 注解驱动，InitializingBean.afterPropertiesSet 是 Spring 原生契约，init-method 是外部配置兜底；销毁回调完全对称。

### 怎么用
- 启动后的一次性初始化（预热缓存、校验配置）放 @PostConstruct。
- singleton 适合无状态组件；有状态对象用 prototype 或 Web 作用域，需要"每次获取都是新实例"时配 @Scope 的 proxyMode 生成作用域代理。

### 常见坑
- **单例 Bean 存可变成员变量是线程安全隐患**：所有请求共享同一实例，`count++` 丢计数，HashMap 并发下错乱。方案是保持无状态，用 AtomicLong、ConcurrentHashMap 或 ThreadLocal，而不是把作用域改成 prototype（注入到单例里的引用还是同一个）。
- singleton 注入 prototype 只注入一次，之后共用同一个实例，除非配置 proxyMode。
- 非 Web 环境要手动 close() 或 registerShutdownHook()，否则销毁回调不执行；prototype 的销毁回调容器不管。

### 面试怎么问
「说说 Bean 的生命周期」——按流水线顺序讲，落点放在 BeanPostProcessor 与 AOP 代理生成时机，能体现深度。

## 动手清单

### 练习 1：观察生命周期
写一个 Bean 同时实现 BeanNameAware、InitializingBean、DisposableBean，并加 @PostConstruct、@PreDestroy 与 init-method/destroy-method，每个回调里打印名字，启动容器再 close()。

**自测标准**：能默写打印顺序（构造器 → Aware → @PostConstruct → afterPropertiesSet → init-method → 使用 → @PreDestroy → destroy() → destroy-method），并说出 AOP 代理大致在 BeanPostProcessor 后置阶段生成。

### 练习 2：亲手制造线程安全问题
单例 Service 里放 `private int count` 与 `private Map<String,Integer> cache = new HashMap<>()`，用 50 线程并发调用，观察统计丢失与 HashMap 异常；再用 AtomicLong 与 ConcurrentHashMap 修复。

**自测标准**：能解释"单例 Bean 无状态"原则，并说出为什么改 @Scope("prototype") 解决不了这个问题。
