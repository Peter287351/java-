## LLM 接入：ChatModel 与消息模型

### 是什么
LangChain4j 是 Java 生态的 LLM 应用框架。核心抽象：`ChatModel`（阻塞调用）与 `StreamingChatModel`（流式回调，`onPartialResponse` 增量返回）。消息类型：`SystemMessage`（人设/规则）、`UserMessage`（用户输入）、`AiMessage`（模型回复，可带工具调用）。接入 OpenAI 兼容服务只需 baseUrl + apiKey + modelName——国产模型（DeepSeek/Qwen/GLM 等）大多兼容 OpenAI 协议。

### 为什么
框架屏蔽各家 API 差异：换模型只换 builder，业务代码不动；统一的 TokenWindow/MessageWindow 记忆、工具调用、RAG 组件可自由组合。

### 怎么用
```java
ChatModel model = OpenAiChatModel.builder()
    .baseUrl("https://api.deepseek.com/v1")
    .apiKey(System.getenv("API_KEY"))
    .modelName("deepseek-chat")
    .temperature(0.7)
    .build();
String answer = model.chat("用一句话解释什么是缓存穿透");
```
temperature 越高越随机（创意场景），越低越确定（抽取/分类场景常用 0~0.2）。

### 常见坑
- apiKey 写死在代码/仓库里——用环境变量或配置中心。
- 不计 Token 成本：长 System Prompt × 高 QPS = 账单爆炸，先估后上。

### 面试怎么问
「ChatModel 和 StreamingChatModel 什么时候用哪个？」——后台批处理用阻塞；用户对话界面用流式（体验首字延迟低，Web 侧配合 SSE）。

## 动手清单

1. 用 OpenAI 兼容方式接入任一国产模型，完成一次多轮对话（手动拼接历史）。自测标准：能解释"无记忆"现象——模型本身无状态，历史靠客户端带上。
2. 同一问题分别在 temperature=0 与 1.5 下调用 3 次，对比输出稳定性。自测标准：能说出各自适用场景。
