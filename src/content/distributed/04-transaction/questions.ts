import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'distributed-04-transaction-001',
    type: 'single',
    difficulty: 1,
    tags: ['本地事务'],
    stem: `Spring 的 @Transactional 默认能覆盖的范围是？`,
    options: [
      { key: 'A', text: '同一个数据库连接内的本地事务' },
      { key: 'B', text: '一次请求里所有微服务的全部写操作' },
      { key: 'C', text: '跨机房所有数据库' },
      { key: 'D', text: '所有消息队列的消费过程' },
    ],
    answers: ['A'],
    explanation: `本地事务绑定一个数据库连接/会话，跨服务与跨库需要分布式事务或最终一致方案。B、C、D 都超出了它的边界。`,
  },
  {
    id: 'distributed-04-transaction-002',
    type: 'single',
    difficulty: 1,
    tags: ['2PC'],
    stem: `2PC（两阶段提交）的两个阶段是？`,
    options: [
      { key: 'A', text: '准备阶段（投票）与提交/回滚阶段' },
      { key: 'B', text: '查询阶段与缓存阶段' },
      { key: 'C', text: '加锁阶段与解锁阶段' },
      { key: 'D', text: '编译阶段与运行阶段' },
    ],
    answers: ['A'],
    explanation: `协调者先让各参与者预提交并投票，全部同意再发提交，否则回滚。B、C、D 都不是 2PC 的阶段划分。`,
  },
  {
    id: 'distributed-04-transaction-003',
    type: 'single',
    difficulty: 2,
    tags: ['TCC'],
    stem: `TCC 的三个操作分别是？`,
    options: [
      { key: 'A', text: 'Try 预留资源、Confirm 确认、Cancel 释放预留' },
      { key: 'B', text: 'Create、Read、Delete' },
      { key: 'C', text: 'Begin、Commit、Rollback' },
      { key: 'D', text: 'Lock、Wait、Notify' },
    ],
    answers: ['A'],
    explanation: `Try 做业务检查与资源预留，Confirm 真正提交，Cancel 在失败时反向释放。C 是本地事务术语，B、D 与 TCC 无关。`,
  },
  {
    id: 'distributed-04-transaction-004',
    type: 'single',
    difficulty: 2,
    tags: ['本地消息表'],
    stem: `本地消息表方案的关键点是？`,
    options: [
      { key: 'A', text: '业务数据与消息记录在同一个本地事务里写入，再由异步任务投递并保证消费幂等' },
      { key: 'B', text: '所有服务共用一个数据库事务' },
      { key: 'C', text: '消息一定只投递一次，无需消费端幂等' },
      { key: 'D', text: '由消息队列替业务库提交事务' },
    ],
    answers: ['A'],
    explanation: `同库事务保证「业务成功则消息一定存在」，异步投递 + 重试 + 幂等消费 + 对账达成最终一致。B、D 混淆了事务边界，C 忽略了消息重投的必然性。`,
  },
  {
    id: 'distributed-04-transaction-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['幂等'],
    stem: `下列哪些手段可以实现写接口幂等？`,
    options: [
      { key: 'A', text: '业务唯一键 + 数据库唯一索引' },
      { key: 'B', text: '带状态条件的 UPDATE，靠影响行数判断是否已处理' },
      { key: 'C', text: '幂等 token / 去重表记录已处理的请求' },
      { key: 'D', text: '前端按钮点一次就禁用' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 都在服务端形成可校验的幂等约束。D 只能改善交互体验，网络重试、脚本调用或回调仍会产生重复请求。`,
  },
  {
    id: 'distributed-04-transaction-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['最终一致'],
    scenario: `下单接口先写订单库，再发 MQ 通知库存服务扣减。偶发「订单创建成功但库存没扣」，排查发现写库成功后服务在发消息前重启了。`,
    stem: `最合适的改进是？`,
    options: [
      { key: 'A', text: '把发消息放到本地事务之前' },
      { key: 'B', text: '用本地消息表/事务消息把消息随业务数据一起落库，异步可靠投递，并在消费端做幂等与对账' },
      { key: 'C', text: '把 MQ 换成同步 HTTP 调用即可，无需其它处理' },
      { key: 'D', text: '让用户重新下单' },
    ],
    answers: ['B'],
    explanation: `根因是「写库」与「发消息」不是原子操作。可靠消息模式消除中间空档；同步调用仍可能因超时产生不一致，仍需幂等。A 会变成「消息发了但订单没建」，C、D 不完整。`,
  },
  {
    id: 'distributed-04-transaction-007',
    type: 'code',
    difficulty: 3,
    tags: ['幂等 SQL'],
    stem: `同一支付回调连续执行两次下面语句，第二次的影响行数是？

~~~sql
UPDATE pay_order SET status = 'PAID'
WHERE id = 1001 AND status = 'UNPAID';
~~~`,
    options: [
      { key: 'A', text: '0，因为第一次已把状态改成 PAID，条件不再满足' },
      { key: 'B', text: '1，每次都会重新更新' },
      { key: 'C', text: '2' },
      { key: 'D', text: '会报主键冲突' },
    ],
    answers: ['A'],
    explanation: `状态机条件更新让重复回调自然失效：第二次 status 已是 PAID，WHERE 不匹配，影响行数为 0。B、C 忽略了条件，D 与 UPDATE 不相关。`,
  },
]
