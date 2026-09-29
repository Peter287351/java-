## 工程化：日志、监控、测试与交付

### 是什么
- 日志：Spring Boot 默认 logback；`logging.level.<pkg>=debug`；**占位符** `log.info("order={}", id)` 而非字符串拼接；链路排查靠 **MDC 放 traceId**，日志模板输出。
- 监控：Actuator 暴露 `/actuator/health`、`/metrics` 等，敏感端点按需开放并加权限。
- 测试：`@SpringBootTest` 全量上下文慢；切片测试 + Mockito；MockMvc 测接口。
- 交付：`mvn package` 出 fat jar（内嵌 Tomcat），`java -jar app.jar` 运行；Dockerfile 分层构建。

### 为什么
"出问题查日志"是后端日常：没有 traceId、没有级别规范，多服务排障等于盲猜。日志是给人和 grep 看的——**规范先于工具**。

### 怎么用
- @Scheduled 定时任务：`cron = "0 0 2 * * ?"`；多实例部署要注意**分布式重复执行**（加分布式锁或调度中心）。
- 单测原则：Service 依赖 Mock（@MockBean），Mapper 用切片或测试容器；别让单测连生产库。

### 常见坑
- 日志里打印手机号/身份证等敏感信息明文。
- @Scheduled 默认单线程池，一个慢任务会阻塞其他任务。
- fat jar 别用解压后的 `java -cp` 启动方式与 jar 混用，路径约定不同。

### 面试怎么问
「多实例下 @Scheduled 会重复执行吗？」——会，答分布式锁/幂等设计 + 提 XXL-Job 等调度中心，体现生产意识。

## 动手清单

1. 接入 logback 滚动文件 + MDC filter 注入 traceId，模拟一次请求链路日志。自测标准：一次请求的所有日志能按 traceId 串起来。
2. 写一个 Service 单测：@MockBean 依赖，覆盖正常与异常分支。自测标准：断言覆盖抛异常路径且不依赖外部环境。
