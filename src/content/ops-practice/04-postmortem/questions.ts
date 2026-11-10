import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'ops-practice-04-postmortem-001',
    type: 'single',
    difficulty: 1,
    tags: ['复盘'],
    stem: `故障复盘最主要的目标是？`,
    options: [
      { key: 'A', text: '找出责任人并追责' },
      { key: 'B', text: '还原事实、定位根因，产出可验证的改进项防止复发' },
      { key: 'C', text: '把故障从监控记录里删掉' },
      { key: 'D', text: '证明系统永远不出问题' },
    ],
    answers: ['B'],
    explanation: `复盘对事不对人，重点是系统性改进。A 会让人隐瞒信息，C 抹掉事实，D 不现实。`,
  },
  {
    id: 'ops-practice-04-postmortem-002',
    type: 'single',
    difficulty: 1,
    tags: ['5 Why'],
    stem: `5 Why 方法主要用于？`,
    options: [
      { key: 'A', text: '连续追问为什么，从表象深入到流程或机制层面的根因' },
      { key: 'B', text: '把故障拆成 5 个阶段' },
      { key: 'C', text: '统计 5 分钟内的错误数' },
      { key: 'D', text: '给 5 个人分配任务' },
    ],
    answers: ['A'],
    explanation: `5 Why 通过层层追问避免停在「配置写错了」这类表层原因，追到缺少校验、缺少评审等机制问题。B、C、D 都不是它的含义。`,
  },
  {
    id: 'ops-practice-04-postmortem-003',
    type: 'single',
    difficulty: 2,
    tags: ['runbook'],
    stem: `Runbook（预案）最核心的内容是？`,
    options: [
      { key: 'A', text: '面对某类告警时可以照着执行的操作步骤、止血动作与升级路径' },
      { key: 'B', text: '系统的架构设计文档' },
      { key: 'C', text: '团队的排班表' },
      { key: 'D', text: '功能需求说明书' },
    ],
    answers: ['A'],
    explanation: `预案是「照着做就能止血」的操作清单，讲究具体命令与判断条件。B、C、D 都不是应急处置文档。`,
  },
  {
    id: 'ops-practice-04-postmortem-004',
    type: 'single',
    difficulty: 2,
    tags: ['改进项'],
    stem: `一条合格的复盘改进项通常应该？`,
    options: [
      { key: 'A', text: '写成「加强注意」这类口号' },
      { key: 'B', text: '有明确负责人、截止时间与可验证的验收方式' },
      { key: 'C', text: '只记录在个人笔记里' },
      { key: 'D', text: '尽量模糊，方便以后调整' },
    ],
    answers: ['B'],
    explanation: `改进项要能被执行和验收，否则同类故障必然复发。A、C、D 都缺少闭环。`,
  },
  {
    id: 'ops-practice-04-postmortem-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['稳定性'],
    stem: `关于 SLO 与演练，说法正确的有哪些？`,
    options: [
      { key: 'A', text: 'SLO 用来量化服务质量目标，错误预算用于平衡发布速度与稳定性' },
      { key: 'B', text: '故障注入演练可以验证告警与预案是否真的有效' },
      { key: 'C', text: '预案需要定期演练，否则命令和权限可能已经失效' },
      { key: 'D', text: 'SLO 设为 100% 最合理，能彻底避免故障' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 正确。D 错：100% SLO 不允许任何发布与变更，既不现实也会让指标失去指导意义。`,
  },
  {
    id: 'ops-practice-04-postmortem-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['复盘'],
    scenario: `同一个「连接池耗尽」故障三个月内第二次出现，上次复盘的结论写的是「开发同学配置时不够仔细，后续加强注意」。`,
    stem: `最说明问题的判断是？`,
    options: [
      { key: 'A', text: '上次复盘停在了人的表层原因，没有产出机制性改进（如配置校验、默认值、启动检查与告警覆盖）' },
      { key: 'B', text: '这次值班同学反应太慢' },
      { key: 'C', text: '监控采样周期太短' },
      { key: 'D', text: '应该把连接池换掉' },
    ],
    answers: ['A'],
    explanation: `「加强注意」不是可验证的改进项，复发说明机制没变。应加配置校验、合理默认值、启动自检与连接数告警。B 又回到追责，C、D 没有依据。`,
  },
  {
    id: 'ops-practice-04-postmortem-007',
    type: 'code',
    difficulty: 3,
    tags: ['改进项判读'],
    stem: `读下面复盘里的四条改进项，哪一条最不合格？

~~~text
1. 为 /actuator/health 增加数据库连接检查，owner 张三，11/20 前完成，验收：断库演练返回 DOWN
2. 发布检查单增加回滚命令字段，owner 李四，11/15 前完成，验收：下次发布抽查
3. 以后大家配置时都仔细一点
4. 为连接池耗尽增加告警，owner 王五，11/25 前完成，验收：故障注入触发告警
~~~`,
    options: [
      { key: 'A', text: '第 3 条，没有负责人、时间与可验证的验收方式' },
      { key: 'B', text: '第 1 条，因为和故障无关' },
      { key: 'C', text: '第 2 条，因为不该写进检查单' },
      { key: 'D', text: '第 4 条，因为不需要告警' },
    ],
    answers: ['A'],
    explanation: `1、2、4 都有 owner、截止与验收，是可闭环的改进；第 3 条只是口号，无法执行也无法验证，正是同类故障复发的常见原因。`,
  },
]
