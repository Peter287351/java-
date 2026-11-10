import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'ops-practice-03-change-001',
    type: 'single',
    difficulty: 1,
    tags: ['变更管理'],
    stem: `「可灰度、可观测、可回滚」里，可回滚主要指？`,
    options: [
      { key: 'A', text: '出问题时能在短时间内恢复到上一个可用状态' },
      { key: 'B', text: '能无限次重新发布新版本' },
      { key: 'C', text: '能回滚用户提交的订单' },
      { key: 'D', text: '能把日志时间倒回故障前' },
    ],
    answers: ['A'],
    explanation: `可回滚是止血能力的底线，要求产物、配置与数据变更都有回退路径。B 是重复发布，C 是业务操作，D 与回滚无关。`,
  },
  {
    id: 'ops-practice-03-change-002',
    type: 'single',
    difficulty: 1,
    tags: ['灰度'],
    stem: `金丝雀（灰度）发布的核心做法是？`,
    options: [
      { key: 'A', text: '先让少量流量/用户使用新版本，观察指标无异常再逐步扩大' },
      { key: 'B', text: '一次性把所有实例换成新版本' },
      { key: 'C', text: '只在测试环境发布，永不上线' },
      { key: 'D', text: '把发布安排在凌晨就不需要观察' },
    ],
    answers: ['A'],
    explanation: `灰度用小流量把爆炸半径控制住，配合指标观察决定是否扩量或回滚。B 是全量发布，C 没有交付，D 把时间当成风险控制。`,
  },
  {
    id: 'ops-practice-03-change-003',
    type: 'single',
    difficulty: 2,
    tags: ['数据库变更'],
    stem: `要让应用可以随时回滚，数据库新增字段的推荐做法是？`,
    options: [
      { key: 'A', text: '删列和改类型与新代码一起上线，减少发布次数' },
      { key: 'B', text: '先做兼容变更（加列），再发布新代码，稳定后才清理旧结构' },
      { key: 'C', text: '直接改生产表结构，回滚时再改回来' },
      { key: 'D', text: '禁止任何数据库变更' },
    ],
    answers: ['B'],
    explanation: `破坏性变更会让旧版本代码立刻失效，堵死回滚路径；分两步保证新旧版本都能运行。A、C 都会导致回滚失败，D 不现实。`,
  },
  {
    id: 'ops-practice-03-change-004',
    type: 'single',
    difficulty: 2,
    tags: ['发布策略'],
    stem: `蓝绿发布的特点是？`,
    options: [
      { key: 'A', text: '维护两套完整环境，通过切换流量入口在版本间快速切换' },
      { key: 'B', text: '逐台替换实例，始终只有一套环境' },
      { key: 'C', text: '按用户比例一点点放量' },
      { key: 'D', text: '只在夜间发布且不允许回滚' },
    ],
    answers: ['A'],
    explanation: `蓝绿是「两套环境 + 一次切流」，回滚只需把流量切回。B 是滚动发布，C 是金丝雀，D 与策略无关。`,
  },
  {
    id: 'ops-practice-03-change-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['发布检查单'],
    stem: `一份可用的发布检查单通常包含哪些内容？`,
    options: [
      { key: 'A', text: '上一版产物备份与回滚命令' },
      { key: 'B', text: '健康检查地址与观察指标阈值' },
      { key: 'C', text: '配置、数据脚本的回退方式与负责人' },
      { key: 'D', text: '本次发版无关的前端配色偏好' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 覆盖回退、验证与责任，是发布前必须确认的。D 与发布风险无关。`,
  },
  {
    id: 'ops-practice-03-change-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['回滚'],
    scenario: `发布 v2 后错误率飙升，团队按预案回滚了应用 jar，但错误率没有下降；排查发现这次同时改了配置中心的一个开关，还执行了删列的 DDL。`,
    stem: `最应该补进预案的是？`,
    options: [
      { key: 'A', text: '回滚时必须同步回退配置变更，且数据库变更必须做成新旧版本兼容，保证旧代码能跑' },
      { key: 'B', text: '把回滚速度再提高一倍' },
      { key: 'C', text: '发布前多打印几行日志' },
      { key: 'D', text: '把应用实例数减半' },
    ],
    answers: ['A'],
    explanation: `回滚是「整体状态」的回退，只换 jar 不够；破坏性 DDL 更是让回退路径彻底失效。B、C、D 都没有解决配置与数据结构的不兼容。`,
  },
  {
    id: 'ops-practice-03-change-007',
    type: 'code',
    difficulty: 3,
    tags: ['发布检查单'],
    stem: `读下面这份发布检查单，最明显的缺项是？

~~~text
[ ] 已备份上一版 app.jar
[ ] 已配置 /actuator/health 健康检查
[ ] 已确认观察窗口 10 分钟
[ ] 已通知值班同学
~~~`,
    options: [
      { key: 'A', text: '缺少明确的回滚命令/触发条件，异常时无法快速止血' },
      { key: 'B', text: '缺少前端页面截图' },
      { key: 'C', text: '缺少代码仓库地址' },
      { key: 'D', text: '缺少开发机型号' },
    ],
    answers: ['A'],
    explanation: `检查单已有备份、健康检查、观察窗口与通知，但没有写「怎么回滚、什么条件触发」，故障时会临场找命令。B、C、D 都不是发布风险控制项。`,
  },
]
