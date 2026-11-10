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
    commonMistakes: [
      {
        pattern: 'COUNT\\(\\s*\\*\\s*\\)',
        hint: '本题用了 LEFT JOIN：没有员工的部门会连出一行全 NULL 的记录，COUNT(*) 会把它也数成 1（财务部人数错成 1）。统计员工应改用 COUNT(e.id)——NULL 不计数，「COUNT(*) 与 COUNT(列)」的语义差异正是本题考点。',
      },
    ],
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
    commonMistakes: [
      {
        pattern: 'ROW_NUMBER',
        hint: 'ROW_NUMBER() 给并列工资强行编不同序号，名次会错位。题目明确「相同工资算同一名次」——应搭配 DENSE_RANK()（并列同名次、不跳号）。',
      },
    ],
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
    commonMistakes: [
      {
        pattern: 'DATEDIFF\\(\\s*a\\.dt,\\s*b\\.dt\\)\\s*=\\s*1[\\s\\S]*DATEDIFF\\(\\s*c\\.dt,\\s*b\\.dt\\)\\s*=\\s*1',
        hint: '「两条记录都比锚点 b 晚 1 天」的自连接里，a 和 c 可以是同一行——连续 2 天就会被误判成 3 天（uid 2 的 01-03/01-04 就中招）。要写成锚点链式判断：a 连 b（+1 天）、同一个锚点 a 连 c（+2 天），保证是三个不同自然日。',
      },
    ],
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
    commonMistakes: [
      {
        pattern: 'LIMIT\\s+1\\b',
        hint: 'LIMIT 1 在并列时只能取到其中一个城市，会漏掉并列冠军。保留全部并列的写法：WHERE total = (SELECT MAX(total) ...) 或 RANK() 窗口取 rk = 1。',
      },
    ],
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
    commonMistakes: [
      {
        pattern: 'NOT\\s+IN',
        hint: 'NOT IN 的子查询结果一旦含 NULL，整个 NOT IN 恒为假、查询返回空集（NULL 参与比较的结果是 UNKNOWN，NOT UNKNOWN 仍是 UNKNOWN）。更稳妥的写法是 NOT EXISTS 或 LEFT JOIN ... IS NULL。',
      },
    ],
  },
  {
    id: 'sql-017',
    title: '三表联查订单明细',
    difficulty: 2,
    tags: ['多表 JOIN'],
    datasetId: 'shop',
    stem: '查询每笔订单的订单 id、客户姓名、商品名称、金额四列，按订单 id 升序排列。',
    reference: `SELECT o.id AS order_id, c.name AS cust_name, p.name AS product_name, o.amount
FROM orders o
JOIN customer c ON c.id = o.cust_id
JOIN product p ON p.id = o.product_id
ORDER BY o.id ASC;`,
    alts: [
      `SELECT o.id AS order_id, c.name AS cust_name, p.name AS product_name, o.amount
FROM customer c
JOIN orders o ON o.cust_id = c.id
JOIN product p ON p.id = o.product_id
ORDER BY o.id;`,
    ],
    hints: [
      '订单表是「中间表」，分别 JOIN 客户表与商品表，各自用外键等值连接。',
      '三表都起了别名（o/c/p），SELECT 里跨表取列要带别名前缀。',
    ],
    explanation:
      '多表 JOIN 按外键链路逐表连接：orders → customer（cust_id）、orders → product（product_id）。连接条件必须逐对写清，漏一个 JOIN 条件就会产生笛卡尔积——这也是行数暴增问题的第一嫌疑。',
    orderMatters: true,
  },
  {
    id: 'sql-018',
    title: '工资高于直属上级的员工',
    difficulty: 3,
    tags: ['自连接', '不等值连接'],
    datasetId: 'staff',
    stem: 'staff 表含工资列。查询工资高于自己直属上级的员工，输出员工名、员工工资、上级名、上级工资四列，按员工 id 升序排列。',
    reference: `SELECT e.name AS emp_name, e.salary AS emp_salary,
  m.name AS mgr_name, m.salary AS mgr_salary
FROM staff e
JOIN staff m ON m.id = e.manager_id
WHERE e.salary > m.salary
ORDER BY e.id ASC;`,
    hints: [
      '自连接除了「等值连接取上级」，还可以在 WHERE 里做不等值比较（> / <）。',
      '两个员工视图 e（下属）与 m（上级）通过 ON m.id = e.manager_id 相连。',
    ],
    explanation:
      '自连接 + 不等值比较是经典面试题（LeetCode「高于经理的员工」同款）：e 是员工视角、m 是其上级，WHERE e.salary > m.salary 完成跨行比较。CEO 没有上级，内连接自动排除。预期只有吴员工（18000 > 王总监 15000）。',
    orderMatters: true,
  },
  {
    id: 'sql-019',
    title: '部门工资前两档',
    difficulty: 3,
    tags: ['DENSE_RANK', 'TopN'],
    datasetId: 'hr',
    stem: '查询每个部门工资最高的前两档（不同薪值，同薪并列都保留），输出部门名、姓名、工资、名次四列，按部门 id、名次、员工 id 升序排列。',
    reference: `SELECT d.name AS dept_name, t.name AS emp_name, t.salary, t.rk
FROM (
  SELECT id, name, salary, dept_id,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rk
  FROM emp
  WHERE dept_id IS NOT NULL
) t
JOIN dept d ON d.id = t.dept_id
WHERE t.rk <= 2
ORDER BY t.dept_id ASC, t.rk ASC, t.id ASC;`,
    alts: [
      `SELECT d.name AS dept_name, e.name AS emp_name, e.salary,
  (SELECT COUNT(DISTINCT e2.salary) FROM emp e2
   WHERE e2.dept_id = e.dept_id AND e2.salary > e.salary) + 1 AS rk
FROM emp e
JOIN dept d ON d.id = e.dept_id
WHERE (SELECT COUNT(DISTINCT e2.salary) FROM emp e2
       WHERE e2.dept_id = e.dept_id AND e2.salary > e.salary) + 1 <= 2
ORDER BY e.dept_id, rk, e.id;`,
    ],
    commonMistakes: [
      {
        pattern: 'ROW_NUMBER',
        hint: 'ROW_NUMBER() 把并列工资强行编成不同名次，会漏掉并列的人（20000 的两人只剩一个）。题目要求「同薪并列都保留」——应搭配 DENSE_RANK()。',
      },
      {
        pattern: 'RANK',
        hint: 'RANK() 并列后跳号（1,1,3），rk<=2 会漏掉第 2 档的员工。「不同薪值前两档且并列保留」对应 DENSE_RANK()（1,1,2）。',
      },
    ],
    hints: [
      '「前 N 档且并列保留」标准解法：DENSE_RANK() OVER (PARTITION BY 部门 ORDER BY 工资 DESC)，外层过滤 rk <= N。',
      'ROW_NUMBER 不保留并列、RANK 并列后跳号，两者在本题都会丢人——选错窗口函数是本题的埋点。',
    ],
    explanation:
      '预期 6 行：技术部 李四/王五（第 1 档并列）+ 张三（第 2 档）、销售部 赵六/钱七、人事部 孙八。备用解法用「比我工资高的不同薪值个数 + 1」模拟密集名次，结果与窗口函数一致。这是「每组前 N」面试题的标准变体。',
    orderMatters: true,
  },
  {
    id: 'sql-020',
    title: '高于平均工资',
    difficulty: 2,
    tags: ['标量子查询', 'AVG'],
    datasetId: 'hr',
    stem: '查询工资高于全公司平均工资的员工姓名与工资，按工资降序、姓名升序排列。注意：WHERE 里不能直接写聚合函数。',
    reference: `SELECT name, salary FROM emp
WHERE salary > (SELECT AVG(salary) FROM emp)
ORDER BY salary DESC, name ASC;`,
    alts: [
      `WITH avg_sal AS (SELECT AVG(salary) AS a FROM emp)
SELECT name, salary FROM emp, avg_sal
WHERE salary > avg_sal.a
ORDER BY salary DESC, name;`,
    ],
    hints: [
      '聚合结果要先算出来再比较：放在子查询里 (SELECT AVG(salary) FROM emp) 作为标量。',
      'WHERE salary > AVG(salary) 会直接报错——聚合函数不能出现在 WHERE 中。',
    ],
    explanation:
      '全公司平均约 13428.6，高于它的有李四、王五（20000）与张三（15000）共 3 行。这个「先聚合、再比较」的模式是 AVG/SUM 对比类题目的通用模板，也可以用 CTE 写得更清晰。',
    orderMatters: true,
  },
  {
    id: 'sql-021',
    title: '条件合并查询（UNION）',
    difficulty: 2,
    tags: ['UNION', '集合运算'],
    datasetId: 'hr',
    stem: '查询「2021 年入职」以及「工资不低于 15000」的员工（两个条件取并集且去重），输出姓名与工资，按工资降序、姓名升序排列。',
    reference: `SELECT name, salary FROM emp
WHERE hire_date >= '2021-01-01' AND hire_date < '2022-01-01'
UNION
SELECT name, salary FROM emp
WHERE salary >= 15000
ORDER BY salary DESC, name ASC;`,
    alts: [
      `SELECT name, salary FROM emp
WHERE (hire_date >= '2021-01-01' AND hire_date < '2022-01-01') OR salary >= 15000
ORDER BY salary DESC, name;`,
    ],
    commonMistakes: [
      {
        pattern: 'UNION\\s+ALL',
        hint: 'UNION ALL 不去重：张三同时满足两个条件会出现两次。题目要求「合并去重」，应改用 UNION（等价于对合并结果做 DISTINCT）。',
      },
    ],
    hints: [
      '两个 SELECT 列数与列类型必须一致，才能 UNION；去重是 UNION 的默认行为。',
      '张三两个条件都满足——用 UNION 会只剩一行，用 UNION ALL 会出现两行，这正是二者的区别。',
    ],
    explanation:
      '2021 年入职：张三、赵六；工资 ≥15000：李四、王五、张三。UNION 去重后 4 行（张三只出现一次）。UNION 会隐式排序去重、开销更大；确认不需要去重时用 UNION ALL 性能更好——面试常问这个取舍。',
    orderMatters: true,
  },
  {
    id: 'sql-022',
    title: '最近下单距今几天',
    difficulty: 2,
    tags: ['日期函数', 'MAX'],
    datasetId: 'shop',
    stem: '以 2024-02-01 为基准日，查询每位下过单的客户最近一次下单日期与距基准日的天数（用引擎内置 DATEDIFF(基准日, 日期) 计算）。输出客户名、最近下单日、间隔天数三列，按间隔天数升序、客户名升序排列。',
    reference: `SELECT c.name AS cust_name, MAX(o.created) AS last_dt,
  DATEDIFF('2024-02-01', MAX(o.created)) AS days_ago
FROM customer c
JOIN orders o ON o.cust_id = c.id
GROUP BY c.id, c.name
ORDER BY days_ago ASC, c.name ASC;`,
    hints: [
      '先用 GROUP BY 客户求 MAX(created)（最近一单），再对聚合结果做日期差。',
      'DATEDIFF 第一个参数是基准日（被减数），结果是「基准日 - 日期」的天数。',
    ],
    explanation:
      '聚合之后才能算差值：王芳 01-20（12 天）、李娜 01-15（17 天）、张伟 01-12（20 天）。MySQL 里对应 DATEDIFF(a, b)（语义相同）；若要跨月跨年精确天数，日期差函数是最直接的方案。',
    orderMatters: true,
  },
  {
    id: 'sql-023',
    title: '下过大额订单的客户',
    difficulty: 2,
    tags: ['EXISTS', '相关子查询'],
    datasetId: 'shop',
    stem: '查询下过金额 ≥ 300 订单的客户姓名与所在城市，按客户 id 升序排列。',
    reference: `SELECT c.name, c.city FROM customer c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.cust_id = c.id AND o.amount >= 300)
ORDER BY c.id ASC;`,
    alts: [
      `SELECT DISTINCT c.name, c.city FROM customer c
JOIN orders o ON o.cust_id = c.id
WHERE o.amount >= 300
ORDER BY c.id;`,
    ],
    hints: [
      '「存在满足条件的记录」用 EXISTS + 相关子查询：子查询里引用外层 c.id 逐行判断。',
      'EXISTS 只关心子查询有没有结果行，SELECT 1 是约定写法，不需要真的取列。',
    ],
    explanation:
      '张伟（300）、王芳（350）命中。JOIN 写法必须配 DISTINCT（一客户多笔大额订单会重复出现），EXISTS 天然不重复且找到第一行就短路，语义与性能都是面试高频考点。',
    orderMatters: true,
  },
  {
    id: 'sql-024',
    title: '客户消费排名（CTE + 窗口）',
    difficulty: 3,
    tags: ['CTE', 'ROW_NUMBER'],
    datasetId: 'shop',
    stem: '统计每位下过单客户的消费总额，并用 ROW_NUMBER 按总额降序（同额按姓名升序）编排名。输出客户名、总额、排名三列，按排名升序排列。使用 WITH 子句（CTE）分两步完成。',
    reference: `WITH cust_total AS (
  SELECT c.id, c.name, SUM(o.amount) AS total
  FROM customer c
  JOIN orders o ON o.cust_id = c.id
  GROUP BY c.id, c.name
)
SELECT name, total, ROW_NUMBER() OVER (ORDER BY total DESC, name ASC) AS rk
FROM cust_total
ORDER BY rk ASC;`,
    hints: [
      'CTE 把「聚合」与「排名」拆成两步：先在 WITH 里算出每客户总额，再对中间结果开窗编号。',
      'ROW_NUMBER 需要明确的排序规则：OVER (ORDER BY total DESC, name ASC)，并列时靠姓名稳定次序。',
    ],
    explanation:
      '张伟 500（第 1）、王芳 500（第 2）、李娜 100（第 3）——ROW_NUMBER 强制不并列，所以并列总额也分先后（这正是它与 RANK/DENSE_RANK 的差异）。CTE 让复杂查询「先做什么、再做什么」一目了然，是复杂 SQL 工程化的基本功。',
    orderMatters: true,
  },
  {
    id: 'sql-025',
    title: '入职年份去重',
    difficulty: 1,
    tags: ['DISTINCT'],
    datasetId: 'hr',
    stem: '查询有哪些年份有员工入职（对年份去重），输出一列年份，按年份升序排列。提示：用 substr(hire_date, 1, 4) 取年份。',
    reference: `SELECT DISTINCT substr(hire_date, 1, 4) AS hire_year
FROM emp
ORDER BY hire_year ASC;`,
    alts: [
      `SELECT substr(hire_date, 1, 4) AS hire_year FROM emp
GROUP BY substr(hire_date, 1, 4)
ORDER BY hire_year;`,
    ],
    hints: [
      'DISTINCT 对 SELECT 的结果去重；DISTINCT 必须紧跟 SELECT 关键字。',
      'GROUP BY 同一列也能实现去重，二者在这里等价。',
    ],
    explanation:
      '预期 2020、2021、2022、2023 四行。DISTINCT 与 GROUP BY 的去重等价，但语义上「纯去重」用 DISTINCT 更清晰；GROUP BY 通常伴随聚合。注意 DISTINCT 写在多列时是对「整行组合」去重。',
    orderMatters: true,
  },

  /* ========== 运维排障场景：用 SQL 从日志、发布记录、心跳里定位故障 ========== */
  {
    id: 'sql-026',
    title: '错误日志最多的服务',
    difficulty: 1,
    tags: ['运维排障', 'GROUP BY'],
    datasetId: 'ops',
    stem: '线上告警「服务报错变多」。先按服务统计 ERROR 级别日志条数，输出服务名、错误数两列，按错误数降序、服务名升序排列。提示：level 取值为 INFO / WARN / ERROR。',
    reference: `SELECT service, COUNT(*) AS err_cnt
FROM service_log
WHERE level = 'ERROR'
GROUP BY service
ORDER BY err_cnt DESC, service ASC;`,
    alts: [
      `SELECT service, COUNT(id) AS err_cnt FROM service_log
WHERE level = 'ERROR' GROUP BY service ORDER BY COUNT(id) DESC, service;`,
    ],
    hints: [
      '先按 level 过滤出 ERROR 日志，再 GROUP BY service 按服务分组。',
      '排序写成「错误数降序 + 服务名升序」结果才稳定；ORDER BY 可以直接引用 SELECT 里的别名。',
    ],
    explanation:
      '排障第一步永远是「先聚合、再定位」：order 服务 6 条 ERROR、gateway 1 条、payment 1 条，user 服务没有错误日志所以不出现。注意 WHERE 过滤原始行、GROUP BY 分组、ORDER BY 排序的执行顺序；把 level 条件写进 HAVING 是错的——HAVING 过滤的是分组后的结果。',
    orderMatters: true,
    commonMistakes: [
      {
        pattern: 'GROUP\\s+BY\\s+level',
        hint: '按 level 分组得到的是「每种日志级别各几条」，不是「每个服务报了多少错」。题目要按服务定位，应该 GROUP BY service。',
      },
    ],
  },
  {
    id: 'sql-027',
    title: '各服务 5xx 错误率',
    difficulty: 2,
    tags: ['运维排障', '条件聚合'],
    datasetId: 'ops',
    stem: '统计每个服务的总请求数、5xx（status >= 500）请求数以及 5xx 占比百分数（保留两位小数，例如 60 表示 60%），输出服务名、总数、5xx 数、占比四列，按占比降序、服务名升序排列。',
    reference: `SELECT service,
  COUNT(*) AS total,
  SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) AS err_5xx,
  ROUND(100.0 * SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) / COUNT(*), 2) AS err_rate
FROM service_log
GROUP BY service
ORDER BY err_rate DESC, service ASC;`,
    alts: [
      `WITH s AS (
  SELECT service, COUNT(*) AS total,
         SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) AS err_5xx
  FROM service_log GROUP BY service
)
SELECT service, total, err_5xx, ROUND(err_5xx * 100.0 / total, 2) AS err_rate
FROM s ORDER BY err_rate DESC, service;`,
    ],
    hints: [
      '条件计数用 SUM(CASE WHEN 条件 THEN 1 ELSE 0 END)，一次扫描同时算出总请求数与 5xx 数。',
      'SQLite 里两个整数相除会截断成整数：要写成 100.0 * ... / COUNT(*)（或先乘 1.0），再用 ROUND(..., 2) 保留两位小数。',
    ],
    explanation:
      'order 服务 10 次请求中 6 次 5xx → 60，payment 1/3 → 33.33，gateway 1/4 → 25，user 0/3 → 0。这是线上 SLO 错误率报表的标准写法：条件聚合避免多次扫描；整数除法陷阱在 MySQL / SQLite 都要留意，分子先变成浮点才不会算成 0。',
    orderMatters: true,
  },
  {
    id: 'sql-028',
    title: '定位故障爆发的时间窗口',
    difficulty: 2,
    tags: ['运维排障', '时间桶'],
    datasetId: 'ops',
    stem: '按分钟（取 ts 前 16 位）统计 5xx（status >= 500）日志条数，找出条数最多的那一分钟（并列都保留），输出分钟、条数两列，按分钟升序排列。',
    reference: `WITH minute_stat AS (
  SELECT substr(ts, 1, 16) AS minute, COUNT(*) AS cnt
  FROM service_log
  WHERE status >= 500
  GROUP BY substr(ts, 1, 16)
)
SELECT minute, cnt FROM minute_stat
WHERE cnt = (SELECT MAX(cnt) FROM minute_stat)
ORDER BY minute ASC;`,
    alts: [
      `SELECT minute, cnt FROM (
  SELECT substr(ts, 1, 16) AS minute, COUNT(*) AS cnt,
         RANK() OVER (ORDER BY COUNT(*) DESC) AS rk
  FROM service_log WHERE status >= 500
  GROUP BY substr(ts, 1, 16)
) t WHERE rk = 1 ORDER BY minute;`,
    ],
    hints: [
      'ts 是 TEXT（YYYY-MM-DD HH:MM:SS），substr(ts, 1, 16) 就截到分钟，可以直接 GROUP BY。',
      '先按分钟聚合出中间结果，再用 = MAX(cnt) 挑出峰值分钟；用 LIMIT 1 在并列时会漏掉其它分钟。',
    ],
    explanation:
      '09:05 这一分钟有 3 条 5xx，是全时段峰值，正好对应 order 服务 v2 的发布时刻 09:05:00。运维定位故障的常见套路就是「按时间分桶 → 找峰值 → 对齐变更记录」；CTE 让「先聚合、再筛选」两步一目了然。',
    orderMatters: true,
  },
  {
    id: 'sql-029',
    title: '最慢的 3 条请求',
    difficulty: 2,
    tags: ['运维排障', 'TOP N'],
    datasetId: 'ops',
    stem: '查询耗时最长的前 3 条请求，输出 trace_id、服务名、耗时毫秒三列，按耗时降序、trace_id 升序排列。',
    reference: `SELECT trace_id, service, latency_ms
FROM service_log
ORDER BY latency_ms DESC, trace_id ASC
LIMIT 3;`,
    alts: [
      `SELECT trace_id, service, latency_ms FROM (
  SELECT trace_id, service, latency_ms,
         ROW_NUMBER() OVER (ORDER BY latency_ms DESC, trace_id ASC) AS rn
  FROM service_log
) t WHERE rn <= 3 ORDER BY latency_ms DESC, trace_id ASC;`,
    ],
    hints: [
      'TOP N 最直接写法：ORDER BY latency_ms DESC 之后接 LIMIT 3。',
      '加上 trace_id 作为第二排序键，耗时相同时结果也稳定；ROW_NUMBER() 窗口函数是等价写法。',
    ],
    explanation:
      '命中的是 t011（2600ms）、t016（2300ms）、t009（2100ms），全部属于 order 服务 v2，且都在 09:05 之后——与上一题的时间窗口结论互相印证。排障时拿着 trace_id 就能去链路追踪系统里查完整调用栈。',
    orderMatters: true,
  },
  {
    id: 'sql-030',
    title: '定位是哪个发布版本引入故障',
    difficulty: 3,
    tags: ['运维排障', '多表关联'],
    datasetId: 'ops',
    stem: '关联发布记录与错误日志，统计每次发布版本对应的 ERROR 日志条数（用 service + version 双条件关联），只显示有错误日志的版本。输出服务名、版本、发布时间、错误数四列，按错误数降序、发布时间升序、服务名升序、版本升序排列。',
    reference: `SELECT d.service, d.version, d.deployed_at, COUNT(l.id) AS err_cnt
FROM deploy d
JOIN service_log l
  ON l.service = d.service AND l.version = d.version AND l.level = 'ERROR'
GROUP BY d.id, d.service, d.version, d.deployed_at
ORDER BY err_cnt DESC, d.deployed_at ASC, d.service ASC, d.version ASC;`,
    alts: [
      `WITH err AS (
  SELECT service, version, COUNT(*) AS err_cnt
  FROM service_log WHERE level = 'ERROR' GROUP BY service, version
)
SELECT d.service, d.version, d.deployed_at, err.err_cnt
FROM deploy d JOIN err ON err.service = d.service AND err.version = d.version
ORDER BY err.err_cnt DESC, d.deployed_at ASC, d.service ASC, d.version ASC;`,
    ],
    hints: [
      'service_log 的 version 记录了「这条日志产生于哪个版本」，所以要用 service + version 两个条件关联 deploy。',
      '只按 service 关联会把该服务所有版本的错误都算到每一次发布上；先聚合日志再 JOIN 是等价写法。',
    ],
    explanation:
      'order v2（09:05 发布）以 5 条 ERROR 高居第一，而 order v1 只有 1 条——结论是 09:05 的 v2 发布引入了故障，应优先回滚 v2。这就是运维的「错误时间线 × 变更记录」关联分析：把「什么时候坏的」和「什么时候改了什么」对齐，是定位线上问题的第一动作。',
    orderMatters: true,
    commonMistakes: [
      {
        pattern: 'ON\\s+\\w+\\.service\\s*=\\s*\\w+\\.service(?![\\s\\S]{0,80}version)',
        hint: '只按 service 关联，会把该服务所有版本的错误都算到每一次发布上（order v1 也会被算成 6 条），定位不到具体版本。必须写成 ON l.service = d.service AND l.version = d.version。',
      },
    ],
  },
  {
    id: 'sql-031',
    title: '找出心跳异常的机器',
    difficulty: 3,
    tags: ['运维排障', '反连接'],
    datasetId: 'ops',
    stem: '以每台机器「最后一次心跳」为准，找出最后状态不是 OK 的机器，输出主机名、服务名、最后心跳时间、最后状态四列，按主机名升序排列。',
    reference: `SELECT host, service, checked_at, status FROM (
  SELECT host, service, checked_at, status,
         ROW_NUMBER() OVER (PARTITION BY host ORDER BY checked_at DESC) AS rn
  FROM heartbeat
) t WHERE rn = 1 AND status <> 'OK'
ORDER BY host ASC;`,
    alts: [
      `SELECT h.host, h.service, h.checked_at, h.status
FROM heartbeat h
WHERE h.status <> 'OK'
  AND NOT EXISTS (
    SELECT 1 FROM heartbeat h2
    WHERE h2.host = h.host AND h2.checked_at > h.checked_at
  )
ORDER BY h.host ASC;`,
    ],
    hints: [
      '关键是「最后一次」：用 ROW_NUMBER() OVER (PARTITION BY host ORDER BY checked_at DESC) 给每台机器的心跳倒序编号，取 rn = 1。',
      '等价的反向思路：挑出状态异常且「不存在比它更新的心跳」的记录（NOT EXISTS 相关子查询）。',
    ],
    explanation:
      'h-order-1 在 09:05 最后一次心跳是 DOWN，需要排查；h-gw-1 虽然 09:03 曾 DOWN，但 09:09 已恢复 OK，不应告警。只写「status 不等于 OK」的过滤会把历史抖动也算进来，是监控告警里最经典的误报来源。',
    orderMatters: true,
    commonMistakes: [
      {
        pattern: 'WHERE\\s+(?:h\\.)?status\\s*(?:<>|!=)',
        hint: '只看 status 会把「曾经 DOWN、后来恢复」的机器（h-gw-1）也算成故障，造成误报。题目要求以每台机器最后一次心跳为准：用 ROW_NUMBER 取 rn = 1，或用 NOT EXISTS 排除存在更新心跳的记录。',
      },
    ],
  },
]
