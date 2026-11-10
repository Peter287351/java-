import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'ops-practice-02-log-sql-001',
    type: 'single',
    difficulty: 1,
    tags: ['时间桶'],
    stem: `日志时间列 ts 是 TEXT 格式 2024-06-01 09:05:12，按分钟聚合通常写？`,
    options: [
      { key: 'A', text: 'GROUP BY substr(ts, 1, 16)' },
      { key: 'B', text: 'GROUP BY ts' },
      { key: 'C', text: 'GROUP BY substr(ts, 1, 4)' },
      { key: 'D', text: 'GROUP BY status' },
    ],
    answers: ['A'],
    explanation: `前 16 位正好是 YYYY-MM-DD HH:MM，按分钟切桶。B 会精确到秒，C 是按年，D 按状态码分组。`,
  },
  {
    id: 'ops-practice-02-log-sql-002',
    type: 'single',
    difficulty: 1,
    tags: ['5xx'],
    stem: `筛选 5xx 请求，最直接的 WHERE 条件是？`,
    options: [
      { key: 'A', text: "level = 'ERROR'" },
      { key: 'B', text: 'status >= 500 AND status < 600' },
      { key: 'C', text: 'latency_ms > 1000' },
      { key: 'D', text: "version = 'v2'" },
    ],
    answers: ['B'],
    explanation: `5xx 是状态码范围，status >= 500 且 < 600 最精确。A 依赖日志级别，可能与状态码不一致；C 是慢请求；D 是版本筛选。`,
  },
  {
    id: 'ops-practice-02-log-sql-003',
    type: 'single',
    difficulty: 2,
    tags: ['错误率'],
    stem: `在 SQLite 里算 5xx 占比百分数，下面哪种写法不会得到 0？`,
    options: [
      { key: 'A', text: 'SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) / COUNT(*)' },
      { key: 'B', text: '100.0 * SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) / COUNT(*)' },
      { key: 'C', text: 'COUNT(*) / SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END)' },
      { key: 'D', text: 'ROUND(COUNT(*) / 100, 2)' },
    ],
    answers: ['B'],
    explanation: `整数相除会截断，先乘 100.0 让分子变浮点才能保留小数。A 大多数情况得 0，C 算的是倒数，D 与错误数无关。`,
  },
  {
    id: 'ops-practice-02-log-sql-004',
    type: 'single',
    difficulty: 2,
    tags: ['版本关联'],
    stem: `把错误日志关联到发布记录，正确的连接条件是？`,
    options: [
      { key: 'A', text: '只按 service 相等' },
      { key: 'B', text: 'service 相等且 version 相等' },
      { key: 'C', text: '只按 deployed_at 相等' },
      { key: 'D', text: '按 trace_id 相等' },
    ],
    answers: ['B'],
    explanation: `一个服务会有多个版本，只按 service 连接会把所有错误算到每次发布上；必须 service + version 双条件。A 是最常见错误，C、D 字段对不上。`,
  },
  {
    id: 'ops-practice-02-log-sql-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['SQL 定位'],
    stem: `用 SQL 定位一次线上故障，合理的步骤有哪些？`,
    options: [
      { key: 'A', text: '按服务聚合错误数，找出嫌疑服务' },
      { key: 'B', text: '按分钟分桶统计 5xx，找到峰值时间' },
      { key: 'C', text: '按 service + version 关联发布记录，定位可疑版本' },
      { key: 'D', text: '直接 SELECT * 全表导出再用肉眼逐行找' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 分别回答「谁、什么时候、哪次变更」。D 在日志量稍大时就不可行，也没有回答任何定位问题。`,
  },
  {
    id: 'ops-practice-02-log-sql-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['故障定位'],
    scenario: `按分钟分桶发现 09:05 的 5xx 数从平时的 0~1 条涨到 3 条，同一分钟 deploy 表里有 order 服务 v2 的发布记录；最慢的 3 条请求也都属于 v2。`,
    stem: `最合理的结论与动作是？`,
    options: [
      { key: 'A', text: '数据库磁盘满了，先扩容' },
      { key: 'B', text: '高度怀疑 v2 引入故障，先回滚 v2 止血，再按版本对比错误分布与慢调用栈定位根因' },
      { key: 'C', text: '客户端网络波动，等待自动恢复' },
      { key: 'D', text: '把日志级别改成 DEBUG 就能解决' },
    ],
    answers: ['B'],
    explanation: `时间线、版本、慢请求三条证据都指向新版本，先回滚恢复服务，再查根因。A、C 与证据不符，D 只增加日志量。`,
  },
  {
    id: 'ops-practice-02-log-sql-007',
    type: 'code',
    difficulty: 3,
    tags: ['SQL 判读'],
    stem: `读下面查询，它回答的排障问题是？

~~~sql
SELECT substr(ts, 1, 16) AS minute, COUNT(*) AS cnt
FROM service_log
WHERE status >= 500
GROUP BY substr(ts, 1, 16)
ORDER BY cnt DESC, minute ASC;
~~~`,
    options: [
      { key: 'A', text: '哪一分钟的 5xx 请求最多（故障爆发的时间窗口）' },
      { key: 'B', text: '哪个服务的错误最多' },
      { key: 'C', text: '哪个版本引入了错误' },
      { key: 'D', text: '哪台机器心跳异常' },
    ],
    answers: ['A'],
    explanation: `按分钟分桶 + 只筛 5xx + 按条数降序，输出的是错误最密集的时间窗口。B 需要 GROUP BY service，C 需要 JOIN deploy，D 要查 heartbeat。`,
  },
]
