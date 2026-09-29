## 记忆管理与 LLM 工程实战

### 是什么
- `ChatMemory` 按会话存历史：`MessageWindowChatMemory`（按条数滑动窗口，默认保留最近 N 条）与 `TokenWindowChatMemory`（按 Token 预算裁剪，更精确控成本）。
- 记忆隔离靠 `memoryId`（用户/会话标识）+ `chatMemoryProvider`。
- Web 集成：Spring Boot starter 自动装配；流式接口用 SSE（`text/event-stream`）把 TokenChunk 推给前端。

### 为什么
上下文窗口有限且按 Token 计费：记忆必须"够用且裁剪"。窗口淘汰是最简单有效的策略——太久远的内容对当前回答贡献低。

### 怎么用
```java
chatMemoryProvider = memoryId ->
    MessageWindowChatMemory.builder().id(memoryId).maxMessages(20).build();
```
成本三板斧：精简 System Prompt、窗口裁剪、模型分级（简单任务用便宜模型）。

### 常见坑
- 多实例部署时内存记忆（InMemoryChatMemoryStore）不共享——持久化到 Redis/DB。
- 敏感信息进入记忆后会被反复携带：脱敏后再入记忆。

### 面试怎么问
「长对话怎么控制 Token？」——窗口裁剪 + 摘要压缩 + 只带相关历史（检索式记忆），答出层次感。

## 动手清单

1. 把 maxMessages 从 5 改到 50，观察长对话请求的 Token 消耗曲线。自测标准：能说出窗口大小与成本/遗忘的平衡点。
2. 写 SSE 聊天接口（StreamingChatModel → SseEmitter），前端打字机效果。自测标准：能解释为什么流式首字延迟低。
