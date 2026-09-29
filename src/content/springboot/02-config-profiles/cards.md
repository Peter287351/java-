## 配置体系：yml、绑定与多环境

### 是什么
- `@Value("${key}")`：单值注入，松散绑定弱，不支持校验。
- `@ConfigurationProperties(prefix = "mail")`：批量绑定到 POJO，支持**松散绑定**（yml `app-name` ↔ 字段 `appName`）、JSR-303 校验（`@Validated` + `@NotNull`）、IDE 提示（配置元数据）。
- 优先级（高→低）：命令行参数 > `application-{profile}.yml` > `application.yml` > 默认值。

### 为什么
配置外置的目的：同一份代码在不同环境（dev/test/prod）用不同配置。`spring.profiles.active` 决定激活哪套；敏感信息用环境变量覆盖（占位符 `DB_PASS` 的写法见下）避免入库。

### 怎么用
```yaml
spring:
  profiles:
    active: dev
mail:
  host: smtp.example.com
  port: 465
```
环境变量覆盖敏感项：`MAIL_HOST` 这样的系统属性/环境变量优先级高于 yml。

### 常见坑
- yml 缩进用空格不用 Tab；`key: value` 冒号后必须有空格。
- 属性名与 prefix 拼接错误是"配置不生效"第一名；用 `@ConfigurationProperties` 的 IDE 提示或 actuator 的 /configprops 排查。

### 面试怎么问
「@Value 和 @ConfigurationProperties 怎么选？」——零散单值用 @Value；成组配置、要校验/复用的一律属性类。

## 动手清单

1. 写 MailProperties（host/port/from）+ yml 配置 + @Validated 校验 from 非空，故意配错观察启动报错。自测标准：能说出报错发生在启动期的价值。
2. 同一工程准备 application-dev.yml 与 application-prod.yml，用命令行 `--spring.profiles.active=prod` 切换并打印属性验证优先级。自测标准：能演示命令行参数覆盖 yml。
