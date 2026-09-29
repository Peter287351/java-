import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'langgraph4j-01-graph-state-001',
    type: 'single',
    difficulty: 1,
    tags: ['StateGraph'],
    stem: '与"按顺序调用 A→B→C"的链式编排相比，LangGraph4j 用图编排的核心增量能力是？',
    options: [
      { key: 'A', text: '代码行数更少' },
      { key: 'B', text: '支持回环（循环）、条件分支、中断与恢复，且状态流转显式可追溯' },
      { key: 'C', text: '不依赖大模型 API' },
      { key: 'D', text: '自动生成数据库表' },
    ],
    answers: ['B'],
    explanation:
      '图的核心价值是表达复杂控制流：Agent"思考→行动→观察"的循环、多路径分支、human-in-the-loop 中断恢复，都是链式编排难表达的；同时每步状态可记录、可回放。A 无关；C 仍需模型；D 荒谬。',
  },
  {
    id: 'langgraph4j-01-graph-state-002',
    type: 'single',
    difficulty: 2,
    tags: ['状态'],
    stem: 'LangGraph4j 中 Channel（配合 Reducer）的作用是？',
    options: [
      { key: 'A', text: '加密节点间传输的数据' },
      { key: 'B', text: '声明状态字段的更新合并规则：如 AppenderChannel 追加列表，默认通道覆盖旧值' },
      { key: 'C', text: '管理 HTTP 连接池' },
      { key: 'D', text: '记录日志的通道' },
    ],
    answers: ['B'],
    explanation:
      '多个节点都写同一状态字段时必须定义"怎么合"：追加型（消息历史、日志）与覆盖型（最新结果）是最常用两类。A/C/D 均与状态合并无关。',
  },
  {
    id: 'langgraph4j-01-graph-state-003',
    type: 'single',
    difficulty: 2,
    tags: ['Node'],
    stem: 'LangGraph4j 的"节点（Node）"本质是什么？',
    options: [
      { key: 'A', text: '一个数据库连接' },
      { key: 'B', text: '接收当前状态、返回状态更新的处理函数（可调用模型、工具或普通逻辑）' },
      { key: 'C', text: '一个线程池' },
      { key: 'D', text: '一个 REST 端点' },
    ],
    answers: ['B'],
    explanation:
      '节点 = (state) => 更新 的纯处理单元：里面可以是模型调用、工具执行或任何 Java 逻辑；图负责按边把节点串起来并合并状态。C/D 是基础设施概念，与节点语义无关。',
  },
  {
    id: 'langgraph4j-01-graph-state-004',
    type: 'single',
    difficulty: 2,
    tags: ['compile'],
    stem: 'StateGraph 构建完成后必须 compile() 再执行，compile 做了什么？',
    options: [
      { key: 'A', text: '把 Java 代码编译成字节码' },
      { key: 'B', text: '校验图结构（节点/边/条件映射完整性）并生成可执行的 CompiledGraph，可附加 checkpoint 等运行配置' },
      { key: 'C', text: '启动数据库事务' },
      { key: 'D', text: '把图上传到模型服务' },
    ],
    answers: ['B'],
    explanation:
      'compile 是"构建期校验 + 运行时封装"：漏连的边、缺失的条件分支映射在这里暴露，CompiledGraph 提供 invoke/stream 与持久化配置。A 是 javac 的事；C/D 无关。',
  },
  {
    id: 'langgraph4j-01-graph-state-005',
    type: 'code',
    difficulty: 2,
    tags: ['条件边'],
    stem: '以下条件边配置，含义正确的是？\n\n~~~java\n.addEdgeConditional(\n    "agent",\n    state -> state.messages().get(state.messages().size()-1).hasToolCalls()\n              ? "tools" : "end",\n    Map.of("tools", "tools", "end", END))\n~~~',
    options: [
      { key: 'A', text: 'agent 节点执行后：若最后一条 AI 消息带工具调用则转向 tools 节点，否则结束流程' },
      { key: 'B', text: 'tools 节点执行后无条件回到 agent' },
      { key: 'C', text: '这是在定义 START 边' },
      { key: 'D', text: '该写法会在编译期报错，条件边不支持 Map 映射' },
    ],
    answers: ['A'],
    explanation:
      '条件边 = 路由函数（返回目标 key）+ key 到节点/END 的映射表，是 Agent 循环的关键一环。B/C 语义错位；D 与 LangGraph4j API 相反。',
  },
  {
    id: 'langgraph4j-01-graph-state-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['状态设计'],
    scenario:
      '新人把"用户输入、模型原始输出、工具返回、中间 JSON、调试日志"全部塞进图状态的不同字段。运行几次后调试极其困难：不知道哪次更新覆盖了哪个字段，序列化快照巨大。',
    stem: '最合理的状态设计原则是？',
    options: [
      { key: 'A', text: '状态字段越多越好，方便随时查' },
      { key: 'B', text: '状态只保留"流程推进所需的字段"（消息列表、关键中间结果、控制标记），调试信息走日志；明确每个字段的合并语义' },
      { key: 'C', text: '把所有字段都改成 AppenderChannel，永不覆盖' },
      { key: 'D', text: '干脆不用状态，节点间用静态变量传值' },
    ],
    answers: ['B'],
    explanation:
      '状态是图的"单一事实来源"，字段泛滥会让合并语义、快照成本、调试难度全面失控。C 让历史无限膨胀；D 的静态变量在并发/重放/持久化下全是坑。',
  },
  {
    id: 'langgraph4j-01-graph-state-007',
    type: 'multiple',
    difficulty: 2,
    tags: ['LangChain4j 整合'],
    stem: 'LangGraph4j 与 LangChain4j 的分工，正确的有？',
    options: [
      { key: 'A', text: 'LangChain4j 提供"原子能力"：模型调用、工具、记忆、检索' },
      { key: 'B', text: 'LangGraph4j 提供"编排能力"：把能力节点按图组织、控制流转与状态' },
      { key: 'C', text: '两者是完全竞争关系，只能二选一' },
      { key: 'D', text: '图中的节点内部完全可以调用 LangChain4j 的模型与工具' },
    ],
    answers: ['A', 'B', 'D'],
    explanation:
      '分层互补：能力层（LangChain4j）+ 编排层（LangGraph4j），节点内部调用能力层组件是标准用法。C 错误。',
  },
]
