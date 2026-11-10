import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'microservices-02-feign-lb-001',
    type: 'single',
    difficulty: 1,
    tags: ['OpenFeign'],
    stem: `@FeignClient(name = "order-service") 中的 name 表示？`,
    options: [
      { key: 'A', text: '下游服务在注册中心里的服务名' },
      { key: 'B', text: '本地接口的类名' },
      { key: 'C', text: '数据库 schema 名' },
      { key: 'D', text: '前端页面路由' },
    ],
    answers: ['A'],
    explanation: `Feign 用该服务名去注册中心解析实例列表，再配合负载均衡发起调用。B、C、D 与服务发现无关。`,
  },
  {
    id: 'microservices-02-feign-lb-002',
    type: 'single',
    difficulty: 1,
    tags: ['负载均衡'],
    stem: `客户端负载均衡的主要作用是？`,
    options: [
      { key: 'A', text: '把请求分摊到同一服务的多个实例，避免单实例过载' },
      { key: 'B', text: '把 SQL 分摊到多个数据库执行' },
      { key: 'C', text: '压缩 HTTP 响应体' },
      { key: 'D', text: '生成 Swagger 文档' },
    ],
    answers: ['A'],
    explanation: `负载均衡在实例列表里选目标，提升吞吐与可用性。B 是分库分表/读写分离，C 是压缩配置，D 是文档工具。`,
  },
  {
    id: 'microservices-02-feign-lb-003',
    type: 'single',
    difficulty: 2,
    tags: ['超时'],
    stem: `设置 Feign 读超时时，合理的原则是？`,
    options: [
      { key: 'A', text: '越短越好，最好 1ms' },
      { key: 'B', text: '参考下游 P99 延迟，且上游超时应略大于下游耗时，避免无谓重试' },
      { key: 'C', text: '不设置，交给默认值即可' },
      { key: 'D', text: '与数据库连接超时完全一致' },
    ],
    answers: ['B'],
    explanation: `超时过短会在下游仍在计算时触发重试，放大流量；过长又拖住上游线程。按下游 P99 与调用链层级设定是常规做法。A、C、D 都缺乏依据。`,
  },
  {
    id: 'microservices-02-feign-lb-004',
    type: 'single',
    difficulty: 2,
    tags: ['重试'],
    stem: `下列哪种调用最适合开启自动重试？`,
    options: [
      { key: 'A', text: '创建订单的 POST 请求' },
      { key: 'B', text: '扣减余额的写接口' },
      { key: 'C', text: '幂等的商品详情 GET 查询' },
      { key: 'D', text: '发送短信的通知接口' },
    ],
    answers: ['C'],
    explanation: `重试前提是幂等：重复执行不改变结果。GET 查询天然满足；A、B、D 都可能造成重复下单、重复扣款或重复短信，需要幂等键才允许重试。`,
  },
  {
    id: 'microservices-02-feign-lb-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['Feign'],
    stem: `关于 OpenFeign，下列说法正确的有哪些？`,
    options: [
      { key: 'A', text: '可结合注册中心实现按服务名调用' },
      { key: 'B', text: 'RequestInterceptor 可用于透传 traceId 或鉴权 Header' },
      { key: 'C', text: '接口方法签名要与下游 HTTP 契约一致' },
      { key: 'D', text: '默认会把浏览器 Cookie 原样转发给下游' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 正确。D 错：Header 默认不透传，必须写拦截器显式复制，这正是「上游有登录态、下游 401」的常见原因。`,
  },
  {
    id: 'microservices-02-feign-lb-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['雪崩'],
    scenario: `下游 order-service 因慢 SQL 响应时间从 50ms 涨到 3s，上游的线程池很快被占满，整条链路大面积超时。`,
    stem: `最应该优先补上的防护是？`,
    options: [
      { key: 'A', text: '给上游加更大的连接池' },
      { key: 'B', text: '合理超时 + 熔断/降级 + 线程池或信号量隔离，先阻止故障沿调用链扩散' },
      { key: 'C', text: '把重试次数调到 10 次提高成功率' },
      { key: 'D', text: '把所有接口改成同步串行调用' },
    ],
    answers: ['B'],
    explanation: `这是典型雪崩：慢下游耗尽上游线程。超时、熔断降级与资源隔离能把影响限制在单个依赖。A 只是延后耗尽，C 会放大流量，D 让阻塞更严重。`,
  },
  {
    id: 'microservices-02-feign-lb-007',
    type: 'code',
    difficulty: 3,
    tags: ['Feign 契约'],
    stem: `读下面 Feign 接口，调用 detail(7L) 时发出的请求是？

~~~java
@FeignClient(name = "order-service")
public interface OrderClient {
  @GetMapping("/orders/{id}")
  Order detail(@PathVariable("id") Long id);
}
~~~`,
    options: [
      { key: 'A', text: 'GET 到 order-service 某个实例的 /orders/7' },
      { key: 'B', text: 'POST 到 /orders/7 且请求体为 7' },
      { key: 'C', text: 'GET 到注册中心的 /orders/7' },
      { key: 'D', text: 'GET 到本机 127.0.0.1 的 /orders/7' },
    ],
    answers: ['A'],
    explanation: `注解声明 GET 与路径模板，@PathVariable 填入 7，服务名经负载均衡解析成某个实例地址。B 用错方法与传参，C 把注册中心当数据面，D 忽略了服务发现。`,
  },
]
