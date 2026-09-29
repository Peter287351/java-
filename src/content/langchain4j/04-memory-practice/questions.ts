import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'langchain4j-04-memory-practice-001',
    type: 'single',
    difficulty: 1,
    tags: ['ChatMemory'],
    stem: 'MessageWindowChatMemory 的"滑动窗口"语义是？',
    options: [
      { key: 'A', text: '只保留当前这条消息' },
      { key: 'B', text: '超过 maxMessages 时淘汰最早的消息，始终携带最近 N 条进上下文' },
      { key: 'C', text: '把所有历史压缩成摘要' },
      { key: 'D', text: '按时间每天清空一次' },
    ],
    answers: ['B'],
    explanation:
      '窗口记忆 = 固定条数 FIFO：新消息进、最老消息出，控制上下文长度。C 是"摘要记忆"策略（可作为进阶组合）；D 与机制无关。',
  },
  {
    id: 'langchain4j-04-memory-practice-002',
    type: 'single',
    difficulty: 2,
    tags: ['ChatMemory'],
    stem: '与 MessageWindowChatMemory（按条数）相比，TokenWindowChatMemory 的优势是？',
    options: [
      { key: 'A', text: '实现更简单' },
      { key: 'B', text: '直接按 Token 预算裁剪历史，不受"单条消息长度差异大"的干扰，成本控制更精确' },
      { key: 'C', text: '可以记住所有历史不淘汰' },
      { key: 'D', text: '支持跨用户共享记忆' },
    ],
    answers: ['B'],
    explanation:
      '按条数裁剪时，几条超长消息就可能撑爆窗口预算；按 Token 裁剪直接对齐计费与模型上限。C 与窗口语义矛盾；D 与窗口类型无关。',
  },
  {
    id: 'langchain4j-04-memory-practice-003',
    type: 'single',
    difficulty: 2,
    tags: ['记忆隔离'],
    stem: '多用户聊天系统中，为每个会话维护独立记忆的正确姿势是？',
    options: [
      { key: 'A', text: '所有用户共用一个 ChatMemory 实例，性能最好' },
      { key: 'B', text: '配置 chatMemoryProvider，按 memoryId（用户/会话标识）惰性创建各自的记忆实例' },
      { key: 'C', text: '把每个用户的记忆序列化后存在浏览器里' },
      { key: 'D', text: '每轮对话新建一个 Assistant 对象' },
    ],
    answers: ['B'],
    explanation:
      'chatMemoryProvider(memoryId -> ...) 是框架提供的隔离入口：按需创建、按会话独立。A 就是串台事故；C 存储在客户端既不可靠也不安全；D 无法保留历史。',
  },
  {
    id: 'langchain4j-04-memory-practice-004',
    type: 'single',
    difficulty: 3,
    tags: ['工程实践'],
    stem: 'LLM 应用多实例部署后，发现同一用户的对话历史时有时无。最可能的原因与对策是？',
    options: [
      { key: 'A', text: '模型随机性导致，调低 temperature' },
      { key: 'B', text: '记忆存在实例内存（InMemoryStore）里，负载均衡把请求分到不同实例；应把 ChatMemory 持久化到共享存储（Redis/DB）' },
      { key: 'C', text: '前端没有传 sessionId，改用 IP 区分' },
      { key: 'D', text: '窗口太小，调到 1000 条' },
    ],
    answers: ['B'],
    explanation:
      '"换一个实例历史就丢"是典型的本地状态上生产问题；记忆必须外置到共享存储，并提供过期清理策略。A 与"时有时无"的实例相关性不符；C 用 IP 区分用户不可靠；D 治标且成本爆炸。',
  },
  {
    id: 'langchain4j-04-memory-practice-005',
    type: 'single',
    difficulty: 2,
    tags: ['流式输出'],
    stem: 'Web 聊天场景把 StreamingChatModel 的输出推送给浏览器，常用技术是？',
    options: [
      { key: 'A', text: '轮询数据库' },
      { key: 'B', text: 'SSE（text/event-stream）：服务端单向持续推送增量文本，前端打字机渲染' },
      { key: 'C', text: '把全文压缩后一次性传输' },
      { key: 'D', text: 'WebSocket 双向通道是唯一选择' },
    ],
    answers: ['B'],
    explanation:
      'LLM 生成是服务端到前端的单向流，SSE 轻量且自动重连，是主流选择；WebSocket 功能更强但对"只要下行"的场景是过度设计。A 延迟与负载都差；C 失去流式意义。',
  },
  {
    id: 'langchain4j-04-memory-practice-006',
    type: 'multiple',
    difficulty: 3,
    tags: ['成本控制'],
    stem: 'LLM 应用月账单超预算，下列措施有效的有？',
    options: [
      { key: 'A', text: '精简 System Prompt 与历史窗口，减少每请求的输入 Token' },
      { key: 'B', text: '按任务分级用模型：FAQ 类走便宜小模型，复杂推理才走旗舰模型' },
      { key: 'C', text: '对相同/相似问题做缓存（含语义缓存）' },
      { key: 'D', text: '把重试次数从 3 调到 30，确保成功率' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A/B/C 是成本优化标准组合。D 危险——无脑重试在持续失败时把错误请求放大 10 倍计费，重试要有退避与上限。',
  },
  {
    id: 'langchain4j-04-memory-practice-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['超时', '流式'],
    scenario:
      '聊天接口偶发 504。日志显示：模型服务偶发超时（P99 约 40s），应用侧 HTTP 读超时设了 30s；网关超时 60s。用户侧表现为"转圈到网关超时"。',
    stem: '处置组合最合理的是？',
    options: [
      { key: 'A', text: '应用读超时改大到 10 分钟，等模型慢慢返回' },
      { key: 'B', text: '聊天走流式（SSE，首包即有响应不会撞网关超时）；后台任务设置合理超时 + 失败重试（带退避），并对模型调用做熔断降级（如返回兜底话术）' },
      { key: 'C', text: '把网关超时调成 30 分钟' },
      { key: 'D', text: '模型服务偶发超时无法避免，忽略即可' },
    ],
    answers: ['B'],
    explanation:
      '超时链路要分层治理：交互场景用流式从根本上避免"长等一个完整响应"；非交互场景设有限超时 + 退避重试 + 熔断降级，保证故障时用户有反馈。A/C 把超时无限放大，资源被长时间占死；D 放弃可观测与兜底，不可接受。',
  },
]
