import type { SqlDataset } from '../../types'

/**
 * 手写 SQL 练习共用数据集。
 * 注意：数据固定且量小，保证判分结果确定；DDL 使用 SQLite/MySQL 双方言兼容写法。
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
  },
  {
    id: 'staff',
    name: '员工汇报关系（staff）',
    ddl: `CREATE TABLE staff(id INTEGER PRIMARY KEY, name TEXT NOT NULL, manager_id INTEGER, salary INTEGER NOT NULL);
INSERT INTO staff VALUES
 (1,'张总',NULL,30000),(2,'李总监',1,20000),(3,'王总监',1,15000),(4,'赵经理',2,12000),
 (5,'钱主管',4,9000),(6,'孙员工',5,6000),(7,'周员工',5,6000),(8,'吴员工',3,18000);`,
  },
]
