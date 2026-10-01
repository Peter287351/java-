import type { SqlExercise } from '../../types'

/**
 * 手写 SQL 题库：从基础过滤到窗口函数 / 递归 CTE，循序渐进。
 * 每题 reference 为判分基准；alts 为独立写法的备用解法（校验脚本保证与 reference 结果一致）。
 */
export const sqlExercises: SqlExercise[] = [
  {
    id: 'sql-001',
    title: '高薪员工筛选',
    difficulty: 1,
    tags: ['WHERE', 'ORDER BY'],
    datasetId: 'hr',
    stem: '查询工资大于 10000 的员工姓名与工资，结果按工资从高到低排列，工资相同的按姓名升序排列。',
    reference: `SELECT name, salary FROM emp WHERE salary > 10000 ORDER BY salary DESC, name ASC;`,
    alts: [`SELECT name, salary FROM emp WHERE salary > 10000 ORDER BY 2 DESC, 1;`],
    hints: [
      '过滤用 WHERE，排序用 ORDER BY，多个排序字段用逗号分隔。',
      '降序是 DESC（默认是 ASC 升序），「工资相同按姓名升序」要写第二个排序键。',
    ],
    explanation:
      'WHERE 先过滤行，ORDER BY salary DESC, name ASC 再排序：先按工资降序，工资相同时按姓名字典序升序。列顺序按题目要求「姓名与工资」输出。',
    orderMatters: true,
  },
  {
    id: 'sql-002',
    title: '各部门人数统计',
    difficulty: 1,
    tags: ['LEFT JOIN', 'GROUP BY'],
    datasetId: 'hr',
    stem: '统计每个部门的员工人数，没有员工的部门也要出现且人数为 0。输出部门名、人数两列，按部门 id 升序排列（提示：部门表 dept 的 id）。',
    reference: `SELECT d.name AS dept_name, COUNT(e.id) AS cnt
FROM dept d
LEFT JOIN emp e ON e.dept_id = d.id
GROUP BY d.id, d.name
ORDER BY d.id ASC;`,
    alts: [
      `SELECT d.name AS dept_name, SUM(CASE WHEN e.id IS NULL THEN 0 ELSE 1 END) AS cnt
FROM dept d LEFT JOIN emp e ON e.dept_id = d.id
GROUP BY d.id, d.name ORDER BY d.id;`,
    ],
    hints: [
      '「没有员工的部门也要出现」→ 主表必须是 dept，用 LEFT JOIN。',
      'COUNT(*) 在无员工时会把 NULL 行也数成 1，应该 COUNT(emp 表的主键列)；GROUP BY 按部门分组。',
    ],
    explanation:
      'LEFT JOIN 保留没有员工的部门（财务部）；COUNT(e.id) 只统计非 NULL 的员工，无人部门自然为 0。若用 COUNT(*)，LEFT JOIN 产生的 NULL 行会被误计为 1——这是本题最大的坑。',
    orderMatters: true,
  },
  {
    id: 'sql-003',
    title: '部门工资冠军',
    difficulty: 2,
    tags: ['子查询', '窗口函数'],
    datasetId: 'hr',
    stem: '查询每个部门工资最高的员工（同薪并列都要查出），输出部门名、员工姓名、工资三列，按部门 id 升序、员工 id 升序排列。没有员工的部门不用出现。',
    reference: `SELECT d.name AS dept_name, e.name AS emp_name, e.salary
FROM (
  SELECT id, name, salary, dept_id,
         RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rk
  FROM emp
  WHERE dept_id IS NOT NULL
) e
JOIN dept d ON d.id = e.dept_id
WHERE e.rk = 1
ORDER BY e.dept_id ASC, e.id ASC;`,
    alts: [
      `SELECT d.name AS dept_name, e.name AS emp_name, e.salary
FROM emp e
JOIN dept d ON d.id = e.dept_id
WHERE e.salary = (SELECT MAX(e2.salary) FROM emp e2 WHERE e2.dept_id = e.dept_id)
ORDER BY e.dept_id, e.id;`,
    ],
    hints: [
      '「每组最大值且并列都要」既可以用相关子查询（工资 = 本部门最大工资），也可以用窗口函数 RANK()。',
      '窗口函数分组用 PARTITION BY dept_id，组内按工资降序编号，取 rk = 1。',
    ],
    explanation:
      '技术部李四、王五同为 20000 并列，所以用 RANK()（并列同名次）而不是 ROW_NUMBER()（会随机丢弃并列者）。相关子查询写法 WHERE salary = (SELECT MAX(...) WHERE 同部门) 结果等价。预期 4 行。',
    orderMatters: true,
  },
  {
    id: 'sql-004',
    title: '全公司第 3 高工资',
    difficulty: 2,
    tags: ['DENSE_RANK', '窗口函数'],
    datasetId: 'hr',
    stem: '查询全公司工资「第 3 高」的员工（相同工资算同一个名次，即第 1、2 高并列时后面仍是第 2 高——按不同薪值排序的第 3 位），输出姓名与工资，按工资降序、姓名升序排列。',
    reference: `SELECT name, salary FROM (
  SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rk
  FROM emp
) t
WHERE rk = 3
ORDER BY salary DESC, name ASC;`,
    alts: [
      `SELECT name, salary FROM emp
WHERE salary = (SELECT DISTINCT salary FROM emp ORDER BY salary DESC LIMIT 1 OFFSET 2)
ORDER BY salary DESC, name;`,
    ],
    hints: [
      '「相同工资算同一名次」是 DENSE_RANK 的语义（20000 两个人并列第 1，下一个是第 2）。',
      '全表无分组就 ORDER BY salary DESC，不需要 PARTITION BY。',
    ],
    explanation:
      '工资去重后从高到低是 20000、15000、12000，第 3 高是 12000（赵六）。注意 DENSE_RANK（并列挤占名次但不跳号）与 RANK（跳号）、ROW_NUMBER（强制不并列）的区别，这是高频面试题。',
    orderMatters: true,
  },
  {
    id: 'sql-005',
    title: '2021 年入职名单',
    difficulty: 1,
    tags: ['日期范围'],
    datasetId: 'hr',
    stem: '查询 2021 年入职的员工姓名与入职日期，按入职日期从早到晚排列。',
    reference: `SELECT name, hire_date FROM emp
WHERE hire_date >= '2021-01-01' AND hire_date < '2022-01-01'
ORDER BY hire_date ASC;`,
    alts: [
      `SELECT name, hire_date FROM emp WHERE substr(hire_date, 1, 4) = '2021' ORDER BY hire_date;`,
    ],
    hints: [
      '日期列是 TEXT 格式（YYYY-MM-DD），字符串比较天然按时间先后。',
      '范围写法 >= 起始 AND < 结束 可以利用索引（函数包列会失效），优于 substr/模糊匹配。',
    ],
    explanation:
      '命中 2021-03-01（张三）与 2021-11-20（赵六）两行。左闭右开区间 [2021-01-01, 2022-01-01) 是日期范围查询的标准写法；对列套函数（如 substr）在 MySQL 里同样会让索引失效，面试要能说出来。',
    orderMatters: true,
  },
  {
    id: 'sql-006',
    title: '年度入职人数行转列',
    difficulty: 2,
    tags: ['CASE WHEN', '行转列'],
    datasetId: 'hr',
    stem: '统计每个部门 2020、2021、2022、2023 四年各自的入职人数，输出为「部门、y2020、y2021、y2022、y2023」五列（行转列）。没有员工的部门输出全 0；没有部门的员工归入「未分配」一行。按部门 id 升序（未分配行排最后）。',
    reference: `SELECT COALESCE(d.name, '未分配') AS dept,
  SUM(CASE WHEN substr(e.hire_date, 1, 4) = '2020' THEN 1 ELSE 0 END) AS y2020,
  SUM(CASE WHEN substr(e.hire_date, 1, 4) = '2021' THEN 1 ELSE 0 END) AS y2021,
  SUM(CASE WHEN substr(e.hire_date, 1, 4) = '2022' THEN 1 ELSE 0 END) AS y2022,
  SUM(CASE WHEN substr(e.hire_date, 1, 4) = '2023' THEN 1 ELSE 0 END) AS y2023
FROM emp e
LEFT JOIN dept d ON d.id = e.dept_id
GROUP BY d.id, d.name
ORDER BY d.id IS NULL ASC, d.id ASC;`,
    hints: [
      '行转列的经典套路：SUM(CASE WHEN 条件 THEN 1 ELSE 0 END)。',
      '「未分配」要保留无部门员工 → emp 主表 LEFT JOIN dept；部门 id 为 NULL 的行分组后要 COALESCE 成「未分配」。',
    ],
    explanation:
      'GROUP BY d.id（NULL 归为一组），CASE WHEN 按年份拆列求和，一行一个部门、四列年份数据。MySQL 里的写法完全一致（可把 substr 换成 YEAR(hire_date)）。这是报表开发的高频题型。',
    orderMatters: true,
  },
  {
    id: 'sql-007',
    title: '部门内累计工资',
    difficulty: 3,
    tags: ['窗口函数', 'SUM OVER'],
    datasetId: 'hr',
    stem: '查询有部门的每位员工的部门名、姓名、工资，以及「所在部门内按工资从低到高累计的工资总和」（工资相同时按员工 id 顺序累计）。输出四列，按部门 id 升序、工资升序、员工 id 升序排列。',
    reference: `SELECT d.name AS dept_name, e.name AS emp_name, e.salary,
  SUM(e.salary) OVER (PARTITION BY e.dept_id ORDER BY e.salary ASC, e.id ASC) AS running_total
FROM emp e
JOIN dept d ON d.id = e.dept_id
ORDER BY e.dept_id ASC, e.salary ASC, e.id ASC;`,
    hints: [
      '「组内累计」是窗口函数 SUM() OVER (PARTITION BY ... ORDER BY ...) 的标志性用法。',
      'PARTITION BY dept_id 让每个部门独立累计；窗口内 ORDER BY salary, id 决定累计顺序。',
    ],
    explanation:
      '技术部：张三 15000→累计 15000；李四 20000→累计 35000；王五 20000→累计 55000。注意窗口内并列工资要用 id 作为第二排序键，否则并列行的累计顺序不确定。GROUP BY 做不了这种「带明细的累计」——这正是窗口函数存在的意义。',
    orderMatters: true,
  },
  {
    id: 'sql-008',
    title: '连续登录 3 天用户',
    difficulty: 3,
    tags: ['自连接', '连续问题'],
    datasetId: 'login',
    stem: '查询至少连续 3 天（自然日相邻）登录过的用户 uid，输出一列 uid，按 uid 升序。提示：判分引擎内置 DATEDIFF(a, b) 函数返回两个日期相差的天数（a-b），可直接使用。',
    reference: `SELECT DISTINCT a.uid FROM login a
JOIN login b ON a.uid = b.uid AND DATEDIFF(b.dt, a.dt) = 1
JOIN login c ON a.uid = c.uid AND DATEDIFF(c.dt, a.dt) = 2
ORDER BY a.uid ASC;`,
    alts: [
      `SELECT DISTINCT uid FROM (
  SELECT uid,
         CAST(julianday(dt) AS INTEGER) - ROW_NUMBER() OVER (PARTITION BY uid ORDER BY dt ASC) AS grp
  FROM login
) t
GROUP BY uid, grp
HAVING COUNT(*) >= 3
ORDER BY uid ASC;`,
    ],
    hints: [
      '「连续 N 天」的经典思路：以某一天为锚点，判断它后面的第 1、2 天是否都有登录记录（三个不同自然日构成连续 3 天）。',
      'DATEDIFF(b.dt, a.dt) = 1 表示 b 比 a 晚一天；锚点 a 连上 +1 天与 +2 天两条记录即连续 3 天。',
    ],
    explanation:
      'uid 1 在 01-05~01-08 连续 4 天、uid 3 在 01-02~01-05 连续 4 天，uid 2 最长只有 2 天（01-03~01-04），不符合。注意自连接要写成「锚点 +1 天、+2 天」的链式判断——若写成「两条记录都比锚点晚 1 天」，两条记录可以是同一行，会把连续 2 天误判成 3 天。另一常见解法是「日期减行号分组」（见备用思路）：连续区间的差值恒定，COUNT ≥ 3 即命中。本题预期输出 1、3 两行。',
    orderMatters: true,
  },
  {
    id: 'sql-009',
    title: '用户最近登录与次数',
    difficulty: 2,
    tags: ['GROUP BY', '聚合'],
    datasetId: 'login',
    stem: '查询每个用户的最近一次登录日期与累计登录次数，输出 uid、last_dt、cnt 三列，按 uid 升序排列。',
    reference: `SELECT uid, MAX(dt) AS last_dt, COUNT(*) AS cnt
FROM login
GROUP BY uid
ORDER BY uid ASC;`,
    hints: ['MAX 对 TEXT 日期同样取最大值；COUNT(*) 数行数。', '一列多聚合直接在 SELECT 里并列写出即可。'],
    explanation:
      'GROUP BY uid 后每行一个用户：MAX(dt) 是最近登录（日期字符串按字典序即时间序），COUNT(*) 是登录次数。uid1：2024-01-08 / 7 次；uid2：2024-01-08 / 4 次；uid3：2024-01-05 / 4 次。',
    orderMatters: true,
  },
  {
    id: 'sql-010',
    title: '客户消费汇总',
    difficulty: 2,
    tags: ['LEFT JOIN', 'COALESCE'],
    datasetId: 'shop',
    stem: '查询每位客户的下单次数与消费总金额，没有下过单的客户也要出现（次数与金额均为 0）。输出客户名、次数、总金额三列，按总金额从高到低排，总金额相同按客户名升序。',
    reference: `SELECT c.name AS cust_name,
  COUNT(o.id) AS cnt,
  COALESCE(SUM(o.amount), 0) AS total
FROM customer c
LEFT JOIN orders o ON o.cust_id = c.id
GROUP BY c.id, c.name
ORDER BY total DESC, c.name ASC;`,
    alts: [
      `SELECT c.name AS cust_name, COUNT(o.id) AS cnt, IFNULL(SUM(o.amount), 0) AS total
FROM customer c LEFT JOIN orders o ON o.cust_id = c.id
GROUP BY c.id, c.name ORDER BY total DESC, c.name;`,
    ],
    hints: [
      '未下单客户要出现 → customer LEFT JOIN orders；但 LEFT JOIN 后没有订单的客户 SUM(amount) 是 NULL。',
      'COALESCE(SUM(o.amount), 0) 把 NULL 转成 0；次数用 COUNT(o.id) 自动就是 0。',
    ],
    explanation:
      '刘强没有订单：LEFT JOIN 产生一行 NULL 订单，COUNT(o.id)=0、SUM 为 NULL 需转 0。若直接 SUM 不加 COALESCE 会输出 NULL——线上报表最经典的坑之一。预期 4 行，张伟、王芳并列 500 排前。',
    orderMatters: true,
  },
  {
    id: 'sql-011',
    title: '高频下单客户',
    difficulty: 2,
    tags: ['HAVING'],
    datasetId: 'shop',
    stem: '查询下单次数大于等于 2 次的客户姓名与下单次数，按次数降序、次数相同按姓名升序排列。',
    reference: `SELECT c.name AS cust_name, COUNT(o.id) AS cnt
FROM customer c
JOIN orders o ON o.cust_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(o.id) >= 2
ORDER BY cnt DESC, c.name ASC;`,
    hints: [
      '对分组后的结果过滤要用 HAVING，不能用 WHERE（WHERE 在分组前执行，且不能直接用聚合结果）。',
      'JOIN 在这里用内连接即可——未下单客户次数为 0，本来就不满足 >= 2。',
    ],
    explanation:
      'WHERE 过滤的是「原始行」，HAVING 过滤的是「分组后的聚合结果」——执行顺序 FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY。预期输出张伟、王芳两行。',
    orderMatters: true,
  },
  {
    id: 'sql-012',
    title: '消费冠军城市',
    difficulty: 3,
    tags: ['子查询', 'MAX'],
    datasetId: 'shop',
    stem: '查询消费总金额最高的城市（按客户的收货城市汇总其订单金额；可能有多个城市并列），输出城市名与总金额两列。',
    reference: `WITH city_total AS (
  SELECT c.city, SUM(o.amount) AS total
  FROM orders o
  JOIN customer c ON c.id = o.cust_id
  GROUP BY c.city
)
SELECT city, total FROM city_total
WHERE total = (SELECT MAX(total) FROM city_total);`,
    alts: [
      `SELECT city, total FROM (
  SELECT c.city, SUM(o.amount) AS total,
         RANK() OVER (ORDER BY SUM(o.amount) DESC) AS rk
  FROM orders o JOIN customer c ON c.id = o.cust_id
  GROUP BY c.city
) t WHERE rk = 1;`,
    ],
    hints: [
      '先求每个城市的总金额（GROUP BY city），再从中挑出等于最大值的城市。',
      '最大值要从「聚合后的中间结果」里取，可以对子查询（或 CTE）再套 MAX，不能直接 MAX(SUM(...))。',
    ],
    explanation:
      '北京（张伟 500）与上海（王芳 500）并列第一，所以要「= MAX」而不是 LIMIT 1——这也是本题考并列的意义。预期 2 行。窗口函数 RANK() OVER (ORDER BY SUM(...) DESC) 取 rk=1 是另一种写法。',
    orderMatters: false,
  },
  {
    id: 'sql-013',
    title: '订单环比差额',
    difficulty: 3,
    tags: ['LAG', '窗口函数'],
    datasetId: 'shop',
    stem: '查询每位客户按下单时间先后（同一天按订单 id）排列的订单流水，并计算每笔订单与该客户上一笔订单的金额差额（首单差额记 0）。输出客户名、订单 id、金额、差额四列，按客户 id、下单时间、订单 id 排序。',
    reference: `SELECT c.name AS cust_name, o.id AS order_id, o.amount,
  COALESCE(o.amount - LAG(o.amount) OVER (
    PARTITION BY o.cust_id ORDER BY o.created ASC, o.id ASC
  ), 0) AS diff
FROM orders o
JOIN customer c ON c.id = o.cust_id
ORDER BY o.cust_id ASC, o.created ASC, o.id ASC;`,
    hints: [
      '取「上一行」用 LAG() 窗口函数，按客户分组（PARTITION BY cust_id）、组内按时间排序。',
      '首单没有上一笔，LAG 返回 NULL，用 COALESCE(..., 0) 收尾。',
    ],
    explanation:
      '张伟：300→0、200→-100（比上一单少 100）；王芳：350→0、150→-200；李娜：100→0。LAG/LEAD 是「同比环比」类面试题的标准工具，MySQL 8.0 起才支持，老版本要靠自连接模拟。',
    orderMatters: true,
  },
  {
    id: 'sql-014',
    title: '员工与直属上级',
    difficulty: 2,
    tags: ['自连接', 'LEFT JOIN'],
    datasetId: 'staff',
    stem: '查询每位员工的姓名及其直属上级的姓名（CEO 没有上级，显示「无」）。输出员工名、上级名两列，按员工 id 升序排列。提示：staff 表 manager_id 指向同表的 id。',
    reference: `SELECT s.name AS emp_name, COALESCE(m.name, '无') AS manager_name
FROM staff s
LEFT JOIN staff m ON m.id = s.manager_id
ORDER BY s.id ASC;`,
    hints: [
      '同一张表连自己：staff 自连接，ON m.id = s.manager_id。',
      'CEO 的 manager_id 是 NULL，LEFT JOIN 后上级名为 NULL，用 COALESCE 显示「无」。',
    ],
    explanation:
      '自连接是查询「层级/成对关系」的基本功：s 是员工视角、m 是上级视角，一张表当两张表用。注意必须 LEFT JOIN——CEO 用内连接会凭空消失，整条管理链从根断掉。',
    orderMatters: true,
  },
  {
    id: 'sql-015',
    title: '全员下属人数（递归）',
    difficulty: 3,
    tags: ['递归 CTE', '树形结构'],
    datasetId: 'staff',
    stem: '统计每位员工的全部下属人数（直接下属 + 间接下属，例如张总下属包含总监、经理、主管与员工），输出姓名与下属人数两列，按人数从多到少排，人数相同按员工 id 升序。提示：使用 WITH RECURSIVE 从每人出发沿 manager_id 向下递归。',
    reference: `WITH RECURSIVE sub(root, sid) AS (
  SELECT id, id FROM staff
  UNION ALL
  SELECT sub.root, e.id FROM staff e JOIN sub ON e.manager_id = sub.sid
)
SELECT st.name AS emp_name, COUNT(sub.sid) - 1 AS cnt
FROM staff st
JOIN sub ON sub.root = st.id
GROUP BY st.id, st.name
ORDER BY cnt DESC, st.id ASC;`,
    alts: [
      `WITH RECURSIVE sub(root, sid) AS (
  SELECT id, id FROM staff
  UNION ALL
  SELECT sub.root, e.id FROM staff e JOIN sub ON e.manager_id = sub.sid
)
SELECT st.name AS emp_name, COUNT(sub.sid) - 1 AS cnt
FROM staff st
LEFT JOIN sub ON sub.root = st.id
GROUP BY st.id, st.name
ORDER BY cnt DESC, st.id;`,
    ],
    hints: [
      '递归 CTE 结构：起点（每人自己）UNION ALL 递归部分（下属的下属不断并入）。',
      '每人自己的那一行也要计入子集合，最后 COUNT - 1 就是纯下属数；COUNT 要按 root 分组。',
    ],
    explanation:
      '张总 7 人、李总监 4 人（赵经理→钱主管→孙/周）、赵经理 3 人、钱主管 2 人、王总监 1 人、其余 0。递归 CTE 是 MySQL 8.0 / SQLite 3.8.3+ 的能力，也是「组织架构树」「评论楼中楼」类需求的标准解法。',
    orderMatters: true,
  },
  {
    id: 'sql-016',
    title: '从未下单的客户',
    difficulty: 2,
    tags: ['NOT EXISTS', '反连接'],
    datasetId: 'shop',
    stem: '查询从未下过单的客户姓名与所在城市，输出两列，按客户 id 升序排列。',
    reference: `SELECT c.name, c.city FROM customer c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.cust_id = c.id)
ORDER BY c.id ASC;`,
    alts: [
      `SELECT c.name, c.city FROM customer c
LEFT JOIN orders o ON o.cust_id = c.id
WHERE o.id IS NULL
ORDER BY c.id;`,
    ],
    hints: [
      '「从未做过某事」两类写法：NOT EXISTS 子查询，或 LEFT JOIN 后判断右表主键 IS NULL。',
      '注意不能写 NOT IN (SELECT cust_id FROM orders)——一旦子查询结果含 NULL，NOT IN 会全表落空，这是著名陷阱。',
    ],
    explanation:
      '预期只有刘强（广州）。NOT EXISTS 与 LEFT JOIN ... IS NULL 是「反连接」的两种标准实现；NOT IN 遇到 NULL 的行为是高频面试坑：NULL 参与比较结果为 UNKNOWN，导致整个 NOT IN 恒为假。',
    orderMatters: true,
  },
]
