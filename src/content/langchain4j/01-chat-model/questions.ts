import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'langchain4j-01-chat-model-001',
    type: 'single',
    difficulty: 1,
    tags: ['ChatModel'],
    stem: 'LangChain4j 中，希望在网页聊天场景边生成边显示，应使用哪个接口？',
    options: [
      { key: 'A', text: 'ChatModel，阻塞直到全文返回' },
      { key: 'B', text: 'StreamingChatModel，通过监听器逐段接收增量文本' },
      { key: 'C', text: 'EmbeddingModel' },
      { key: 'D', text: 'ChatMemory' },
    ],
    answers: ['B'],
    explanation:
      '流式场景用 StreamingChatModel：onPartialResponse 回调逐段推送，前端配合 SSE 实现打字机效果，首字延迟显著低于阻塞式。C 是向量化模型；D 是记忆组件，与流式无关。',
  },
  {
    id: 'langchain4j-01-chat-model-002',
    type: 'single',
    difficulty: 1,
    tags: ['消息类型'],
    stem: '要让模型始终"扮演客服、只回答售后问题"，这段全局指令应该放在哪种消息里？',
    options: [
      { key: 'A', text: 'SystemMessage' },
      { key: 'B', text: 'UserMessage' },
      { key: 'C', text: 'AiMessage' },
      { key: 'D', text: 'ToolExecutionResultMessage' },
    ],
    answers: ['A'],
    explanation:
      'SystemMessage 承载人设、规则与边界，每轮对话都置于上下文最前；UserMessage 是用户输入；AiMessage 是模型历史回复；ToolExecutionResultMessage 是工具结果回填。',
  },
  {
    id: 'langchain4j-01-chat-model-003',
    type: 'single',
    difficulty: 2,
    tags: ['模型接入'],
    stem: '公司要接入一个"OpenAI 协议兼容"的国产大模型，LangChain4j 侧的关键配置是？',
    options: [
      { key: 'A', text: '只能使用该厂商官方 SDK，LangChain4j 无法接入' },
      { key: 'B', text: '使用 OpenAI 兼容客户端，替换 baseUrl 指向厂商端点 + 填 apiKey 与 modelName 即可' },
      { key: 'C', text: '必须重写 ChatModel 接口' },
      { key: 'D', text: '把模型下载到本地再调用' },
    ],
    answers: ['B'],
    explanation:
      'OpenAI 协议已成事实标准，换端点即换模型是 LangChain4j 抽象层的价值：业务代码零改动。C 违背框架初衷；D 与 API 调用无关。',
  },
  {
    id: 'langchain4j-01-chat-model-004',
    type: 'single',
    difficulty: 2,
    tags: ['参数'],
    stem: '做"从合同文本中抽取金额"的功能，输出必须是稳定、可解析的固定格式。temperature 应如何设置？',
    options: [
      { key: 'A', text: '调到最高，模型更聪明' },
      { key: 'B', text: '设为 0 或接近 0，降低随机性，保证抽取结果稳定可解析' },
      { key: 'C', text: 'temperature 只影响速度，与结果无关' },
      { key: 'D', text: 'temperature 只在流式输出时有效' },
    ],
    answers: ['B'],
    explanation:
      'temperature 控制采样随机性：抽取/分类/结构化输出等"要确定性"的任务用低温度，创意写作才用高温度。C/D 均为误解。',
  },
  {
    id: 'langchain4j-01-chat-model-005',
    type: 'single',
    difficulty: 2,
    tags: ['Token'],
    stem: '关于 Token 与成本，下列说法正确的是？',
    options: [
      { key: 'A', text: '计费只按模型返回的输出长度算' },
      { key: 'B', text: '输入（含 System Prompt 与历史消息）和输出都计费，长 System Prompt 会随每次请求重复计费' },
      { key: 'C', text: 'Token 数与中文字数一一对应' },
      { key: 'D', text: '流式输出比阻塞输出更省钱' },
    ],
    answers: ['B'],
    explanation:
      '每次请求的 prompt（系统提示+历史+用户输入）与 completion 都计入 Token；固定长提示 × 高 QPS 是账单大头，需精简或缓存（提示缓存）。C 中文约 1 字 ≈ 1~2 Token，并非一一对应；D 与计费无关。',
  },
  {
    id: 'langchain4j-01-chat-model-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['记忆', '无状态'],
    scenario:
      '聊天机器人上线一周，用户反馈"聊了两句它就忘了前面说的"。代码里每轮只把最新的用户输入发给 ChatModel，历史消息没有保存。',
    stem: '解释与修复正确的是？',
    options: [
      { key: 'A', text: '模型能力不足，换更大的模型' },
      { key: 'B', text: '模型 API 是无状态的："记住上文"靠客户端在每轮请求中携带历史消息；应接入 ChatMemory（如按 memoryId 存 MessageWindowChatMemory）自动维护上下文' },
      { key: 'C', text: '把用户输入全部拼成一段话重发即可，不需要记忆组件' },
      { key: 'D', text: '调大 temperature 能改善记忆' },
    ],
    answers: ['B'],
    explanation:
      '"无记忆"是 API 无状态的本质，不是模型能力问题；LangChain4j 的 ChatMemory 按会话维护历史并自动随请求发送，还能按窗口裁剪控制 Token。C 是手工方案的原型，但没有裁剪与隔离机制，工程上应使用现成组件；D 无关。',
  },
  {
    id: 'langchain4j-01-chat-model-007',
    type: 'multiple',
    difficulty: 2,
    tags: ['工程实践'],
    stem: 'LLM 应用工程化上线，下列做法合理的有？',
    options: [
      { key: 'A', text: '设置请求超时与重试（含退避），应对限流与偶发超时' },
      { key: 'B', text: '记录每次调用的模型、Token 用量与耗时，便于成本核算与排查' },
      { key: 'C', text: 'apiKey 通过环境变量/密钥管理注入，不入代码库' },
      { key: 'D', text: '对模型输出直接信任并入库，无需任何校验' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A/B/C 是基本工程素养：限流重试、可观测、密钥安全。D 错误——模型输出存在幻觉与格式漂移，入库前必须校验/约束（结构化输出、人工审核等）。',
  },
  {
    id: 'langchain4j-01-chat-model-008',
    type: 'scenario',
    difficulty: 2,
    tags: ['幻觉治理'],
    scenario:
      '客服机器人偶尔"一本正经地编造"不存在的退款政策（幻觉），已经引发两起客诉。团队开会讨论治理方案，有人提议"换最大的模型"、有人提议"temperature 拉满让它更聪明"。',
    stem: '下列治理组合最合理的是？',
    options: [
      { key: 'A', text: 'System Message 严格限定"只依据知识库回答、无依据时明确说不知道" + RAG 提供依据片段 + 关键答案附引用来源，重要场景（金额/政策）保留人工审核兜底' },
      { key: 'B', text: 'temperature 调到最高，让模型输出更聪明、更少犯错' },
      { key: 'C', text: '换成参数量最大的旗舰模型，即可根除幻觉' },
      { key: 'D', text: '把 ChatMemory 窗口调到最大，模型记住更多历史就不会编造' },
    ],
    answers: ['A'],
    explanation:
      '幻觉源于模型按概率"补全"，无法根除只能治理：约束（明确的拒答边界）+ 事实注入（RAG 让模型"有据可依"）+ 可追溯（引用来源便于人工核验）+ 高风险兜底，是工程上的标准组合。B 方向完全相反——高温度增加随机性、更易编造；C 换大模型能降低但不消除幻觉，成本还高数倍；D 与"编造政策"无关——它缺的是事实依据，不是对话记忆。',
  },
]
