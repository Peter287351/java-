import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'microservices-01-discovery-001',
    type: 'single',
    difficulty: 1,
    tags: ['注册发现'],
    stem: `服务注册中心最核心的作用是？`,
    options: [
      { key: 'A', text: '让调用方按服务名动态获取可用实例地址' },
      { key: 'B', text: '替代数据库存储业务数据' },
      { key: 'C', text: '编译 Java 源码' },
      { key: 'D', text: '给前端页面做 CDN 加速' },
    ],
    answers: ['A'],
    explanation: `实例地址动态变化，注册中心维护「服务名 → 实例列表」的映射并对调用方提供查询。B、C、D 都不属于它的职责。`,
  },
  {
    id: 'microservices-01-discovery-002',
    type: 'single',
    difficulty: 1,
    tags: ['心跳'],
    stem: `注册中心判断实例是否存活，通常依靠？`,
    options: [
      { key: 'A', text: '实例周期性上报心跳/续约，超时未续约则摘除' },
      { key: 'B', text: '每天人工核对一次列表' },
      { key: 'C', text: '扫描服务器磁盘文件' },
      { key: 'D', text: '读取前端埋点日志' },
    ],
    answers: ['A'],
    explanation: `心跳续约是主流机制，超时即标记不健康或剔除；Nacos 对临时实例也采用类似思路。B、C、D 都不能及时反映实例状态。`,
  },
  {
    id: 'microservices-01-discovery-003',
    type: 'single',
    difficulty: 2,
    tags: ['CAP'],
    stem: `关于 Eureka 与 CP 系统的取舍，正确的是？`,
    options: [
      { key: 'A', text: 'Eureka 偏 AP，分区时优先保证可用，可能返回稍旧的实例列表' },
      { key: 'B', text: 'Eureka 偏 CP，分区时宁可整体不可用' },
      { key: 'C', text: '所有注册中心都必须强一致' },
      { key: 'D', text: '注册中心不参与 CAP 权衡' },
    ],
    answers: ['A'],
    explanation: `注册发现更看重可用性：旧列表 + 重试/熔断通常好过整体不可用。B 是 ZooKeeper/Consul 的倾向，C、D 忽略了不同注册中心的定位差异。`,
  },
  {
    id: 'microservices-01-discovery-004',
    type: 'single',
    difficulty: 2,
    tags: ['服务发现'],
    stem: `消费者调用 order-service 时，典型流程是？`,
    options: [
      { key: 'A', text: '按服务名从注册中心取实例列表，本地负载均衡选一个实例发起调用' },
      { key: 'B', text: '把请求发给注册中心，由它转发到实例' },
      { key: 'C', text: '每次调用都读数据库配置表拿 IP' },
      { key: 'D', text: '通过 DNS 公网解析直接拿到容器 IP' },
    ],
    answers: ['A'],
    explanation: `Spring Cloud 用的是客户端发现：消费者自己拉列表并用 LoadBalancer 选实例。B 描述的是服务端发现/网关代理模式，C、D 不是标准流程。`,
  },
  {
    id: 'microservices-01-discovery-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['注册中心'],
    stem: `下列关于注册中心的说法正确的有哪些？`,
    options: [
      { key: 'A', text: '实例元数据可承载版本号、权重、机房等信息' },
      { key: 'B', text: '消费者通常会缓存实例列表，摘除存在一定延迟' },
      { key: 'C', text: '注册中心应部署为集群，避免单点' },
      { key: 'D', text: '只要心跳正常，实例的业务接口就一定可用' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 正确。D 错：心跳只说明进程活着，业务可能因连接池耗尽而不可用，需要业务健康检查、熔断与重试兜底。`,
  },
  {
    id: 'microservices-01-discovery-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['实例摘除'],
    scenario: `运维把 order-service 的一个实例停机下线，但网关日志显示之后十几秒内仍不断有请求打到这个已下线的 IP 并报连接拒绝。`,
    stem: `最贴近根因的解释与改进是？`,
    options: [
      { key: 'A', text: '注册中心立即删除了实例，是客户端缓存与摘除延迟；配合主动下线通知、缩短缓存刷新间隔并加调用重试' },
      { key: 'B', text: 'Nginx 证书配置错误' },
      { key: 'C', text: '数据库主键冲突导致请求路由错误' },
      { key: 'D', text: 'Java 版本不兼容' },
    ],
    answers: ['A'],
    explanation: `客户端缓存 + 心跳超时判定带来摘除窗口，期间旧列表仍会被使用。标准做法是优雅下线时主动注销、缩短刷新周期、调用侧重试与熔断。B、C、D 与「打到旧 IP」现象无关。`,
  },
  {
    id: 'microservices-01-discovery-007',
    type: 'code',
    difficulty: 3,
    tags: ['实例列表'],
    stem: `注册中心返回如下实例列表，客户端默认轮询且不做权重过滤，连续 3 次请求会打到哪些地址？

~~~text
order-service:
  - 10.0.0.11:8080  weight=1  version=v1
  - 10.0.0.12:8080  weight=1  version=v2
~~~`,
    options: [
      { key: 'A', text: '两个地址交替出现（如 11、12、11）' },
      { key: 'B', text: '只打 10.0.0.11，因为它是第一个' },
      { key: 'C', text: '只打 v2 实例，因为版本号更大' },
      { key: 'D', text: '请求会发给注册中心自身' },
    ],
    answers: ['A'],
    explanation: `权重相同、无版本路由规则时默认轮询，两个实例交替被选中。B 是固定第一台的误解，C 需要显式灰度规则，D 混淆了控制面与数据面。`,
  },
]
