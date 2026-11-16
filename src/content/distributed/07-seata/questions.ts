import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'distributed-07-seata-001',
    type: 'single',
    difficulty: 1,
    tags: ['Seata', '架构'],
    stem: '关于 Seata 的 TC / TM / RM 三个角色，下列描述正确的是？',
    options: [
      { key: 'A', text: 'TC 嵌在业务应用里负责开启全局事务，TM 是独立部署的服务端' },
      { key: 'B', text: 'TM 在事务发起方开启/决议全局事务，RM 在各分支代理数据源并注册分支，TC 是独立服务端负责协调与全局锁' },
      { key: 'C', text: 'RM 负责决定整个全局事务最终提交还是回滚' },
      { key: 'D', text: '三个角色都必须在同一个 JVM 内，否则 XID 无法透传' },
    ],
    answers: ['B'],
    explanation:
      '一次 Seata 全局事务靠 XID 串起来：TM 由发起方的 @GlobalTransactional 触发，向 TC 申请开启并最后决议提交或回滚；RM 在各参与方通过数据源代理拦截 SQL、注册分支、执行二阶段；TC 是独立部署的 seata-server，维护全局/分支状态与全局锁。A 把 TC 与 TM 的位置说反了。C 错在决议权在 TM（最终由 TC 下发），RM 只管自己这一个分支。D 错在三个角色本来就分布在不同进程，XID 正是通过 RPC 上下文（如 RootContext + Feign/Dubbo 拦截器）跨服务透传的。B 正确。',
  },
  {
    id: 'distributed-07-seata-002',
    type: 'single',
    difficulty: 1,
    tags: ['AT', 'undo_log'],
    stem: '关于 Seata AT 模式的一阶段与二阶段，下列说法正确的是？',
    options: [
      { key: 'A', text: '一阶段只做 SQL 解析与锁行，业务数据要等 TC 下发全局提交后才写入数据库' },
      { key: 'B', text: '一阶段就把业务 SQL、前后镜像与 undo_log 放在同一个本地事务里提交，全局提交时只需异步删除 undo_log' },
      { key: 'C', text: '二阶段提交时，RM 要把 before image 再执行一遍才算完成' },
      { key: 'D', text: 'undo_log 由 TC 统一写入中心库，业务库不需要建这张表' },
    ],
    answers: ['B'],
    explanation:
      'AT 的高性能正来自「一阶段就提交」：RM 依次拿前镜像、执行业务 SQL、拿后镜像，把前后镜像写成 undo_log，与业务数据在同一个本地事务里一起提交，随后本地行锁就释放了；二阶段全局提交只是异步删掉 undo_log，不做业务操作。A 描述的是 XA 式的持锁两阶段，不是 AT。C 错在 before image 只在**回滚**时用来生成反向 SQL，提交时不需要重放。D 错在 undo_log 必须建在每个参与的业务库里，且和业务数据同库同事务，TC 只存全局事务/分支/锁的元数据。B 正确，但要注意副作用：一阶段提交后普通 SELECT 就能读到尚未全局决议的中间数据。',
  },
  {
    id: 'distributed-07-seata-003',
    type: 'single',
    difficulty: 2,
    tags: ['AT', '全局锁'],
    stem: 'Seata AT 模式里的「全局锁」主要解决什么问题？',
    options: [
      { key: 'A', text: '替代数据库的本地行锁，让业务 SQL 不需要加锁' },
      { key: 'B', text: '防止一个全局事务尚未决议时，其他全局事务修改同一行，避免回滚补偿覆盖别人的写入；普通读仍可能看到中间态' },
      { key: 'C', text: '保证跨库 JOIN 的查询结果一致' },
      { key: 'D', text: '防止 undo_log 表被并发写入撑爆' },
    ],
    answers: ['B'],
    explanation:
      'AT 一阶段已释放本地行锁，如果没有额外机制，另一个全局事务可以改同一行；等第一个事务回滚时，用 before image 生成的反向 SQL 就会把别人的写入覆盖掉（脏写）。全局锁由 TC 维护（lock_key 通常是 表名:主键），在全局决议前锁住这行，冲突方等待或回滚。B 正确，同时要说清读隔离：默认是读已提交，普通 SELECT 可能读到中间态，需要读全局已提交状态得用 SELECT ... FOR UPDATE 配合 @GlobalLock。A 错在全局锁不替代本地锁，两者作用阶段不同。C 错在它与 JOIN 一致性无关。D 错在 undo_log 膨胀要靠清理与镜像瘦身，不是锁的职责。此外回滚时还要用 after image 与当前值比对，不一致说明发生了脏写，应告警转人工而不是盲目补偿。',
  },
  {
    id: 'distributed-07-seata-004',
    type: 'single',
    difficulty: 3,
    tags: ['TCC', '异常处理'],
    stem: 'TCC 模式里，Cancel 先于 Try 到达并执行完成，随后迟到的 Try 才执行。这种情况该如何处理？',
    options: [
      { key: 'A', text: '属于空回滚，Try 照常预留资源，TC 之后会再补一次 Cancel' },
      { key: 'B', text: '迟到的 Try 会造成「悬挂」——预留的资源再也不会有 Cancel 来释放；Try 必须查事务控制表，发现已有空回滚记录就直接拒绝' },
      { key: 'C', text: '属于幂等问题，把 Cancel 再重试一次即可' },
      { key: 'D', text: '只要把 TC 的全局事务标记为失败，业务侧无需任何处理' },
    ],
    answers: ['B'],
    explanation:
      '先分清两个概念：**空回滚**是 Try 压根没执行（超时或宕机）却收到了 Cancel，此时 Cancel 查不到 Try 记录必须直接返回成功并记一条「已空回滚」，否则 TC 会无限重试；**悬挂**是这次空回滚之后迟到的 Try 又到达了，如果它照常冻结库存，这笔预留就再也没有人释放。正确做法是用事务控制表（xid + branch_id + status）：Try 插入记录前先看是否已有空回滚标记，有就直接拒绝，Cancel/Confirm 也靠状态保证幂等。A 把悬挂误判成空回滚，而且 TC 不会「之后再补一次 Cancel」。C 错在重试 Cancel 解决不了迟到的 Try。D 错在框架标记失败不会自动归还业务预留的资源。B 正确。',
  },
  {
    id: 'distributed-07-seata-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['AT', '适用边界'],
    stem: '下列哪些场景不适合直接套用 Seata AT 模式？',
    options: [
      { key: 'A', text: '业务表没有主键，且更新语句是带子查询的复杂批量 UPDATE' },
      { key: 'B', text: '同一个全局事务里还要求「回滚」Redis 缓存写入与 MQ 消息发送' },
      { key: 'C', text: '两个 MySQL 库各执行一条带主键的单表 UPDATE，要求同进同退，且调用方要同步拿到结果' },
      { key: 'D', text: '跨多个外部系统、耗时分钟级的「下单 → 支付 → 发货」长流程' },
    ],
    answers: ['A', 'B', 'D'],
    explanation:
      'AT 的前提是「能由数据源代理解析 SQL 并生成前后镜像」，且只覆盖关系型数据库的简单 DML。A 错在复杂批量 SQL 与无主键表无法可靠生成镜像；B 错在 Redis、MQ 这类非 DB 资源不产生 undo_log，Seata 回滚不了它们，硬塞进全局事务只会造成「数据库回滚了、消息却发出去了」；D 错在长流程会把全局事务与全局锁持有时间拖得极长，应选 Saga 或消息驱动的最终一致。C 恰恰是 AT 最典型的适用面：同构 MySQL、SQL 简单、需要同步决议、参与者少，所以不选。这也引出选型第一问：能异步最终一致，就别上强一致框架。',
  },
  {
    id: 'distributed-07-seata-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['Saga', '选型'],
    stem: '关于 Saga 与最终一致方案，下列说法正确的有？',
    options: [
      { key: 'A', text: 'Saga 的补偿是一笔新的业务操作（如发起退款），不等于数据库回滚，中间状态对外可见' },
      { key: 'B', text: '每一步补偿必须幂等、可重试，并用状态机或事件编排记录流程走到哪一步' },
      { key: 'C', text: '能用本地消息表 + 消费端幂等 + 定时对账解决的场景，通常比引入强一致分布式事务框架更划算' },
      { key: 'D', text: '只要给每个正向步骤配好补偿，Saga 就等价于强一致，不需要对账与人工介入' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'Saga 面向的是跨系统、耗时长的流程：钱可能已被消费、货可能已发出，补偿只能做另一笔业务操作去抵消，做不到「像没发生过一样」，所以中间状态对外可见、一致性是最终一致。A 正确。B 是落地前提：TC 会重试补偿，状态机要能判断该从哪一步继续，补偿本身不幂等就会重复退款。C 是选型判断：本地消息表把「业务落库」与「待发消息」放进同一本地事务，配合幂等消费与定时对账，吞吐高、故障域小，是互联网业务的首选。D 错在补偿失败、下游长时间不可用、补偿语义无法覆盖（货已签收）都必须靠对账与人工兜底，任何分布式事务方案都要留这道防线。',
  },
  {
    id: 'distributed-07-seata-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['全局锁', '线上排查'],
    scenario:
      '秒杀场景下，下单服务用 Seata AT 管理「写订单 + 扣库存」全局事务。压测发现：并发一上来，同一热门 SKU 的请求大量报全局锁等待与回滚，成功率不升反降，undo_log 写入量巨大；而数据库行锁等待并不明显，把全局事务超时从 30 秒调到 120 秒后只是失败来得更晚。',
    stem: '下列判断最贴近根因的是？',
    options: [
      { key: 'A', text: '数据库连接池不够，把连接池扩大即可' },
      { key: 'B', text: '所有请求都要改同一行库存，AT 的全局锁把热点行串行化了，冲突事务只能等待或回滚；应拆分热点库存、缩短全局事务范围，或改用 TCC 预留 / 消息最终一致' },
      { key: 'C', text: 'undo_log 表缺索引，加索引即可消除锁冲突' },
      { key: 'D', text: 'TC 节点太少，扩容 TC 就能让同一行库存的并发写不再冲突' },
    ],
    answers: ['B'],
    explanation:
      '关键线索是「同一热门 SKU + 全局锁等待 + 行锁等待不明显 + 调大超时只推迟失败」：AT 一阶段虽释放了本地行锁，但 TC 侧对 表名:主键 的全局锁仍要求同一时刻只有一个全局事务能改这行，热点行因此被串行化，并发越高冲突与回滚越多。A 错在行锁等待不明显，且连接池扩容只会让更多请求一起抢同一把全局锁。C 错在索引影响的是 undo_log 自身读写速度，改变不了「同一行必须互斥」这个语义。D 错在扩 TC 提升的是协调能力与可用性，锁的粒度仍由业务热点行决定。B 正确：库存按 SKU 分桶 / 预扣、把 RPC 与日志移出全局事务缩短持锁时间、对热点改用 TCC 预留或干脆走消息最终一致，都是常见解法；同时压测必须覆盖回滚路径，并配按 XID 的对账兜底。',
  },
  {
    id: 'distributed-07-seata-008',
    type: 'code',
    difficulty: 2,
    tags: ['Seata', '全局事务'],
    stem: `下面是下单服务的全局事务入口：

~~~java
@GlobalTransactional(timeoutMills = 30000, rollbackFor = Exception.class)
public OrderResult createOrder(OrderReq req) {
  orderMapper.insert(req);                 // 分支一：写订单
  try {
    stockClient.deduct(req.getSkuId());   // 分支二：扣库存
  } catch (Exception e) {
    log.warn("扣库存失败，先返回成功，后面人工补偿", e);
    return OrderResult.ok();             // 把异常吞掉
  }
  return OrderResult.ok();
}
~~~

下列说法正确的是？`,
    options: [
      { key: 'A', text: '方法正常返回，TM 会认为全局事务成功并提交；库存分支可能失败而订单已提交，异常被吞导致事务决议与业务结果不一致，应把异常抛出去让 TM 触发全局回滚' },
      { key: 'B', text: 'Seata 会扫描日志里的 warn 关键字并自动回滚' },
      { key: 'C', text: '只要加了 @GlobalTransactional，无论异常是否抛出都一定会回滚' },
      { key: 'D', text: 'catch 里的 return 会让本地事务自动回滚，所以数据仍然一致' },
    ],
    answers: ['A'],
    explanation:
      'TM 判断全局事务成败靠的是被 @GlobalTransactional 拦截的方法**有没有抛异常**：这里 catch 住异常并返回成功，TM 会下发全局提交，各分支异步删掉 undo_log，于是「订单写成功、库存扣减失败」被永久固化，而且连回滚的依据都被删了。A 正确：异常必须向上传播（或显式调用 GlobalTransactionContext 手动标记回滚），同时下游分支自己也不能吞异常或把操作放到事务外。B 错在框架不解析日志内容。C 错在注解只是开启全局事务，决议仍取决于异常与超时。D 错在 return 不会触发本地事务回滚，本地事务早在方法返回前就随一阶段提交了。这类「吞异常」正是上线后最难查的一类不一致，因为监控里既没有报错也没有回滚记录。',
  },
]
