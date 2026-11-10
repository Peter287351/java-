import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'deploy-04-troubleshoot-001',
    type: 'single',
    difficulty: 1,
    tags: ['健康检查'],
    stem: `Spring Boot Actuator 的 /actuator/health 主要用途是？`,
    options: [
      { key: 'A', text: '供负载均衡/编排系统判断实例是否可用' },
      { key: 'B', text: '自动生成 API 文档' },
      { key: 'C', text: '压缩静态资源' },
      { key: 'D', text: '替代数据库主从切换' },
    ],
    answers: ['A'],
    explanation: `health 汇总应用与关键依赖状态，供探活与流量挂载决策使用。B 是 Swagger/OpenAPI，C 是构建或 Nginx 的职责，D 与数据库高可用无关。`,
  },
  {
    id: 'deploy-04-troubleshoot-002',
    type: 'single',
    difficulty: 1,
    tags: ['日志'],
    stem: `服务由 systemd 管理时，查看它最近日志的命令是？`,
    options: [
      { key: 'A', text: 'git log -n 100' },
      { key: 'B', text: 'journalctl -u app -n 100' },
      { key: 'C', text: 'npm run dev' },
      { key: 'D', text: 'docker build .' },
    ],
    answers: ['B'],
    explanation: `journalctl -u <unit> 读取 systemd 收集的标准输出/错误，加 -f 可实时跟随。A 看代码提交历史，C、D 与日志无关。`,
  },
  {
    id: 'deploy-04-troubleshoot-003',
    type: 'single',
    difficulty: 2,
    tags: ['排障'],
    stem: `线上告警触发后，最合理的第一组动作是？`,
    options: [
      { key: 'A', text: '立刻重启所有服务器，再看是否恢复' },
      { key: 'B', text: '确认影响面与最近变更，保留日志/指标现场，再决定止血方式' },
      { key: 'C', text: '直接改代码并热部署' },
      { key: 'D', text: '先删除日志文件释放磁盘' },
    ],
    answers: ['B'],
    explanation: `先弄清「谁受影响、刚改了什么」并保留现场，避免重启抹掉证据；随后按预案回滚或摘流量。A、C、D 都会破坏现场或扩大影响。`,
  },
  {
    id: 'deploy-04-troubleshoot-004',
    type: 'single',
    difficulty: 2,
    tags: ['回滚'],
    stem: `发布后错误率暴涨且短时间内定位不到根因，优先做？`,
    options: [
      { key: 'A', text: '继续加日志，等根因明确再处理' },
      { key: 'B', text: '按预案回滚到上一版可用产物，先恢复服务' },
      { key: 'C', text: '把超时时间调大掩盖报错' },
      { key: 'D', text: '关闭告警避免打扰' },
    ],
    answers: ['B'],
    explanation: `止血优先于定位：先回滚恢复用户，再在保留的日志/指标里慢慢查根因。A 让故障持续，C、D 只是掩盖现象。`,
  },
  {
    id: 'deploy-04-troubleshoot-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['可观测性'],
    stem: `一次可用的故障排查通常会用到哪些信息？`,
    options: [
      { key: 'A', text: '错误率、延迟、CPU/内存等指标趋势' },
      { key: 'B', text: '同一 traceId 串起来的请求日志' },
      { key: 'C', text: '最近一次发布/配置变更记录' },
      { key: 'D', text: '开发机上的 IDE 主题配色' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `指标定范围、链路定位置、变更定嫌疑，这是排障三要素。D 与运行时状态无关。`,
  },
  {
    id: 'deploy-04-troubleshoot-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['排障'],
    scenario: `09:05 发布 order 服务 v2 后，网关 5xx 错误率从 0.2% 涨到 8%，应用日志里有大量超时堆栈，数据库 CPU 正常。`,
    stem: `结合「变更对齐」思路，最优先验证的假设是？`,
    options: [
      { key: 'A', text: '数据库磁盘满了' },
      { key: 'B', text: 'v2 引入的慢调用/连接池问题导致线程打满，应先回滚 v2 并对比发布前后错误分布' },
      { key: 'C', text: '客户端浏览器版本太旧' },
      { key: 'D', text: 'Nginx 证书过期' },
    ],
    answers: ['B'],
    explanation: `错误突增的时间点与发布时刻重合、且数据库正常，优先怀疑新版本自身。正确动作是先回滚止血，再用按版本/分钟聚合的日志确认。A、C、D 与「发布即出问题」的时间线不符。`,
  },
  {
    id: 'deploy-04-troubleshoot-007',
    type: 'code',
    difficulty: 3,
    tags: ['日志判读'],
    stem: `读下面这段日志，最贴近根因的判断是？

~~~text
2024-06-01 09:05:12 ERROR [t009] order v2 - HikariPool-1 Connection is not available, request timed out after 30000ms
2024-06-01 09:05:20 ERROR [t010] order v2 - HikariPool-1 Connection is not available, request timed out after 30000ms
2024-06-01 09:05:31 INFO  [t011] order v2 - GET /health 200 in 4ms
~~~`,
    options: [
      { key: 'A', text: '健康检查正常说明服务完全健康，无需处理' },
      { key: 'B', text: '数据库连接池耗尽，健康检查因不查库仍返回 200，属于典型的「探针覆盖不足」' },
      { key: 'C', text: 'Nginx 端口映射写错' },
      { key: 'D', text: 'JVM 内存溢出，必须立刻加大堆内存' },
    ],
    answers: ['B'],
    explanation: `两条 Connection is not available 指向连接池耗尽；health 只探活不查依赖所以仍 200。A 忽略了业务报错，C 会表现为 502，D 通常伴随 OutOfMemoryError 而非连接池超时。`,
  },
]
