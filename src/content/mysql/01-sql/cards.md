# 01-sql 知识卡

## JOIN：把多张表按条件拼起来

### 是什么
JOIN 按关联条件把多张表的行拼接起来，常用类型：

- INNER JOIN：只保留两表都能匹配上的行。
- LEFT（OUTER）JOIN：左表全部保留，右表匹配不上的位置补 NULL。
- RIGHT JOIN：与 LEFT 相反，右表全保留。
- 不带关联条件的 JOIN（CROSS JOIN）：笛卡尔积，结果行数 = 左表行数 × 右表行数。

### 怎么用
```sql
-- 统计每个有订单的用户及其消费总额（INNER JOIN：没订单的用户不会出现）
SELECT u.id, u.name, SUM(o.amount) AS total
FROM user u
JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name;
```

### 常见坑
- 一对多 JOIN 会让"左边一行"膨胀成多行：用户表 JOIN 订单明细表后再 COUNT(u.id)，用户数会被明细条数撑大，要数"人"得用 COUNT(DISTINCT u.id)。
- LEFT JOIN 之后在 WHERE 里写右表的过滤条件（如 WHERE o.amount > 0），右表为 NULL 的左表行也会被过滤掉，LEFT JOIN 实际退化成 INNER JOIN。
- ON 在拼接时生效（LEFT JOIN 语义内），WHERE 在拼接完成后生效，两者位置不同结果可能不同。

### 面试怎么问
「LEFT JOIN 和 INNER JOIN 的区别？」——先答"左表全保留 + 右表 NULL 补位"，再补一句"WHERE 里写右表条件会把 LEFT JOIN 退化成 INNER JOIN"，体现完整度。

## SQL 的逻辑执行顺序与 NULL

### 是什么
SQL 的书写顺序是 SELECT...FROM...WHERE...，但数据库的**逻辑执行顺序**是：

FROM → ON/JOIN → WHERE → GROUP BY → HAVING → SELECT（含别名）→ ORDER BY → LIMIT

### 为什么
理解执行顺序能解释很多"怪现象"：
- WHERE 里不能用 SELECT 起的别名：WHERE 先执行，别名此刻还不存在。
- HAVING 里能用聚合函数：它执行在 GROUP BY 之后，分组已完成。
- ORDER BY 里能用别名：它执行在 SELECT 之后。

### 常见坑
- NULL 与任何值用 =、<>、> 比较结果都是 NULL（不是真也不是假），判断必须用 IS NULL / IS NOT NULL。
- COUNT(*) 统计行数；COUNT(col) 不统计 col 为 NULL 的行。
- SUM/AVG/MAX/MIN 都会忽略 NULL 行；整列为 NULL 时 SUM 返回 NULL 而不是 0。
- NOT IN 的子查询结果里只要有一个 NULL，整个结果恒为空。

### 面试怎么问
「WHERE 和 HAVING 的区别？」——按执行顺序答：WHERE 在分组前过滤行、不能用聚合函数；HAVING 在分组后过滤组、可以用聚合函数。

## 动手清单

### 练习 1：体会一对多膨胀
建 user（5 行）和 orders（其中一个用户 3 单）两张表，分别用 JOIN + COUNT(*) 与 COUNT(DISTINCT u.id) 统计"下单用户数"，对比两个结果。
自测标准：能说清第一种统计错在哪、差了多少。

### 练习 2：验证执行顺序
```sql
SELECT user_id, SUM(amount) AS total
FROM orders
WHERE total > 100        -- 报错：Unknown column 'total' in 'where clause'
GROUP BY user_id
ORDER BY total DESC;     -- 正常：ORDER BY 执行在 SELECT 之后
```
自测标准：能解释为什么同一别名 WHERE 报错而 ORDER BY 正常。
