import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'spring-01-ioc-di-001',
    type: 'single',
    difficulty: 1,
    tags: ['控制反转', '依赖注入'],
    stem: `在 Spring 中，"控制反转（IoC）"究竟反转的是什么？`,
    options: [
      { key: 'A', text: '对象的创建与依赖装配的控制权——从程序员手动 new、手动组装，改为交给容器统一管理' },
      { key: 'B', text: '程序的执行流程控制权——从主方法交给注解处理器' },
      { key: 'C', text: '数据库事务的控制权——从应用层交给数据库引擎' },
      { key: 'D', text: 'HTTP 请求的控制权——从浏览器交给服务器' },
    ],
    answers: ['A'],
    explanation: `IoC 反转的是"对象的创建与对象之间依赖关系"的控制权：原来由代码 new OrderDao() 硬编码装配，现在由容器扫描 Bean 定义、实例化对象并注入依赖，DI（依赖注入）是 IoC 最主流的实现方式。B 错在程序执行流程仍由代码逻辑决定，Spring 不接管业务流程；C 错在事务管理只是 Spring 提供的一种能力，不属于 IoC 的定义；D 错在请求接收属于 Web 容器的职责，与 IoC 无关。`,
  },
  {
    id: 'spring-01-ioc-di-002',
    type: 'single',
    difficulty: 1,
    tags: ['构造器注入', '依赖注入'],
    stem: `下列关于"为什么 Spring 官方推荐构造器注入"的说法，正确的是？`,
    options: [
      { key: 'A', text: '构造器注入可以保证依赖不可变（可声明 final）、非空，且对象构造完成后即处于完整可用状态' },
      { key: 'B', text: '构造器注入由 JVM 底层优化，运行性能显著优于字段注入' },
      { key: 'C', text: '构造器注入能自动化解所有循环依赖，无需修改设计' },
      { key: 'D', text: '字段注入无法被 Spring 容器识别，构造器注入是唯一合法的注入方式' },
    ],
    answers: ['A'],
    explanation: `构造器注入的三大收益：依赖可声明为 final 保证不可变；构造时传入，非空约束由编译器保证；对象初始化完成即依赖齐全，不存在"半初始化"状态，且循环依赖会在启动时直接报错、尽早暴露。B 错在注入方式与运行性能无关；C 错在构造器注入恰恰无法被三级缓存化解，会抛 BeanCurrentlyInCreationException；D 错在字段注入也是 Spring 支持的方式，只是不推荐使用。`,
  },
  {
    id: 'spring-01-ioc-di-003',
    type: 'single',
    difficulty: 1,
    tags: ['@Autowired', '@Resource'],
    stem: `@Autowired 与 @Resource 的默认注入策略分别是？`,
    options: [
      { key: 'A', text: '@Autowired 默认按类型（byType），@Resource 默认先按名称（byName）再按类型' },
      { key: 'B', text: '@Autowired 默认按名称（byName），@Resource 默认按类型（byType）' },
      { key: 'C', text: '两者都默认按类型' },
      { key: 'D', text: '两者都默认按名称' },
    ],
    answers: ['A'],
    explanation: `@Autowired 是 Spring 提供的注解，先按类型找候选，有多个时再用字段名/参数名兜底，配合 @Qualifier 可精确指定；@Resource 是 JSR-250 标准注解，先按指定 name（未指定则取字段名）查找，找不到再按类型兜底。B、C、D 把两者的默认策略记反或混淆了。记忆口诀：Autowired 认类型，Resource 认名字。`,
  },
  {
    id: 'spring-01-ioc-di-004',
    type: 'multiple',
    difficulty: 2,
    tags: ['@ComponentScan', 'Bean 定义'],
    stem: `关于 @ComponentScan 与 Bean 的注册，下列说法正确的有？`,
    options: [
      { key: 'A', text: '不指定 basePackages 时，默认扫描该配置类（或启动类）所在包及其子包' },
      { key: 'B', text: '扫描到的 @Component 衍生注解（@Service、@Repository 等）标记的类，默认 Bean 名称为类名首字母小写' },
      { key: 'C', text: '只要类上标注了 @Component，无论是否在扫描路径内，都会被注册为 Bean' },
      { key: 'D', text: '@Repository 相比 @Component 额外具备数据库异常转换的语义' },
    ],
    answers: ['A', 'B', 'D'],
    explanation: `A 对，默认从配置类所在包开始递归扫描，这也是启动类通常放在根包的原因；B 对，默认 Bean 名由 AnnotationBeanNameGenerator 生成，即类名首字母小写；D 对，@Repository 会被 PersistenceExceptionTranslationPostProcessor 处理，把数据库异常转换为 Spring 的 DataAccessException 体系。C 错，类必须落在扫描路径内才会被发现，放在扫描包之外即使加了 @Component 也不会注册。`,
  },
  {
    id: 'spring-01-ioc-di-005',
    type: 'code',
    difficulty: 2,
    tags: ['@Primary', '@Qualifier'],
    stem: `阅读以下 Spring 组件定义：

~~~java
public interface PayService {
    String pay();
}

@Component
@Primary
public class AliPayService implements PayService {
    public String pay() { return "ali"; }
}

@Component
public class WxPayService implements PayService {
    public String pay() { return "wx"; }
}

@Service
public class OrderService {

    private final PayService payService;

    public OrderService(PayService payService) {
        this.payService = payService;
    }

    public String pay() { return payService.pay(); }
}
~~~

容器正常启动后调用 orderService.pay()，返回值是？`,
    options: [
      { key: 'A', text: '"ali"' },
      { key: 'B', text: '"wx"' },
      { key: 'C', text: '启动即失败，抛出 NoUniqueBeanDefinitionException' },
      { key: 'D', text: '"aliwx"' },
    ],
    answers: ['A'],
    explanation: `按类型注入 PayService 时存在两个候选：AliPayService 标注了 @Primary，优先级最高，于是被注入，返回 "ali"。B 错，WxPayService 没有 @Primary/@Qualifier 标记不会被选中；C 错，NoUniqueBeanDefinitionException 只在"多个候选且无法决出唯一"时抛出，@Primary 正是解决冲突的手段；D 错，注入的是单个 Bean 的引用，不会拼接。若两个实现都没有 @Primary，启动时才会抛 NoUniqueBeanDefinitionException，需要 @Qualifier 指定。`,
  },
  {
    id: 'spring-01-ioc-di-006',
    type: 'single',
    difficulty: 2,
    tags: ['BeanFactory', 'ApplicationContext'],
    stem: `关于 BeanFactory 与 ApplicationContext 的关系与差异，正确的是？`,
    options: [
      { key: 'A', text: 'ApplicationContext 是 BeanFactory 的子接口，在它之上补充了事件发布、国际化、资源加载等企业级能力' },
      { key: 'B', text: 'BeanFactory 是功能更完整的容器，生产环境应直接使用它替代 ApplicationContext' },
      { key: 'C', text: '两者对单例 Bean 的实例化时机完全一致，都是首次 getBean 时才创建' },
      { key: 'D', text: 'ApplicationContext 不支持 @Lazy 延迟初始化' },
    ],
    answers: ['A'],
    explanation: `A 对，ApplicationContext 继承自 BeanFactory 分支接口，在其上扩展了事件发布（ApplicationEventPublisher）、国际化（MessageSource）、资源加载（ResourcePatternResolver）等能力。B 错，关系说反了，ApplicationContext 才是功能更完整的超集；C 错，ApplicationContext 默认在启动时预实例化所有单例 Bean（标注 @Lazy 的除外），BeanFactory 默认首次 getBean 才创建；D 错，@Lazy 在 ApplicationContext 下完全可用。`,
  },
  {
    id: 'spring-01-ioc-di-007',
    type: 'single',
    difficulty: 3,
    tags: ['循环依赖', '三级缓存'],
    stem: `Spring 用"三级缓存"解决单例 Bean 的属性循环依赖。为什么要三级而不是二级缓存？`,
    options: [
      { key: 'A', text: '三级缓存存放 ObjectFactory，只有真正发生循环依赖时才提前生成早期引用（AOP 场景下提前生成代理）并上移到二级缓存，保证代理对象只创建一次' },
      { key: 'B', text: '三级缓存用于直接存放最终的代理对象，避免初始化完成后再做转换' },
      { key: 'C', text: '三个缓存分别对应 singleton、prototype、request 三种作用域的 Bean' },
      { key: 'D', text: '有了三级缓存，构造器注入的循环依赖也能被化解，无需修改设计' },
    ],
    answers: ['A'],
    explanation: `一级缓存 singletonObjects 放完全初始化的成品；二级缓存 earlySingletonObjects 放提前暴露的早期引用；三级缓存 singletonFactories 放 ObjectFactory。发生循环依赖时才调用工厂提前生成引用（AOP 场景即提前代理）并放入二级缓存——这样普通 Bean 仍走正常的代理生成时机（BeanPostProcessor 后置），代理不会被重复创建，这正是"二级不够、需要三级"的原因。B 错，三级放的是工厂而非代理成品；C 错，三级缓存属于单例注册表（DefaultSingletonBeanRegistry），prototype 循环依赖直接报错；D 错，构造器注入在实例化阶段就互相索要对方，无法提前暴露，会抛 BeanCurrentlyInCreationException。`,
  },
  {
    id: 'spring-01-ioc-di-008',
    type: 'scenario',
    difficulty: 3,
    tags: ['循环依赖', '构造器注入'],
    scenario: `项目启动失败，控制台报错 The dependencies of some of the beans in the application context form a cycle，链条显示：OrderService 的构造器需要 PaymentService，PaymentService 的构造器又需要 OrderService，两个类都用构造器注入。团队讨论修复方案。`,
    stem: `作为排查人，你应该怎么定位并解决这个启动失败？`,
    options: [
      { key: 'A', text: '确认是构造器注入形成的环后，改用 setter/字段注入打破一边（或对一边的依赖加 @Lazy），并重新审视两个类的职责是否该拆分' },
      { key: 'B', text: '在两个类的构造器里分别 try-catch 包住依赖赋值，避免报错抛出' },
      { key: 'C', text: '把两个 Bean 都改成 @Scope("prototype")，避开单例缓存对循环依赖的限制' },
      { key: 'D', text: '直接升级到最新的 Spring Boot 版本，新版框架已支持构造器循环依赖' },
    ],
    answers: ['A'],
    explanation: `排查链路：先从异常中的循环链条确认依赖成环 → 看注入方式：三级缓存只能化解"实例化后提前暴露引用"的 setter/字段注入循环依赖，构造器注入在实例化阶段就互相索要，必然抛 BeanCurrentlyInCreationException → 处置上优先用 setter/@Lazy 打破一边，环本身往往提示职责耦合，能拆接口或抽公共逻辑更好。B 错，构造器装配失败发生在容器阶段，catch 掩盖不了；C 错，prototype 的循环依赖 Spring 完全不解决，照样报错；D 错，这是设计约束而非版本缺陷。`,
  },
]
