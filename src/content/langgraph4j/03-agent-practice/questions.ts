import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'langgraph4j-03-agent-practice-001',
    type: 'single',
    difficulty: 2,
    tags: ['ReAct'],
    stem: 'ReAct 模式中"Act（行动）"一步具体指什么？',
    options: [
      { key: 'A', text: '模型生成最终自然语言答案' },
      { key: 'B', text: '模型发出工具调用请求，由框架执行工具并把观察结果写回状态' },
      { key: 'C', text: '人工审批操作' },
      { key: 'D', text: '重新训练模型' },
    ],
    answers: ['B'],
    explanation:
      'ReAct 循环 = Reason（推理决定下一步）→ Act（发出工具调用、框架执行）→ Observe（结果进状态）→ 再 Reason……直到推理出"无需工具"给出答案。A 是循环结束后的产出；C/D 与 ReAct 定义无关。',
  },
  {
    id: 'langgraph4j-03-agent-practice-002',
    type: 'single',
    difficulty: 2,
    tags: ['多Agent'],
    stem: '主管（Supervisor）多 Agent 模式的核心机制是？',
    options: [
      { key: 'A', text: '所有子 Agent 抢锁执行' },
      { key: 'B', text: '主管 Agent（或路由节点）根据当前任务把控制权分派给合适的子 Agent，收集其结构化结果再决定下一步' },
      { key: 'C', text: '每个子 Agent 直接对外提供服务' },
      { key: 'D', text: '主管负责训练子 Agent' },
    ],
    answers: ['B'],
    explanation:
      '主管模式 = "路由 + 汇总"：条件边按任务把流转给子 Agent（各自是带专属工具的子图），结果结构化回写状态，主管决定继续分派或收束。A/C/D 均不符合该模式。',
  },
  {
    id: 'langgraph4j-03-agent-practice-003',
    type: 'scenario',
    difficulty: 3,
    tags: ['多Agent', '路由'],
    scenario:
      '一个客服 Agent 挂了 25 个工具：查单、退款、改地址、物流、发票、补偿……模型经常选错工具或漏调。',
    stem: '改造方案最合理的是？',
    options: [
      { key: 'A', text: '工具越多能力越强，保持现状，多写几条系统提示' },
      { key: 'B', text: '按领域拆成多个子 Agent（订单、物流、售后），各持少量工具，由主管路由；每次调用只暴露与当前领域相关的工具子集' },
      { key: 'C', text: '把 25 个工具合并成一个参数超多的工具' },
      { key: 'D', text: '把 temperature 调到 0' },
    ],
    answers: ['B'],
    explanation:
      '工具数量与选择准确率负相关、上下文互相干扰——"分而治之 + 主管路由"是标准解法，每个子 Agent 的小工具集描述也更聚焦。A 是方向性错误；C 会让参数语义爆炸更难选对；D 不解决工具集过大的结构问题。',
  },
  {
    id: 'langgraph4j-03-agent-practice-004',
    type: 'single',
    difficulty: 3,
    tags: ['生产落地'],
    stem: 'Agent 图上生产前，下列哪组"保险丝"最必要？',
    options: [
      { key: 'A', text: '迭代上限、节点超时、单次运行成本核算、敏感操作人工审批' },
      { key: 'B', text: '只要提示词写得好，不需要任何保险丝' },
      { key: 'C', text: '把模型输出全部人工复核后再继续' },
      { key: 'D', text: '关闭所有日志以提升性能' },
    ],
    answers: ['A'],
    explanation:
      '模型行为是概率性的，生产必须用结构性护栏兜底：上限防死循环、超时防挂死、成本核算防烧钱、审批防高危。B 是侥幸心理；C 对低风险操作过度保守；D 自断可观测性。',
  },
  {
    id: 'langgraph4j-03-agent-practice-005',
    type: 'single',
    difficulty: 3,
    tags: ['调试'],
    stem: '图执行结果不符合预期时，推荐的调试顺序是？',
    options: [
      { key: 'A', text: '直接重写系统提示词碰运气' },
      { key: 'B', text: '先看图的路由是否走了预期节点（条件边/状态标记），再看节点的输入状态与工具结果，最后才是模型生成的提示词调整' },
      { key: 'C', text: '删除所有 checkpoint 重跑 100 次' },
      { key: 'D', text: '把所有节点并行执行看哪个对' },
    ],
    answers: ['B'],
    explanation:
      '图应用是"控制流 × 模型"两层：先确定控制流走对（路由、状态），再查数据流（节点输入输出、工具返回），最后才调提示词——顺序反了会瞎调。A 是玄学；C/D 破坏执行语义。',
  },
  {
    id: 'langgraph4j-03-agent-practice-006',
    type: 'multiple',
    difficulty: 3,
    tags: ['反模式'],
    stem: '下列属于 Agent 图设计反模式的有？',
    options: [
      { key: 'A', text: '一个图几十个节点、无人能画出完整拓扑' },
      { key: 'B', text: '状态字段与业务字段、调试字段混放且合并语义不明' },
      { key: 'C', text: '子 Agent 交接内容无结构，靠主管模型自由理解' },
      { key: 'D', text: '把高频复用流程抽成子图并测试' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A/B/C 都是失控信号：不可理解、不可调试、不可靠交接。D 恰恰是推荐做法（复用 + 测试），不是反模式。',
  },
  {
    id: 'langgraph4j-03-agent-practice-007',
    type: 'single',
    difficulty: 3,
    tags: ['选型'],
    stem: '下列需求中，最适合用"确定性硬编码图 + 少量模型节点"而非全 ReAct 自主循环的是？',
    options: [
      { key: 'A', text: '开放域研究助手，任务路径不可预知' },
      { key: 'B', text: '报销审批流：步骤固定（提交→合规校验→主管审批→打款），仅在校验节点用模型判断票据描述' },
      { key: 'C', text: '未知领域的探索式问题求解' },
      { key: 'D', text: '需要模型自主决定调用哪个 API 的通用助理' },
    ],
    answers: ['B'],
    explanation:
      '流程可枚举、步骤有合规要求 → 硬编码图保证可控可审计，模型只在模糊判断点出场；A/C/D 是探索型任务，ReAct 循环更合适。选型的核心是"控制权交给谁"。',
  },
]
