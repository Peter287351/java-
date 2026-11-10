import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'microservices-03-gateway-001',
    type: 'single',
    difficulty: 1,
    tags: ['网关'],
    stem: `微服务网关最核心的职责是？`,
    options: [
      { key: 'A', text: '作为统一入口做路由、鉴权、限流等横切处理' },
      { key: 'B', text: '存储业务订单数据' },
      { key: 'C', text: '执行数据库迁移脚本' },
      { key: 'D', text: '替代消息队列做异步解耦' },
    ],
    answers: ['A'],
    explanation: `网关收敛外部流量并在入口做横切能力，业务数据仍归各服务与数据库。B、C、D 都不属于网关职责。`,
  },
  {
    id: 'microservices-03-gateway-002',
    type: 'single',
    difficulty: 1,
    tags: ['Predicate'],
    stem: `Spring Cloud Gateway 里 Predicate 的作用是？`,
    options: [
      { key: 'A', text: '判断请求是否匹配某条路由' },
      { key: 'B', text: '修改响应体内容' },
      { key: 'C', text: '定义数据库连接池大小' },
      { key: 'D', text: '生成服务实例心跳' },
    ],
    answers: ['A'],
    explanation: `Predicate 是匹配条件（路径、方法、Header、时间等），Filter 才负责改写请求/响应。B 属于 Filter，C、D 与网关无关。`,
  },
  {
    id: 'microservices-03-gateway-003',
    type: 'single',
    difficulty: 2,
    tags: ['StripPrefix'],
    stem: `路由配置 StripPrefix=1，请求 /api/orders/1 转发到后端时路径通常变成？`,
    options: [
      { key: 'A', text: '/api/orders/1' },
      { key: 'B', text: '/orders/1' },
      { key: 'C', text: '/1' },
      { key: 'D', text: '/' },
    ],
    answers: ['B'],
    explanation: `StripPrefix=1 去掉第一段 /api，保留剩余路径。A 是没配置的效果，C 相当于去掉两段，D 把路径全部丢掉。`,
  },
  {
    id: 'microservices-03-gateway-004',
    type: 'single',
    difficulty: 2,
    tags: ['全局过滤器'],
    stem: `想给所有经过网关的请求统一注入 traceId，最适合用？`,
    options: [
      { key: 'A', text: 'GlobalFilter 全局过滤器' },
      { key: 'B', text: '某条路由的局部 Filter' },
      { key: 'C', text: '数据库触发器' },
      { key: 'D', text: '前端 localStorage' },
    ],
    answers: ['A'],
    explanation: `全局过滤器对所有路由生效，适合放 traceId、审计等横切逻辑；局部 Filter 只影响单条路由。C、D 不在请求链路上。`,
  },
  {
    id: 'microservices-03-gateway-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['网关能力'],
    stem: `通常由网关统一承担的能力有哪些？`,
    options: [
      { key: 'A', text: 'Token 校验与鉴权失败直接返回 401' },
      { key: 'B', text: '按接口或用户维度限流' },
      { key: 'C', text: '统一配置 CORS 跨域规则' },
      { key: 'D', text: '执行订单表的分库分表路由' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 都是入口横切能力。D 属于数据访问层（ShardingSphere 等），与网关无关。`,
  },
  {
    id: 'microservices-03-gateway-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['404 排查'],
    scenario: `通过网关访问 /api/orders/1 返回 404，但直接请求 order-service 实例的 /orders/1 能正常返回，注册中心里实例也健康。`,
    stem: `最先应该检查的是？`,
    options: [
      { key: 'A', text: '网关路由的 Path 谓词与 StripPrefix 配置是否把 /api 前缀正确处理' },
      { key: 'B', text: '数据库索引是否失效' },
      { key: 'C', text: '前端按钮是否绑定了点击事件' },
      { key: 'D', text: 'JVM 堆内存是否足够' },
    ],
    answers: ['A'],
    explanation: `直连正常说明后端没问题，404 出在网关匹配或路径重写环节。B、C、D 都不会导致「网关 404、直连 200」这种差异。`,
  },
  {
    id: 'microservices-03-gateway-007',
    type: 'code',
    difficulty: 3,
    tags: ['路由配置'],
    stem: `读下面路由配置，访问 /api/users/3 时后端收到的路径是？

~~~yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-route
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1
~~~`,
    options: [
      { key: 'A', text: '/api/users/3' },
      { key: 'B', text: '/users/3' },
      { key: 'C', text: '/3' },
      { key: 'D', text: '/user-service/users/3' },
    ],
    answers: ['B'],
    explanation: `Path 谓词匹配后，StripPrefix=1 去掉 /api，剩余 /users/3 转发到 lb://user-service 解析出的实例。A 未去前缀，C 去了两段，D 把服务名当成了路径。`,
  },
]
