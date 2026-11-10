import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'microservices-04-resilience-001',
    type: 'single',
    difficulty: 1,
    tags: ['熔断'],
    stem: `熔断器「打开」之后，请求通常会？`,
    options: [
      { key: 'A', text: '继续全部转发给故障下游' },
      { key: 'B', text: '直接走降级逻辑，一段时间后进入半开状态试探恢复' },
      { key: 'C', text: '自动重启下游服务' },
      { key: 'D', text: '被永久丢弃且不再恢复' },
    ],
    answers: ['B'],
    explanation: `打开状态避免继续冲击故障依赖，经过等待窗口后放少量请求试探，成功则闭合。A 失去保护意义，C 不是熔断器职责，D 忽略了半开恢复机制。`,
  },
  {
    id: 'microservices-04-resilience-002',
    type: 'single',
    difficulty: 1,
    tags: ['限流'],
    stem: `限流主要用来解决什么问题？`,
    options: [
      { key: 'A', text: '控制单位时间进入系统的请求量，防止突发流量压垮服务' },
      { key: 'B', text: '加速数据库索引查询' },
      { key: 'C', text: '压缩网络传输内容' },
      { key: 'D', text: '自动生成接口文档' },
    ],
    answers: ['A'],
    explanation: `限流是自我保护手段，常见算法有令牌桶、漏桶、滑动窗口计数。B、C、D 分别属于索引、压缩与文档工具。`,
  },
  {
    id: 'microservices-04-resilience-003',
    type: 'single',
    difficulty: 2,
    tags: ['降级'],
    stem: `关于降级逻辑，最需要避免的是？`,
    options: [
      { key: 'A', text: '返回缓存值或友好提示' },
      { key: 'B', text: '返回空列表并标记数据可能不完整' },
      { key: 'C', text: '降级里再次调用同一个已经故障的下游' },
      { key: 'D', text: '在日志里记录降级事件便于告警' },
    ],
    answers: ['C'],
    explanation: `降级必须自给自足；若仍依赖故障依赖，等于没有降级，还会放大调用量。A、B、D 都是合理做法。`,
  },
  {
    id: 'microservices-04-resilience-004',
    type: 'single',
    difficulty: 2,
    tags: ['配置中心'],
    stem: `Spring Cloud 里让 Bean 在配置变更后重新加载，常用？`,
    options: [
      { key: 'A', text: '@RefreshScope' },
      { key: 'B', text: '@Deprecated' },
      { key: 'C', text: '@Transactional' },
      { key: 'D', text: '@Scheduled' },
    ],
    answers: ['A'],
    explanation: `@RefreshScope 让 Bean 在刷新事件后重建，从而拿到新配置。B 标记过时，C 管事务，D 是定时任务。`,
  },
  {
    id: 'microservices-04-resilience-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['链路追踪'],
    stem: `关于链路追踪，说法正确的有哪些？`,
    options: [
      { key: 'A', text: 'traceId 用于把一次请求跨服务的日志串起来' },
      { key: 'B', text: 'span 描述链路中的一段调用及其耗时' },
      { key: 'C', text: '异步线程与 MQ 消费端也需要透传上下文，否则链路会断' },
      { key: 'D', text: '只要打印了日志就不需要 traceId' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 是可观测性的基本常识。D 错：并发日志交织在一起，没有 traceId 无法区分哪些属于同一次请求。`,
  },
  {
    id: 'microservices-04-resilience-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['雪崩'],
    scenario: `支付服务依赖的风控接口超时率飙升，网关线程大量阻塞在等待风控响应上，连不依赖风控的查询接口也开始超时。`,
    stem: `最能防止这类「一个依赖拖垮全局」的措施是？`,
    options: [
      { key: 'A', text: '给所有接口统一加大超时时间' },
      { key: 'B', text: '对该依赖做线程池/信号量隔离 + 超时 + 熔断降级，限制它可占用的资源' },
      { key: 'C', text: '把风控调用改成重试 5 次' },
      { key: 'D', text: '把日志级别调成 DEBUG 观察' },
    ],
    answers: ['B'],
    explanation: `舱壁隔离把故障依赖的资源占用限制在固定额度，配合超时与熔断防止池子被占满。A 延长阻塞，C 放大调用，D 只增加日志量。`,
  },
  {
    id: 'microservices-04-resilience-007',
    type: 'code',
    difficulty: 3,
    tags: ['链路判读'],
    stem: `读下面同一次请求的链路日志，哪一段最可能是瓶颈？

~~~text
trace=t009 gateway  12ms
trace=t009 order    18ms
trace=t009 payment 2400ms
trace=t009 notify    9ms
~~~`,
    options: [
      { key: 'A', text: 'payment 段耗时 2400ms，远高于其它段' },
      { key: 'B', text: 'gateway 段，因为它是入口' },
      { key: 'C', text: 'notify 段，因为它排在最后' },
      { key: 'D', text: 'order 段，因为 18 大于 12' },
    ],
    answers: ['A'],
    explanation: `同一 traceId 下各 span 耗时对比，payment 的 2400ms 明显异常，应优先看它的下游依赖与慢 SQL。B、C、D 都没有依据耗时数据判断。`,
  },
]
