import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'langgraph4j-02-flow-control-001',
    type: 'single',
    difficulty: 2,
    tags: ['条件边'],
    stem: '实现"根据用户意图路由到不同处理节点"，LangGraph4j 中的标准做法是？',
    options: [
      { key: 'A', text: '在每个节点内部 if-else 直接调用其他节点的方法' },
      { key: 'B', text: '在分支点节点上配置条件边：路由函数读取状态返回目标 key，映射到对应节点' },
      { key: 'C', text: '为每种意图部署一个独立应用' },
      { key: 'D', text: '用 try-catch 控制流转' },
    ],
    answers: ['B'],
    explanation:
      '控制流显式化在图的边上是核心理念：路由函数 + 映射表让分支一目了然、可视化、可测试。A 的节点互调绕过图控制，回环与状态合并都会失序；C/D 均非机制内做法。',
  },
  {
    id: 'langgraph4j-02-flow-control-002',
    type: 'single',
    difficulty: 2,
    tags: ['循环'],
    stem: 'ReAct 图（agent ⇄ tools 循环）中，tools 节点执行完之后应该连向哪里？',
    options: [
      { key: 'A', text: '直接 END，工具结果就是最终答案' },
      { key: 'B', text: '回到 agent 节点：让模型基于工具结果决定继续调用工具还是给出最终回答' },
      { key: 'C', text: '固定连向下一个业务节点' },
      { key: 'D', text: '必须连回 START 重新开始' },
    ],
    answers: ['B'],
    explanation:
      'ReAct 的循环本质：agent 产生工具调用 → tools 执行 → 结果回填状态 → agent 再思考，直到某轮不再产生工具调用（条件边转 END）。A 会丢掉"基于结果的综合回答"；C/D 破坏循环结构。',
  },
  {
    id: 'langgraph4j-02-flow-control-003',
    type: 'single',
    difficulty: 3,
    tags: ['死循环'],
    stem: 'Agent 图上线后偶发"模型反复调用同一个失败工具直到超时烧钱"。除了提示词改进，图层面最直接的防护是？',
    options: [
      { key: 'A', text: '在状态里加迭代计数，条件边超过上限（如 5 轮）强制走 END 或降级节点' },
      { key: 'B', text: '把 temperature 调低' },
      { key: 'C', text: '删掉失败的工具' },
      { key: 'D', text: '把图编译两次' },
    ],
    answers: ['A'],
    explanation:
      '"硬上限"是与提示词无关的结构性保险：模型行为不可 100% 保证，控制流必须兜底（上限 + 超时 + 成本核算）。B 对失败重试倾向无可靠影响；C 因噎废食；D 无意义。',
  },
  {
    id: 'langgraph4j-02-flow-control-004',
    type: 'single',
    difficulty: 2,
    tags: ['fan-out'],
    stem: '需要"同一份用户问题同时交给摘要节点与情感分析节点并行处理，结果汇合后生成报告"，图中对应的机制是？',
    options: [
      { key: 'A', text: '顺序执行两次同一节点' },
      { key: 'B', text: 'fan-out：分支点把流转给多个并行节点，fan-in 汇聚合并各自的状态更新' },
      { key: 'C', text: '起两个线程在节点外自己跑' },
      { key: 'D', text: '图不支持并行，只能串行' },
    ],
    answers: ['B'],
    explanation:
      '图的分支/汇聚（fan-out/fan-in）正是并行编排的表达方式，汇合点的状态合并由 Channel/Reducer 定义。C 绕过图失去状态管理与追踪；D 与事实相反。',
  },
  {
    id: 'langgraph4j-02-flow-control-005',
    type: 'scenario',
    difficulty: 3,
    tags: ['中断', 'checkpoint'],
    scenario:
      '转账 Agent：模型可调用 transfer 工具。产品要求"单笔超过 1000 元必须人工审批，审批通过才执行；审批可能隔天才完成"。当前实现每次请求都在内存里跑完整张图。',
    stem: '改造方案正确的是？',
    options: [
      { key: 'A', text: '在流程中加 sleep 循环轮询审批结果' },
      { key: 'B', text: '在执行前加 interrupt 中断并配合 checkpoint 持久化状态；审批完成后携带人工决定恢复执行，跨天/重启都可续跑' },
      { key: 'C', text: '超过 1000 元一律拒绝，不做审批' },
      { key: 'D', text: '把审批交给模型自己判断金额是否可信' },
    ],
    answers: ['B'],
    explanation:
      'human-in-the-loop 的标配 = interrupt（暂停）+ checkpoint（状态持久化）+ 恢复（注入人工输入续跑），天然支持"隔天审批"。A 占线程轮询不可扩展；C 砍需求；D 让模型做风控决定，责任错位。',
  },
  {
    id: 'langgraph4j-02-flow-control-006',
    type: 'single',
    difficulty: 3,
    tags: ['checkpoint'],
    stem: 'checkpoint（检查点）在 LangGraph4j 中的作用是？',
    options: [
      { key: 'A', text: '压缩模型输出体积' },
      { key: 'B', text: '在每个执行步骤后持久化状态快照，支持故障恢复、时间旅行调试与中断后继续' },
      { key: 'C', text: '校验模型返回的 JSON 格式' },
      { key: 'D', text: '自动扩容线程池' },
    ],
    answers: ['B'],
    explanation:
      'checkpoint 把"执行到哪一步、状态是什么"存下来：服务重启可续跑、人工介入后可恢复、还能回看历史状态排查问题。A/C/D 均非其职责。',
  },
  {
    id: 'langgraph4j-02-flow-control-007',
    type: 'single',
    difficulty: 2,
    tags: ['子图'],
    stem: '多个业务流程都要复用"身份核验"这一段逻辑，LangGraph4j 中合适的做法是？',
    options: [
      { key: 'A', text: '把核验逻辑复制到每个图里' },
      { key: 'B', text: '把核验做成子图（subgraph）作为节点嵌入各流程，状态接口保持一致' },
      { key: 'C', text: '用注释标记复用' },
      { key: 'D', text: '写成全局静态变量判断' },
    ],
    answers: ['B'],
    explanation:
      '子图是图级别的"函数抽取"：独立开发、测试、可视化，嵌入父图即复用。A 是复制粘贴地狱；C/D 均不是机制内方案。',
  },
  {
    id: 'langgraph4j-02-flow-control-008',
    type: 'code',
    difficulty: 2,
    tags: ['循环'],
    stem: '要让"agent ⇄ tools"的循环在"模型不再发起工具调用"时结束，正确的边配置组合是？\n\n~~~java\n.addEdge(START, "agent")\n.addConditionalEdges("agent", route, Map.of("tools", "tools", "end", END))\n.addEdge("tools", "agent")   // ①\n~~~\nroute 判断最后一条消息是否含工具调用。',
    options: [
      { key: 'A', text: '正确：agent 条件边决定去 tools 或结束，tools 固定回到 agent 形成闭环，终点由条件边控制' },
      { key: 'B', text: '错误：tools 必须连 END，否则死循环' },
      { key: 'C', text: '错误：一个图最多只能有一条边' },
      { key: 'D', text: '错误：END 必须连向 START' },
    ],
    answers: ['A'],
    explanation:
      '这正是 Agent 循环的标准拓扑：环的存在由条件边的"end 分支"保证可退出。B 把循环掐死；C/D 均为臆造限制。',
  },
]
