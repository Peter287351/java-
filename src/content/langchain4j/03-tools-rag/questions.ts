import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'langchain4j-03-tools-rag-001',
    type: 'single',
    difficulty: 1,
    tags: ['Tools'],
    stem: '模型调用 @Tool 方法时，真正执行该方法的是？',
    options: [
      { key: 'A', text: '大模型在云端执行后返回结果' },
      { key: 'B', text: 'LangChain4j 框架在本地 JVM 中执行你的方法，再把结果回填给模型' },
      { key: 'C', text: '数据库触发器执行' },
      { key: 'D', text: '前端浏览器执行' },
    ],
    answers: ['B'],
    explanation:
      '函数调用的分工：模型只输出"要调用哪个工具 + 参数"，执行发生在本地（框架反射调用 @Tool 方法），结果作为消息回填后模型继续生成——模型永远不碰你的系统。',
  },
  {
    id: 'langchain4j-03-tools-rag-002',
    type: 'single',
    difficulty: 2,
    tags: ['Tools'],
    stem: '注册了 5 个 @Tool 后，模型经常"该调用时不调用、参数抽取错误"。优先改进的是？',
    options: [
      { key: 'A', text: '把 temperature 调到 0' },
      { key: 'B', text: '重写工具与参数的描述：说清"什么时候用这个工具、每个参数的含义与格式"，描述是模型选工具的唯一依据' },
      { key: 'C', text: '把 5 个工具合并成 1 个万能工具' },
      { key: 'D', text: '换更大的 Embedding 模型' },
    ],
    answers: ['B'],
    explanation:
      '工具选择的依据是提示中的工具清单与描述——描述含糊、参数语义不明是"不调用/乱调用"的头号原因。A 只影响生成随机性；C 降低语义清晰度，方向相反；D 属于 RAG 组件，与工具调用无关。',
  },
  {
    id: 'langchain4j-03-tools-rag-003',
    type: 'single',
    difficulty: 1,
    tags: ['RAG', 'Embedding'],
    stem: 'RAG 流程中，把文本变成向量的组件是？',
    options: [
      { key: 'A', text: 'ChatModel' },
      { key: 'B', text: 'EmbeddingModel' },
      { key: 'C', text: 'ChatMemory' },
      { key: 'D', text: 'DocumentSplitter 只负责切分，不做向量化' },
    ],
    answers: ['B'],
    explanation:
      'EmbeddingModel 把文本映射为语义向量，写入 EmbeddingStore；检索时对用户问题做同样向量化后算相似度。A 负责生成；C 负责对话历史；D 描述正确但它不是"变成向量"的组件——题目问的正是向量化者。',
  },
  {
    id: 'langchain4j-03-tools-rag-004',
    type: 'single',
    difficulty: 2,
    tags: ['RAG'],
    stem: '企业知识库问答中，"检索阶段"的核心目标是什么？',
    options: [
      { key: 'A', text: '把库里所有文档都塞进上下文' },
      { key: 'B', text: '用最小数量的高相关片段覆盖问题所需信息，控制 Token 同时保证召回质量' },
      { key: 'C', text: '返回文档的完整 URL 让用户自己查' },
      { key: 'D', text: '把用户问题翻译成英文再检索' },
    ],
    answers: ['B'],
    explanation:
      '上下文窗口有限且噪声片段会误导生成：检索要在 topK、相似度阈值之间平衡"召回"与"精度"，必要时重排。A 会爆 Token 且稀释关键信息；C 不是 RAG；D 与检索目标无关。',
  },
  {
    id: 'langchain4j-03-tools-rag-005',
    type: 'scenario',
    difficulty: 3,
    tags: ['RAG', '切分'],
    scenario:
      '知识库 RAG 上线后答非所问。排查发现：PDF 按固定 200 字符硬切，表格被拦腰截断，且用户问题口语化（"那个退货的钱多久到账"）而文档写的是"退款时效：3 个工作日"。',
    stem: '改进优先级最合理的是？',
    options: [
      { key: 'A', text: '直接换更大的 ChatModel' },
      { key: 'B', text: '先修检索：按语义边界/结构切分保护表格完整，检索前对口语问题做改写或加同义描述，再评估 topK 与阈值' },
      { key: 'C', text: '把 topK 从 4 调到 50，多塞内容总没错' },
      { key: 'D', text: '把所有文档重新 OCR 一遍' },
    ],
    answers: ['B'],
    explanation:
      '"答非所问"多数败在检索层：切分破坏语义 + 口语与书面语词汇不匹配导致召回失败——先修切分与查询改写。A 生成的确更强，但喂不进对的片段，白搭；C 引入大量噪声稀释关键片段，还爆 Token；D 与症状无必然关系。',
  },
  {
    id: 'langchain4j-03-tools-rag-006',
    type: 'code',
    difficulty: 2,
    tags: ['Tools'],
    stem: '下列 @Tool 定义，最可能让模型"正确调用"的是？\n\n~~~java\nclass Tools {\n    @Tool("查询指定城市的当前天气")\n    String weather(@P("城市名，如：上海") String city) {\n        return weatherService.get(city);\n    }\n}\n~~~',
    options: [
      { key: 'A', text: '写法正确：工具描述说清用途，参数描述说清取值示例' },
      { key: 'B', text: '错误：@Tool 注解不能有描述参数' },
      { key: 'C', text: '错误：@P 只能加在 int 类型上' },
      { key: 'D', text: '错误：工具方法必须返回 int' },
    ],
    answers: ['A'],
    explanation:
      '@Tool 的 description 说明"何时用"，@P 说明参数含义与格式——描述质量决定调用准确率。B/C/D 均不符合 LangChain4j 的工具 API 事实。',
  },
  {
    id: 'langchain4j-03-tools-rag-007',
    type: 'multiple',
    difficulty: 3,
    tags: ['RAG', '工程实践'],
    stem: '关于 RAG 工程化，下列做法合理的有？',
    options: [
      { key: 'A', text: '文档更新后重建/增量更新向量库，而不是只更新一次' },
      { key: 'B', text: '检索结果附带来源引用，便于人工核验与追溯' },
      { key: 'C', text: '用真实用户问题集做离线评估（命中率、答案质量），再上线' },
      { key: 'D', text: '嵌入模型换版本时无需重新向量化历史文档' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A/B/C 是 RAG 运维三件套：数据新鲜度、可追溯、可评估。D 错误——不同嵌入模型的向量空间不兼容，换模型必须全量重嵌入。',
  },
  {
    id: 'langchain4j-03-tools-rag-008',
    type: 'scenario',
    difficulty: 3,
    tags: ['工具安全', '人工确认'],
    scenario:
      'Agent 挂了 sendEmail 群发工具用于"给客户发活动通知"。灰度测试发现：用户输入模糊指令（"帮我通知一下大家"）时，模型经常自行选择工具、拉全量名单直接群发，引发投诉。',
    stem: '对工具权限的治理方案，最合理的是？',
    options: [
      { key: 'A', text: '高危工具（发送/支付/删除）加人工确认闸口（如 LangGraph4j 的 interrupt 审批）+ 收件人白名单与频次上限 + 工具描述写清适用边界，指令不明确时先反问澄清再执行' },
      { key: 'B', text: '把 sendEmail 工具直接下线，改回人工发送' },
      { key: 'C', text: '把 temperature 调低，模型行为更确定就不会乱发邮件了' },
      { key: 'D', text: '在 System Message 里写一句"未经确认不要发邮件"即可，模型会严格遵守' },
    ],
    answers: ['A'],
    explanation:
      '模型是概率系统，"文字约束"不能当安全边界：高危动作必须有结构性闸口——人工确认（interrupt）、白名单/频控（工程硬限制）、描述边界（提高选择准确率）、澄清追问（消歧）。B 一刀切放弃自动化收益；C 只影响生成随机性，不改变"模型有权直接执行"的架构问题；D 把安全寄托在提示词遵从上，正是此类事故的常见根因。',
  },
]
