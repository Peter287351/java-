import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'ops-practice-01-signal-001',
    type: 'single',
    difficulty: 1,
    tags: ['黄金指标'],
    stem: `监控的「四个黄金信号」通常指？`,
    options: [
      { key: 'A', text: '延迟、流量、错误、饱和度' },
      { key: 'B', text: 'CPU、内存、磁盘、主板温度' },
      { key: 'C', text: '代码行数、提交数、分支数、PR 数' },
      { key: 'D', text: 'QPS、TPS、RT、JVM 版本' },
    ],
    answers: ['A'],
    explanation: `Google SRE 的四个黄金信号是 Latency、Traffic、Errors、Saturation。B 是资源项但不够成体系，C 是研发过程指标，D 混淆了性能与版本。`,
  },
  {
    id: 'ops-practice-01-signal-002',
    type: 'single',
    difficulty: 1,
    tags: ['告警'],
    stem: `收到告警后最合理的第一组动作是？`,
    options: [
      { key: 'A', text: '立刻重启所有服务' },
      { key: 'B', text: '确认影响面、起始时间、是否持续恶化，并保留现场' },
      { key: 'C', text: '直接关闭告警规则' },
      { key: 'D', text: '先修改业务代码并发布' },
    ],
    answers: ['B'],
    explanation: `先判断「用户是否受影响、影响多大、与哪次变更相关」，再决定止血手段。A 抹掉现场，C 掩盖问题，D 未经定位就发布风险更高。`,
  },
  {
    id: 'ops-practice-01-signal-003',
    type: 'single',
    difficulty: 2,
    tags: ['错误率'],
    stem: `错误数从 100 涨到 150，同时总请求数从 1 万涨到 5 万，最合理的判断是？`,
    options: [
      { key: 'A', text: '故障明显恶化，错误率上升了 50%' },
      { key: 'B', text: '错误率其实从 1% 降到 0.3%，可能是流量增长带来的绝对数上升' },
      { key: 'C', text: '说明数据库一定挂了' },
      { key: 'D', text: '监控系统必然出错' },
    ],
    answers: ['B'],
    explanation: `看比率不看绝对数：100/10000=1%，150/50000=0.3%。A 只看绝对值，C、D 没有数据支撑。`,
  },
  {
    id: 'ops-practice-01-signal-004',
    type: 'single',
    difficulty: 2,
    tags: ['饱和度'],
    stem: `「饱和度」指标主要衡量？`,
    options: [
      { key: 'A', text: '系统资源还剩多少，离容量上限有多近' },
      { key: 'B', text: '用户满意度评分' },
      { key: 'C', text: '代码测试覆盖率' },
      { key: 'D', text: '接口文档完整度' },
    ],
    answers: ['A'],
    explanation: `饱和度关注连接池、线程池、队列、CPU/内存等「还剩多少」，用于预判容量瓶颈。B、C、D 都是另一类指标。`,
  },
  {
    id: 'ops-practice-01-signal-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['排障'],
    stem: `把现象推到原因，通常需要对齐哪些信息？`,
    options: [
      { key: 'A', text: '指标趋势与告警触发时间' },
      { key: 'B', text: '应用日志与同一 traceId 的调用链' },
      { key: 'C', text: '发布、配置、依赖变更记录' },
      { key: 'D', text: '开发者的日历日程' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `指标定范围、日志定位置、变更定嫌疑，三者按同一时间轴对齐才能形成证据链。D 与运行时状态无关。`,
  },
  {
    id: 'ops-practice-01-signal-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['告警分级'],
    scenario: `凌晨 2 点收到「某后台报表任务执行超时」告警，核心下单接口错误率、延迟、流量都正常，用户无感知。`,
    stem: `最合理的处理是？`,
    options: [
      { key: 'A', text: '立即回滚线上所有服务' },
      { key: 'B', text: '按告警分级判断为非核心链路，记录并在工作时间排查，同时确认它不会影响核心资源' },
      { key: 'C', text: '关闭全部监控避免打扰' },
      { key: 'D', text: '直接扩容数据库' },
    ],
    answers: ['B'],
    explanation: `告警要按影响面分级：核心指标正常时不必半夜动生产，但要确认后台任务不会拖垮共享资源并留待跟进。A 冒不必要的风险，C 掩盖问题，D 没有依据。`,
  },
  {
    id: 'ops-practice-01-signal-007',
    type: 'code',
    difficulty: 3,
    tags: ['指标判读'],
    stem: `读下面按分钟聚合的指标，故障最可能从哪一分钟开始？

~~~text
09:03  req=1000  err=2    p99=80ms
09:04  req=1010  err=3    p99=85ms
09:05  req=1020  err=180  p99=2100ms
09:06  req=980   err=165  p99=1900ms
~~~`,
    options: [
      { key: 'A', text: '09:05，错误数与 p99 延迟同时突增而流量基本不变' },
      { key: 'B', text: '09:03，因为它是第一行' },
      { key: 'C', text: '09:04，因为 err 从 2 变成 3' },
      { key: 'D', text: '09:06，因为错误数仍然很高' },
    ],
    answers: ['A'],
    explanation: `09:05 错误数从个位数跳到 180、p99 从 85ms 跳到 2100ms，而请求量没有明显变化，是典型的突变起点。B、C 是噪声，D 是延续而非起点。`,
  },
]
