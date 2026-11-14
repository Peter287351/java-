import type { SqlDataset } from '../../types'

/**
 * 手写 SQL 练习共用数据集。
 * 注意：数据固定且量小，保证判分结果确定；DDL 使用 SQLite/MySQL 双方言兼容写法。
 * tables / relations 仅用于把原始 DDL 渲染成「带中文注释的可视化表结构」，不影响判分。
 */
export const sqlDatasets: SqlDataset[] = [
  {
    id: 'hr',
    name: '员工与部门（hr）',
    ddl: `CREATE TABLE dept(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE emp(id INTEGER PRIMARY KEY, name TEXT NOT NULL, dept_id INTEGER, salary INTEGER NOT NULL, hire_date TEXT NOT NULL);
INSERT INTO dept VALUES (1,'技术部'),(2,'销售部'),(3,'人事部'),(4,'财务部');
INSERT INTO emp VALUES
 (1,'张三',1,15000,'2021-03-01'),
 (2,'李四',1,20000,'2020-07-15'),
 (3,'王五',1,20000,'2022-01-10'),
 (4,'赵六',2,12000,'2021-11-20'),
 (5,'钱七',2,9000,'2023-02-14'),
 (6,'孙八',3,8000,'2020-05-01'),
 (7,'周九',NULL,10000,'2022-08-08');`,
    tables: [
      {
        name: 'dept',
        cn: '部门表',
        columns: [
          { name: 'id', cn: '部门编号（主键）' },
          { name: 'name', cn: '部门名称' },
        ],
      },
      {
        name: 'emp',
        cn: '员工表',
        columns: [
          { name: 'id', cn: '员工编号（主键）' },
          { name: 'name', cn: '员工姓名' },
          { name: 'dept_id', cn: '所属部门编号（关联 dept.id，NULL 表示未分配）' },
          { name: 'salary', cn: '月薪（元）' },
          { name: 'hire_date', cn: '入职日期' },
        ],
      },
    ],
    relations: [
      'emp.dept_id 关联 dept.id：表示「这名员工的所属部门」。一个部门可有多名员工（一对多）。',
      '想查「某员工姓名 + 他所在的部门名」，需要把 emp 和 dept 按 dept_id = id 连起来（JOIN）。',
    ],
  },
  {
    id: 'login',
    name: '用户登录记录（login）',
    ddl: `CREATE TABLE login(uid INTEGER NOT NULL, dt TEXT NOT NULL);
INSERT INTO login VALUES
 (1,'2024-01-01'),(1,'2024-01-02'),(1,'2024-01-03'),(1,'2024-01-05'),
 (1,'2024-01-06'),(1,'2024-01-07'),(1,'2024-01-08'),
 (2,'2024-01-01'),(2,'2024-01-03'),(2,'2024-01-04'),(2,'2024-01-08'),
 (3,'2024-01-02'),(3,'2024-01-03'),(3,'2024-01-04'),(3,'2024-01-05');`,
    tables: [
      {
        name: 'login',
        cn: '登录记录表（每行 = 某用户某天登录了一次）',
        columns: [
          { name: 'uid', cn: '用户编号' },
          { name: 'dt', cn: '登录日期' },
        ],
      },
    ],
    relations: [
      '本数据集只有一张表。常见的练习是「连续登录天数」「某用户的登录次数」这类按 uid 分组 + 日期差的计算。',
    ],
  },
  {
    id: 'shop',
    name: '客户、商品与订单（shop）',
    ddl: `CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL);
CREATE TABLE product(id INTEGER PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL);
CREATE TABLE orders(id INTEGER PRIMARY KEY, cust_id INTEGER NOT NULL, product_id INTEGER NOT NULL, amount INTEGER NOT NULL, created TEXT NOT NULL);
INSERT INTO customer VALUES
 (1,'张伟','北京'),(2,'王芳','上海'),(3,'李娜','深圳'),(4,'刘强','广州');
INSERT INTO product VALUES
 (101,'机械键盘',299),(102,'显示器',999),(103,'无线鼠标',129);
INSERT INTO orders VALUES
 (1,1,101,300,'2024-01-05'),
 (2,1,102,200,'2024-01-12'),
 (3,2,103,350,'2024-01-07'),
 (4,2,101,150,'2024-01-20'),
 (5,3,102,100,'2024-01-15');`,
    tables: [
      {
        name: 'customer',
        cn: '客户表',
        columns: [
          { name: 'id', cn: '客户编号（主键）' },
          { name: 'name', cn: '客户姓名' },
          { name: 'city', cn: '所在城市' },
        ],
      },
      {
        name: 'product',
        cn: '商品表',
        columns: [
          { name: 'id', cn: '商品编号（主键）' },
          { name: 'name', cn: '商品名称' },
          { name: 'price', cn: '单价（元）' },
        ],
      },
      {
        name: 'orders',
        cn: '订单表（每行 = 一笔订单）',
        columns: [
          { name: 'id', cn: '订单编号（主键）' },
          { name: 'cust_id', cn: '下单客户编号（关联 customer.id）' },
          { name: 'product_id', cn: '购买的商品编号（关联 product.id）' },
          { name: 'amount', cn: '订单金额（元）' },
          { name: 'created', cn: '下单日期' },
        ],
      },
    ],
    relations: [
      'orders.cust_id 关联 customer.id：这笔订单是哪个客户下的。',
      'orders.product_id 关联 product.id：这笔订单买了哪个商品。',
      '「某客户买了什么、花了多少」需要 orders 分别 JOIN customer 与 product 才能拼出完整信息。',
    ],
  },
  {
    id: 'staff',
    name: '员工汇报关系（staff）',
    ddl: `CREATE TABLE staff(id INTEGER PRIMARY KEY, name TEXT NOT NULL, manager_id INTEGER, salary INTEGER NOT NULL);
INSERT INTO staff VALUES
 (1,'张总',NULL,30000),(2,'李总监',1,20000),(3,'王总监',1,15000),(4,'赵经理',2,12000),
 (5,'钱主管',4,9000),(6,'孙员工',5,6000),(7,'周员工',5,6000),(8,'吴员工',3,18000);`,
    tables: [
      {
        name: 'staff',
        cn: '员工表（含上下级汇报关系，自身关联）',
        columns: [
          { name: 'id', cn: '员工编号（主键）' },
          { name: 'name', cn: '员工姓名' },
          { name: 'manager_id', cn: '直属上级编号（关联本表 staff.id，最顶层为 NULL）' },
          { name: 'salary', cn: '月薪（元）' },
        ],
      },
    ],
    relations: [
      'staff 是自关联表：manager_id 指向同一张表里的另一名员工的 id，表示「谁是他的上级」。',
      '「查某人的所有下属 / 下属的下属」这类题要用自连接（staff a JOIN staff b ON b.manager_id = a.id）或递归 CTE。',
    ],
  },
  {
    id: 'ops',
    name: '服务日志与发布记录（ops）',
    ddl: `CREATE TABLE service_log(id INTEGER PRIMARY KEY, ts TEXT NOT NULL, service TEXT NOT NULL, level TEXT NOT NULL, status INTEGER NOT NULL, latency_ms INTEGER NOT NULL, trace_id TEXT NOT NULL, version TEXT NOT NULL);
CREATE TABLE deploy(id INTEGER PRIMARY KEY, service TEXT NOT NULL, version TEXT NOT NULL, deployed_at TEXT NOT NULL);
CREATE TABLE heartbeat(host TEXT NOT NULL, service TEXT NOT NULL, checked_at TEXT NOT NULL, status TEXT NOT NULL);
INSERT INTO service_log VALUES
 (1,'2024-06-01 09:00:01','gateway','INFO',200,45,'t001','v1'),
 (2,'2024-06-01 09:00:02','order','INFO',200,80,'t002','v1'),
 (3,'2024-06-01 09:00:03','payment','INFO',200,120,'t003','v1'),
 (4,'2024-06-01 09:00:04','user','INFO',200,30,'t004','v1'),
 (5,'2024-06-01 09:01:10','gateway','WARN',404,60,'t005','v1'),
 (6,'2024-06-01 09:01:11','order','ERROR',500,900,'t006','v1'),
 (7,'2024-06-01 09:02:00','order','INFO',200,70,'t007','v1'),
 (8,'2024-06-01 09:05:00','order','INFO',200,95,'t008','v2'),
 (9,'2024-06-01 09:05:12','order','ERROR',500,2100,'t009','v2'),
 (10,'2024-06-01 09:05:20','order','ERROR',503,1800,'t010','v2'),
 (11,'2024-06-01 09:05:31','order','ERROR',500,2600,'t011','v2'),
 (12,'2024-06-01 09:06:02','order','ERROR',500,1900,'t012','v2'),
 (13,'2024-06-01 09:06:15','gateway','ERROR',502,300,'t013','v1'),
 (14,'2024-06-01 09:06:30','payment','WARN',404,110,'t014','v1'),
 (15,'2024-06-01 09:07:05','user','INFO',200,40,'t015','v1'),
 (16,'2024-06-01 09:07:40','order','ERROR',500,2300,'t016','v2'),
 (17,'2024-06-01 09:08:00','gateway','INFO',200,50,'t017','v1'),
 (18,'2024-06-01 09:08:22','payment','ERROR',500,700,'t018','v1'),
 (19,'2024-06-01 09:09:00','order','INFO',200,88,'t019','v2'),
 (20,'2024-06-01 09:09:30','user','INFO',200,35,'t020','v1');
INSERT INTO deploy VALUES
 (1,'order','v1','2024-06-01 08:00:00'),
 (2,'order','v2','2024-06-01 09:05:00'),
 (3,'payment','v1','2024-06-01 08:00:00'),
 (4,'gateway','v1','2024-06-01 08:00:00'),
 (5,'user','v1','2024-06-01 08:00:00');
INSERT INTO heartbeat VALUES
 ('h-order-1','order','2024-06-01 09:00:00','OK'),
 ('h-order-1','order','2024-06-01 09:05:00','DOWN'),
 ('h-order-2','order','2024-06-01 09:00:00','OK'),
 ('h-order-2','order','2024-06-01 09:08:00','OK'),
 ('h-pay-1','payment','2024-06-01 09:00:00','OK'),
 ('h-pay-1','payment','2024-06-01 09:06:00','OK'),
 ('h-gw-1','gateway','2024-06-01 09:03:00','DOWN'),
 ('h-gw-1','gateway','2024-06-01 09:09:00','OK'),
 ('h-user-1','user','2024-06-01 09:00:00','OK');`,
    tables: [
      {
        name: 'service_log',
        cn: '服务调用日志（每行 = 一次接口调用）',
        columns: [
          { name: 'id', cn: '日志编号（主键）' },
          { name: 'ts', cn: '调用发生时间' },
          { name: 'service', cn: '被调用的服务名（gateway/order/payment/user）' },
          { name: 'level', cn: '日志级别（INFO/WARN/ERROR）' },
          { name: 'status', cn: 'HTTP 状态码（200 正常，4xx/5xx 异常）' },
          { name: 'latency_ms', cn: '本次调用耗时（毫秒）' },
          { name: 'trace_id', cn: '链路追踪 ID（一次请求的唯一标识）' },
          { name: 'version', cn: '调用时该服务部署的版本（v1/v2）' },
        ],
      },
      {
        name: 'deploy',
        cn: '部署记录（每行 = 某服务某次上线）',
        columns: [
          { name: 'id', cn: '部署编号（主键）' },
          { name: 'service', cn: '服务名' },
          { name: 'version', cn: '部署的版本（v1/v2）' },
          { name: 'deployed_at', cn: '部署时间' },
        ],
      },
      {
        name: 'heartbeat',
        cn: '心跳监测（每行 = 某主机某时刻的存活检查）',
        columns: [
          { name: 'host', cn: '主机标识（同一 host 可能有多条检查）' },
          { name: 'service', cn: '被监测的服务名' },
          { name: 'checked_at', cn: '检测时间' },
          { name: 'status', cn: '存活状态（OK 正常 / DOWN 宕机）' },
        ],
      },
    ],
    relations: [
      '三张表都靠 service 字段关联：同一 service 名把日志、部署、心跳串起来。',
      'service_log.version 对应 deploy.version：某次调用发生时，该服务跑的是哪个版本（order 在 09:05 从 v1 升到 v2）。',
      '常见练习：统计各服务的错误率 / 平均耗时、对比某版本上线前后的异常变化、找出 DOWN 的时间段等。',
    ],
  },
]
