## AI Services：声明式 LLM 接口

### 是什么
AI Services 是 LangChain4j 的"Mapper 思想"：定义接口 + 注解，框架动态代理实现——**你写接口，框架管组装**（模型、记忆、检索器、工具全部注入代理）。

```java
interface Assistant {
    @SystemMessage("你是订单客服，只回答订单问题")
    String chat(@MemoryId String userId, @UserMessage String question);
}
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model).chatMemoryProvider(id -> MessageWindowChatMemory.withMaxMessages(20))
    .build();
```

### 为什么
模板变量 `{{it}}`（@UserMessage 默认参数）与多参数 `{{field}}` 让 Prompt 结构化；**返回值直接映射 POJO**：接口声明返回 `OrderInfo`，框架让模型输出 JSON 再反序列化（失败自动重试修正）——告别手写解析。

### 怎么用
- 返回 POJO：接口方法返回自定义类型即可；复杂嵌套用 record/POJO + 描述性字段注释。
- 记忆隔离：`@MemoryId` 区分会话，配合 `chatMemoryProvider` 每个用户独立记忆。
- Spring Boot starter：`@AiService` 注解自动装配为 Bean。

### 常见坑
- 结构化输出失败常因字段描述不清——给模型"看得懂"的字段语义与示例。
- Prompt 模板变量拼写错误在运行期才暴露，模板纳入测试。

### 面试怎么问
「AI Services 和直接调 ChatModel 的区别？」——声明式 vs 命令式：代理层统一处理模板、记忆、工具、结构化输出，业务代码只剩接口。

## 动手清单

1. 定义 OrderAssistant 接口：@SystemMessage 人设 + 返回自定义 record，跑通自然语言查订单。自测标准：能解释框架如何在内部把"返回 POJO"翻译成 JSON 约束。
2. 用 @MemoryId 模拟两个用户并行对话，验证记忆互不串扰。自测标准：能说出串会话事故的成因。
