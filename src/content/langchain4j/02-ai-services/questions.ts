import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'langchain4j-02-ai-services-001',
    type: 'single',
    difficulty: 1,
    tags: ['AI Services'],
    stem: 'LangChain4j 的 AI Services 声明式接口，其设计思想最接近以下哪种机制？',
    options: [
      { key: 'A', text: 'MyBatis 的 Mapper：定义接口与注解，框架动态代理实现' },
      { key: 'B', text: 'Servlet 容器' },
      { key: 'C', text: 'JNI 本地调用' },
      { key: 'D', text: 'Java 反射序列化' },
    ],
    answers: ['A'],
    explanation:
      '与 Mapper 一样：业务只写接口 + 注解（@SystemMessage/@UserMessage/@MemoryId），AiServices 在运行期生成代理，把模型、记忆、工具等组件装配进调用链。B/C/D 均无关。',
  },
  {
    id: 'langchain4j-02-ai-services-002',
    type: 'single',
    difficulty: 2,
    tags: ['Prompt 模板'],
    stem: '在 @UserMessage 中使用多参数模板，正确的方式是？',
    options: [
      { key: 'A', text: '用 {{paramName}} 占位，方法参数按名字注入' },
      { key: 'B', text: '用 %s 让框架自动格式化' },
      { key: 'C', text: '把参数拼在字符串里传入模板' },
      { key: 'D', text: 'LangChain4j 不支持多参数模板' },
    ],
    answers: ['A'],
    explanation:
      '模板变量用双花括号：@UserMessage("查一下{{city}}明天{{date}}的天气") 配合多参数方法，参数按名匹配；单参数可用默认变量 {{it}}。B 是 String.format 的习惯；C 绕开了模板机制。',
  },
  {
    id: 'langchain4j-02-ai-services-003',
    type: 'single',
    difficulty: 2,
    tags: ['结构化输出'],
    stem: 'AI Service 接口方法直接返回自定义 POJO（如 OrderInfo），框架内部做了什么？',
    options: [
      { key: 'A', text: '反射调用数据库填充对象' },
      { key: 'B', text: '在提示中注入 JSON 结构要求，模型返回后反序列化为 POJO，格式不符时自动纠错重试' },
      { key: 'C', text: '把模型输出原样返回，由调用方强转' },
      { key: 'D', text: '训练一个专属模型' },
    ],
    answers: ['B'],
    explanation:
      '框架把"目标类型"翻译成给模型的输出格式说明，拿到回复后 JSON 反序列化并校验，失败带错误信息重试——这是"结构化输出"的核心闭环。C 是没有框架时的原始做法。',
  },
  {
    id: 'langchain4j-02-ai-services-004',
    type: 'scenario',
    difficulty: 3,
    tags: ['记忆隔离'],
    scenario:
      '客服机器人上线后，用户 A 和用户 B 的对话互相"串台"：A 刚说过的地址出现在给 B 的回复里。代码用单例 Assistant，未做会话区分。',
    stem: '根因与修复是？',
    options: [
      { key: 'A', text: '模型并发能力不足，需要限流' },
      { key: 'B', text: '所有用户共享了同一个 ChatMemory；应使用 @MemoryId（memoryId 取用户/会话标识）+ chatMemoryProvider 为每个会话维护独立记忆' },
      { key: 'C', text: 'SystemMessage 太长，精简即可' },
      { key: 'D', text: '换流式接口就不会串台' },
    ],
    answers: ['B'],
    explanation:
      '记忆串台是"共享记忆池"事故：上下文里混入了别人的历史。@MemoryId 让框架按标识隔离记忆，每个会话一个窗口——这是多用户系统的必选项。C/D 与会话隔离无关。',
  },
  {
    id: 'langchain4j-02-ai-services-005',
    type: 'code',
    difficulty: 2,
    tags: ['Prompt 模板'],
    stem: '以下 AI Service 定义中，模板变量使用正确的是？\n\n~~~java\ninterface WeatherAssistant {\n    @UserMessage("今天{{city}}的最高温度是多少？请只回答数字。")\n    int maxTemp(String city);\n}\n~~~',
    options: [
      { key: 'A', text: '正确：方法参数名 city 与模板变量 {{city}} 匹配' },
      { key: 'B', text: '错误：模板变量只能用 {{it}}' },
      { key: 'C', text: '错误：返回值不能是 int，只能返回 String' },
      { key: 'D', text: '错误：必须再加 @SystemMessage 才能编译' },
    ],
    answers: ['A'],
    explanation:
      '多参数模板按参数名匹配（编译需保留参数名或使用注解指定）；单参数可简写为 {{it}}，并非只能用 {{it}}。C 恰恰相反——返回基本类型/POJO 正是 AI Services 的能力；D 非必需。',
  },
  {
    id: 'langchain4j-02-ai-services-006',
    type: 'single',
    difficulty: 3,
    tags: ['结构化输出'],
    stem: '结构化输出抽取"订单信息"时，模型经常把 `deliveryDate`（送达日期）与 `orderDate` 混淆。最有效的改进是？',
    options: [
      { key: 'A', text: '把 temperature 调到最高' },
      { key: 'B', text: '在 POJO 字段上补充语义描述（注释/描述传给模型），必要时给出 1~2 个输出示例，明确字段定义边界' },
      { key: 'C', text: '把字段名改成 a1、a2 简化输出' },
      { key: 'D', text: '放弃结构化输出，改回正则抽取' },
    ],
    answers: ['B'],
    explanation:
      '模型只看得到提示词：字段语义不清是混淆的根因，描述 + 示例（few-shot）是标准修法。A 让输出更随机，适得其反；C 让语义更模糊；D 是倒退，正则难以覆盖自然语言变体。',
  },
  {
    id: 'langchain4j-02-ai-services-007',
    type: 'multiple',
    difficulty: 2,
    tags: ['AI Services'],
    stem: '关于 AI Services 的能力边界，下列说法正确的有？',
    options: [
      { key: 'A', text: '可组合 ChatModel、ChatMemory、ContentRetriever、Tools 等组件' },
      { key: 'B', text: 'Spring Boot starter 下用 @AiService 即可注册为 Bean 注入使用' },
      { key: 'C', text: '接口方法返回类型支持 String、POJO、枚举等' },
      { key: 'D', text: 'AI Services 会自动为接口生成持久化代码' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'AI Services 是组装层：模型/记忆/检索/工具按需装配，@AiService 是 Spring 集成的入口；返回类型支持多种映射。D 荒谬——它不涉及数据库持久化。',
  },
]
