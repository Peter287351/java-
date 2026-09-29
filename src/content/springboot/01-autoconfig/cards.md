## 自动配置：约定优于配置的实现

### 是什么
`@SpringBootApplication` = `@SpringBootConfiguration` + `@ComponentScan` + `@EnableAutoConfiguration`。自动配置靠 **SPI 机制**：从 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（2.7 前 spring.factories）读取配置类清单，再由**条件注解**（`@ConditionalOnClass` 类路径有某类、`@ConditionalOnMissingBean` 用户没自定义才生效、`@ConditionalOnProperty` 配置开关）筛选。

### 为什么
自动配置让"引依赖即用"：spring-boot-starter-data-redis 进来，`RedisTemplate` 相关配置就绪。**用户自定义 Bean 永远优先**——`@ConditionalOnMissingBean` 是"默认实现让位"的关键。

### 怎么用
自定义 starter：写好自动配置类 + 条件注解 + `AutoConfiguration.imports` 登记 + 属性类 `@ConfigurationProperties`。命名规范：官方 `spring-boot-starter-xxx`，第三方 `xxx-spring-boot-starter`。

### 常见坑
- 启动类放根包，否则 `@ComponentScan` 扫不到组件。
- 诊断工具：`--debug` 打出 CONDITIONS EVALUATION REPORT，看哪些配置命中/未命中及原因。

### 面试怎么问
「Spring Boot 自动配置原理」标准三段：SPI 加载清单 → 条件注解过滤 → 用户 Bean 优先；能说出 imports 文件路径即超出多数候选人。

## 动手清单

1. 写一个 `sms-spring-boot-starter`：属性 `sms.app-key`，自动配置 `SmsClient`（`@ConditionalOnMissingBean`）。自测标准：另一个项目引依赖即能注入 SmsClient，且自定义 Bean 会覆盖默认。
2. `java -jar app.jar --debug` 启动，在报告里找一个命中与一个未命中的自动配置并解释原因。自测标准：能对应到具体条件注解。
