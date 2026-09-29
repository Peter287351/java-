## IoC 与 DI：把对象的控制权交给容器

### 是什么
IoC（Inversion of Control，控制反转）是一种设计思想：对象的创建与依赖装配不再由程序员手动 `new` 出来再串起来，而是交给 Spring 容器统一管理。DI（Dependency Injection，依赖注入）是 IoC 最主流的实现——容器在创建 Bean 时把它需要的依赖"注入"进去。`@Component`/`@Service`/`@Repository`/`@Controller` 标记的类，经 `@ComponentScan` 包扫描（默认当前包及子包）注册为 BeanDefinition，Bean 名称默认是类名首字母小写。

### 为什么
自己 `new` 的依赖在编译期焊死：换实现要改源码、单测没法 Mock、公共依赖重复创建。交给容器后，面向接口编程 + 容器装配，耦合从编译期降到配置期，测试时注入 Mock 即可。

### 怎么用
注入方式有字段注入、setter 注入、构造器注入三种，**推荐构造器注入**：依赖可声明为 final（不可变）、非空由编译器保证、对象构造完成即完整可用，循环依赖还会在启动时直接报错、尽早暴露。Spring 4.3 起单构造器可省略 `@Autowired`。`@Autowired`（Spring 注解）默认按类型匹配，多个候选时按名称兜底；`@Resource`（JSR-250 标准）默认先按名称再按类型；多个同类型 Bean 用 `@Qualifier("beanName")` 精确指定，或给默认实现加 `@Primary`。

### 常见坑
- 字段注入写起来短，但类脱离容器无法使用、依赖容易悄悄膨胀、不能 final。
- 三级缓存只救**单例的 setter/字段注入**循环依赖；构造器注入的循环依赖会直接启动失败——这是提醒你重新设计，而不是绕过去。
- ApplicationContext 是 BeanFactory 的超集（事件发布、国际化、资源加载），且默认启动即预实例化单例；BeanFactory 默认懒加载。

### 面试怎么问
「为什么 Spring 官方推荐构造器注入？」——不可变、非空、完整初始化、暴露循环依赖，四点齐答即可站稳。

## 动手清单

### 练习 1：三种注入方式各写一遍
写 `UserService` 依赖 `UserDao`，分别用字段、setter、构造器三种方式实现，启动后打印 `userDao != null`。

**自测标准**：构造器注入能把依赖声明为 `final` 并通过编译；能说清三种方式在"脱离容器单测"时的差异。

### 练习 2：制造并解决一次多候选冲突
给 `UserDao` 写两个实现 `UserDaoMysql`、`UserDaoRedis`（都加 `@Repository`），先观察启动报错，再用 `@Qualifier` 和 `@Primary` 分别解决。

**自测标准**：能复述报错关键字 `expected single matching bean but found 2`，并知道两者同时存在时 `@Qualifier` 优先。
