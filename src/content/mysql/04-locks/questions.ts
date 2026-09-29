import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'mysql-04-locks-001',
    type: 'single',
    difficulty: 1,
    tags: ['行锁'],
    stem: 'InnoDB 的行级锁实际上是加在什么上面的？',
    options: [
      { key: 'A', text: '物理数据行上' },
      { key: 'B', text: '索引记录上' },
      { key: 'C', text: '事务对象上' },
      { key: 'D', text: '表空间上' },
    ],
    answers: ['B'],
    explanation:
      'InnoDB 行锁锁的是索引记录。若 UPDATE/DELETE 的 WHERE 没有可用索引，将全表扫描并对扫过的记录加锁，效果接近锁全表。A 是直觉误区，正是"锁索引"这一事实导致了"没索引就锁全表"。',
  },
  {
    id: 'mysql-04-locks-002',
    type: 'single',
    difficulty: 2,
    tags: ['临键锁'],
    stem: 'RR 隔离级别下，`SELECT * FROM t WHERE id = 10 FOR UPDATE`（id 是唯一索引且该行存在），加的是什么锁？',
    options: [
      { key: 'A', text: '临键锁 (10, 15]' },
      { key: 'B', text: '仅 id=10 的记录锁（临键锁退化为记录锁）' },
      { key: 'C', text: '间隙锁 (10, 15)' },
      { key: 'D', text: '表锁' },
    ],
    answers: ['B'],
    explanation:
      'RR 默认加临键锁，但唯一索引等值命中时，后续间隙不需要防插入，退化为纯记录锁。A 是等值"未命中"或非唯一索引场景的加法；C 只锁间隙用于防插入；D 只在无索引导致全表扫描时才近似发生。',
  },
  {
    id: 'mysql-04-locks-003',
    type: 'scenario',
    difficulty: 3,
    tags: ['行锁', '索引'],
    scenario:
      '上线后偶发接口超时，监控显示大量 `Lock wait timeout exceeded`；慢日志里有一条 `UPDATE orders SET status=1 WHERE remark = "x"`（remark 无索引）在高峰期执行。',
    stem: '根因与首选修复是？',
    options: [
      { key: 'A', text: '锁等待超时时间太短，调大 innodb_lock_wait_timeout 即可' },
      { key: 'B', text: '该 UPDATE 无索引可走，全表扫描给扫过的行全加了锁，阻塞其他更新；先限流止血，再给 remark 建索引（或改为按主键更新）' },
      { key: 'C', text: '隔离级别太高，把 RR 改成 RC 就不会锁冲突了' },
      { key: 'D', text: 'InnoDB 行锁有 bug，应改用 MyISAM' },
    ],
    answers: ['B'],
    explanation:
      '无索引 UPDATE 逐行加锁是典型的锁放大事故，超时只是表象。A 治标——等待更久反而堆积更多连接；RC 虽间隙锁更少但记录锁一样锁全表，C 不解决根因；D 错误结论。正确路径是先止血（kill 语句/限流），再补索引从根上收窄锁范围。',
  },
  {
    id: 'mysql-04-locks-004',
    type: 'code',
    difficulty: 2,
    tags: ['死锁'],
    stem: 'RR 隔离级别，表 t 有 id=1、id=2 两行。下面时序的最终结果是？\n\n~~~sql\n-- 事务 A                        -- 事务 B\nUPDATE t SET v=1 WHERE id=1;\n                                 UPDATE t SET v=2 WHERE id=2;\nUPDATE t SET v=1 WHERE id=2;\n                                 UPDATE t SET v=2 WHERE id=1;\n~~~',
    options: [
      { key: 'A', text: '四个 UPDATE 全部成功' },
      { key: 'B', text: '事务 B 的第二条 UPDATE 一直阻塞，事务 A 提交后成功' },
      { key: 'C', text: 'InnoDB 检测到死锁，回滚其中代价较小的事务，另一个继续' },
      { key: 'D', text: '两条 UPDATE 都失败，两事务都回滚' },
    ],
    answers: ['C'],
    explanation:
      'A 持有 id=1 等 id=2，B 持有 id=2 等 id=1，形成环路等待。InnoDB 默认开启死锁检测（innodb_deadlock_detect），主动回滚代价小的一方并返回 `Deadlock found` 错误，另一方正常推进——所以业务代码要能处理死锁重试。A/B 忽略了环路；D 不会两个都回滚。',
  },
  {
    id: 'mysql-04-locks-005',
    type: 'single',
    difficulty: 2,
    tags: ['乐观锁'],
    stem: '库存扣减在高并发下不想用数据库悲观锁，比较合适的乐观锁写法是？',
    options: [
      { key: 'A', text: '`UPDATE stock SET num = num - 1 WHERE id = 1`，靠行锁保证正确' },
      { key: 'B', text: '先 `SELECT num`，应用层判断后再 `UPDATE stock SET num = ? WHERE id = 1`' },
      { key: 'C', text: '带版本或数量条件的原子更新：`UPDATE stock SET num = num - 1 WHERE id = 1 AND num >= 1`，检查影响行数' },
      { key: 'D', text: '把库存加载到内存变量里扣减，定时回写数据库' },
    ],
    answers: ['C'],
    explanation:
      '乐观锁的本质是"提交时校验条件、失败即重试"：C 的条件更新是原子的，影响行数为 0 表示库存不足或已被别人改走。A 靠的是当前读行锁（悲观思路，但本身扣减其实也正确，只是不符合"乐观锁"问法）；B 的读和写之间数据可能已变（丢失更新）；D 是错误实现，会覆盖并发写入。',
  },
  {
    id: 'mysql-04-locks-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['间隙锁'],
    stem: '关于 RR 隔离级别下的间隙锁（Gap Lock），下列说法正确的有？',
    options: [
      { key: 'A', text: '间隙锁之间不冲突，两个事务可以同时对同一区间加间隙锁' },
      { key: 'B', text: '间隙锁的主要目的是防止其他事务在区间内插入新记录（防幻读）' },
      { key: 'C', text: 'RC 隔离级别下普通加锁不使用间隙锁' },
      { key: 'D', text: '间隙锁会锁住区间内的已有数据行，禁止读取' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      '间隙锁只锁"开区间里的空隙"，彼此兼容（这正是它曾引发插入意向死锁的原因），目的是封住插入入口；RC 级别基本不用间隙锁，所以 RC 死锁更少但可能幻读。D 错误——间隙锁不锁已存在的行，更不阻止普通读取。',
  },
  {
    id: 'mysql-04-locks-007',
    type: 'single',
    difficulty: 3,
    tags: ['MDL', 'DDL'],
    stem: '高峰期执行 `ALTER TABLE` 长时间卡住，随后整张表的增删改查也全部阻塞。最可能的链条是？',
    options: [
      { key: 'A', text: 'ALTER 前有长事务/未提交查询持有该表的 MDL 读锁，ALTER 申请 MDL 写锁被阻塞，后续所有新查询又排在写锁后面' },
      { key: 'B', text: 'ALTER 会锁住全表数据，查询自然要排队等它完成' },
      { key: 'C', text: '磁盘 IO 打满导致所有 SQL 变慢' },
      { key: 'D', text: '连接池耗尽，新连接进不来' },
    ],
    answers: ['A'],
    explanation:
      'MDL 写锁申请会被长事务挡住，而 MySQL 的锁队列让后续读请求也排在写锁之后，形成全表阻塞——这是 DDL 事故的经典机理。在线 DDL 期间多数操作并非全程锁表，B 说法不成立；IO 与连接池问题不会恰好只阻塞这张表的 DDL 链条。处置：kill 长事务，低峰或用 gh-ost/pt-osc 变更。',
  },
]
