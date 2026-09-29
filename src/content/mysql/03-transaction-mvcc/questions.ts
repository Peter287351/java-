import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'mysql-03-transaction-mvcc-001',
    type: 'single',
    difficulty: 1,
    tags: ['ACID'],
    stem: 'MySQL（InnoDB）中，事务的「原子性」主要依靠什么实现？',
    options: [
      { key: 'A', text: 'redo log（重做日志）' },
      { key: 'B', text: 'undo log（回滚日志）' },
      { key: 'C', text: 'binlog（归档日志）' },
      { key: 'D', text: 'Buffer Pool（缓冲池）' },
    ],
    answers: ['B'],
    explanation:
      '原子性靠 undo log：它记录反向操作，事务回滚时按链路逆序执行即可"当没发生过"。A 的 redo log 保证的是持久性（宕机重放已提交修改）；C 的 binlog 用于复制与恢复，不参与回滚；D 只是内存缓存，与原子性无关。',
  },
  {
    id: 'mysql-03-transaction-mvcc-002',
    type: 'single',
    difficulty: 1,
    tags: ['隔离级别'],
    stem: '事务 A 修改了一行但尚未提交，事务 B 却读到了这个修改后的值。B 读到的这是什么现象？',
    options: [
      { key: 'A', text: '脏读' },
      { key: 'B', text: '不可重复读' },
      { key: 'C', text: '幻读' },
      { key: 'D', text: '丢失更新' },
    ],
    answers: ['A'],
    explanation:
      '读到别人"未提交"的数据就是脏读，若对方最终回滚，这个值就是从未存在过的。B 的不可重复读指同一事务内两次读到"已提交事务修改"的不同值；C 的幻读指两次范围查询行数不同；D 指并发覆盖更新，均不符合"未提交"这一关键条件。',
  },
  {
    id: 'mysql-03-transaction-mvcc-003',
    type: 'single',
    difficulty: 2,
    tags: ['MVCC', 'ReadView'],
    stem: 'RC（读已提交）与 RR（可重复读）在 MVCC 实现上的本质区别是？',
    options: [
      { key: 'A', text: 'RC 用 undo log，RR 用 redo log' },
      { key: 'B', text: 'RC 每条 SELECT 生成一次 ReadView，RR 事务内第一次 SELECT 生成后全程复用' },
      { key: 'C', text: 'RC 只能读已提交数据，RR 可以读未提交数据' },
      { key: 'D', text: 'RC 加行锁，RR 不加锁' },
    ],
    answers: ['B'],
    explanation:
      'MVCC 可见性判断依赖 ReadView，两种级别唯一差别是生成时机：RC 一条语句一生成（所以能读到别人新提交的数据），RR 一次生成复用（所以事务内读到的数据一致）。A 混淆了日志职责；C 读未提交是 RU 级别；D 两种级别的普通 SELECT 都不加锁。',
  },
  {
    id: 'mysql-03-transaction-mvcc-004',
    type: 'multiple',
    difficulty: 2,
    tags: ['MVCC'],
    stem: 'InnoDB 的 MVCC 机制依赖下列哪些组件？',
    options: [
      { key: 'A', text: '行记录的隐藏字段 trx_id 与 roll_pointer' },
      { key: 'B', text: 'undo log 构成的版本链' },
      { key: 'C', text: 'ReadView（活跃事务视图）' },
      { key: 'D', text: 'binlog 的两阶段提交' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'MVCC 三件套：隐藏字段找到版本入口、undo 版本链提供历史版本、ReadView 决定哪个版本可见。D 的两阶段提交解决的是 redo log 与 binlog 的一致性问题，属于持久化/复制范畴，与 MVCC 无关。',
  },
  {
    id: 'mysql-03-transaction-mvcc-005',
    type: 'code',
    difficulty: 2,
    tags: ['MVCC', 'ReadView'],
    stem: '隔离级别为 RR，按下面时序执行，事务 A 中第二条 SELECT 的结果是什么？\n\n~~~sql\n-- 表 t 有一行 id=1, value=1\n-- 事务 A                            -- 事务 B\nBEGIN;\nSELECT value FROM t WHERE id=1;      -- ①\n                                     BEGIN;\n                                     UPDATE t SET value=2 WHERE id=1;\n                                     COMMIT;\nSELECT value FROM t WHERE id=1;      -- ②\n~~~',
    options: [
      { key: 'A', text: '2，因为事务 B 已提交' },
      { key: 'B', text: '1，RR 下事务 A 复用第一次查询的 ReadView，旧版本仍可见' },
      { key: 'C', text: '报错，行已被事务 B 锁定' },
      { key: 'D', text: '阻塞等待事务 B 释放锁' },
    ],
    answers: ['B'],
    explanation:
      '普通 SELECT 是快照读：A 在 ① 处生成 ReadView 后全程复用，② 仍沿版本链读到 value=1 的旧版本，这正是"可重复读"。A 是 RC 的表现；C/D 是当前读才可能遇到的情况，快照读不与锁冲突。',
  },
  {
    id: 'mysql-03-transaction-mvcc-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['MVCC', '幻读'],
    scenario:
      'RR 隔离级别下，账务核对任务用事务 A 先 `SELECT COUNT(*)` 得到 100 行，随后又执行 `UPDATE` 更新这批数据，却更新到了 101 行——多出的 1 行是核对开始后另一事务插入并已提交的。',
    stem: '对这个现象的解释与改进，最准确的是？',
    options: [
      { key: 'A', text: '说明 RR 幻读失效了，应改用 SERIALIZABLE 才能彻底避免' },
      { key: 'B', text: '快照读与当前读看到的"世界"不同：COUNT 走快照、UPDATE 走当前读；应改用 `SELECT ... FOR UPDATE`/`LOCK IN SHARE MODE` 让核对统一走当前读' },
      { key: 'C', text: '是 MVCC 的 bug，应升级 MySQL 版本' },
      { key: 'D', text: '应在 COUNT 前执行 `COMMIT` 让 ReadView 提前生成' },
    ],
    answers: ['B'],
    explanation:
      'RR 并非"没有幻读"：快照读靠 ReadView 屏蔽了新行，但 UPDATE 是当前读，读的是最新已提交数据，于是出现"先数后改对不上"。A 代价过大且没必要；C 是误诊，这是设计如此；D 荒谬——COMMIT 会结束自己的事务。正确做法是把核对改为显式锁定读（当前读），保证两次操作同一视角。',
  },
  {
    id: 'mysql-03-transaction-mvcc-007',
    type: 'single',
    difficulty: 3,
    tags: ['长事务'],
    stem: '线上出现一个持续 2 小时的只读长事务，最可能带来的直接危害是？',
    options: [
      { key: 'A', text: 'binlog 文件无限增长' },
      { key: 'B', text: 'undo log 版本链无法清理导致膨胀，且可能阻塞其他事务的 DDL 与清理线程' },
      { key: 'C', text: 'Buffer Pool 淘汰策略失效' },
      { key: 'D', text: '主从复制延迟立即归零' },
    ],
    answers: ['B'],
    explanation:
      'ReadView 存在期间，比它早的所有版本都要保留，undo 无法 purge，历史链变长、查询沿链回溯变慢；同时它持有的 MDL 等会阻塞 DDL。A binlog 按事务产生，与长事务无直接关系；C 无此机制；D 完全无关。',
  },
  {
    id: 'mysql-03-transaction-mvcc-008',
    type: 'single',
    difficulty: 2,
    tags: ['ReadView'],
    stem: 'ReadView 可见性判断中，某行的 trx_id 等于 ReadView 的 creator_trx_id，意味着什么？',
    options: [
      { key: 'A', text: '该版本对当前事务可见（自己改的）' },
      { key: 'B', text: '该版本不可见，需沿版本链回溯' },
      { key: 'C', text: '说明发生了脏读' },
      { key: 'D', text: '说明该行被加了排他锁' },
    ],
    answers: ['A'],
    explanation:
      'creator_trx_id 是生成 ReadView 的当前事务自己：自己做的修改对自己始终可见。B 是 trx_id 落在活跃列表（m_ids）中的情形；C、D 与可见性判断规则无关。',
  },
]
