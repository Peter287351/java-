## 图与状态：Agent 编排的骨架

### 是什么
LangGraph4j（LangGraph 的 Java 移植）用**有向图**编排 LLM 应用：`StateGraph` 定义节点（Node：一个处理函数）与边（Edge：流转关系），`START` 进入、`END` 结束，`compile()` 后 invoke 执行。状态（State）是贯穿全程的数据容器，用 **Channel + Reducer** 声明合并规则——`AppenderChannel` 追加（如消息列表），默认通道覆盖。

### 为什么
链式编排（A→B→C）表达不了"Agent 循环调用工具直到完成"这类**带回环、有分支**的流程；图把控制流显式化，可循环、可分支、可中断、可恢复，状态流转全部可追溯。

### 怎么用
```java
StateGraph<AgentState> graph = new StateGraph<>(AgentState::new)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, Map.of("tools", "tools", "end", END))
    .addEdge("tools", "agent");
CompiledGraph<AgentState> app = graph.compile();
```

### 常见坑
- 状态里塞太多无关字段 → 每次 Reducer 合并开销大、调试困难；状态只放"流程需要的"。
- 忘记编译（compile）直接跑、或条件边映射的 key 漏写 → 运行期错误。

### 面试怎么问
「为什么用图不用 if-else？」——答"回环、可中断恢复、状态可追溯"三点 + 可视化调试价值。

## 动手清单

1. 画一个"两节点一条件边"的最小图跑通 invoke，打印每步状态。自测标准：能解释 START/END 与条件边映射 key 的对应关系。
2. 给状态加一个 AppenderChannel 消息列表，两个节点各追加一条，观察合并结果。自测标准：能说出覆盖型与追加型通道的区别。
