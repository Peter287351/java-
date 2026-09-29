# 后端修炼场 · 设计文档

> 项目：`houduan_study` —— 个人后端学习网站
> 目标：通过「知识卡 + 选择题 / 情景题」学练结合，从 0 到 1 达到后端实习水平
> 状态：设计稿 v1（待确认 3 个决策点，见 §10）

---

## 1. 定位与目标

- **用户**：你自己，单机使用，每天 30–60 分钟碎片时间
- **目标水平**：能通过后端实习面试 —— 八股有理解（不是死背）、场景问题有排查思路、框架会用且知原理
- **学习闭环**：每个知识点 `先学（知识卡）→ 再练（答题 + 即时解析）→ 错题回收 → 模考检验`
- **实习达标线**：每个模块「全章节完成 + 最近一次作答正确率 ≥ 80%」，首页用进度清单呈现"离实习还差什么"

## 2. 学习路径（4 阶段 · 8 模块）

### 阶段一 · 语言地基

**M1 Java 基础（6 章）**
1. 语法与数据类型：基本类型、包装类缓存、String 不可变与常量池、类型转换
2. 面向对象：封装/继承/多态、接口 vs 抽象类、重载 vs 重写、内部类、record
3. 集合框架：ArrayList/LinkedList、HashMap 原理与扩容、ConcurrentHashMap、equals/hashCode 契约
4. 泛型与异常：类型擦除、通配符、受检/非受检异常、try-with-resources
5. 常用 API 与 IO：String/StringBuilder、日期时间 API、IO 流、序列化
6. 函数式与并发入门：Lambda/Stream/Optional、线程与线程池、synchronized/volatile 初识、JVM 内存区域初识

### 阶段二 · 存储与中间件

**M2 MySQL（6 章）**
1. SQL 基础与多表查询：JOIN、GROUP BY、子查询、SQL 执行顺序
2. 索引：B+ 树、聚簇/二级索引、最左前缀、覆盖索引、常见索引失效场景
3. 事务与 MVCC：ACID、隔离级别与脏读/幻读、MVCC 原理、Undo/Redo 日志
4. 锁与并发：行锁/间隙锁/临键锁、死锁产生与排查
5. 日志与架构：binlog / redo log / undo log、两阶段提交、Buffer Pool
6. 优化与实战：慢查询定位、EXPLAIN、深分页、表设计规范、主从与分库分表概念

**M3 Redis（5 章）**
1. 数据类型与命令：5 大基础类型 + BitMap/HyperLogLog/GEO、底层编码
2. 线程模型与持久化：单线程为何快、IO 多线程、RDB vs AOF、混合持久化
3. 缓存实战：穿透/击穿/雪崩三件套、缓存与数据库一致性、淘汰策略
4. 高级特性：分布式锁（SETNX+Lua → Redisson 看门狗）、管道/事务/Lua 脚本
5. 高可用与场景：主从复制、哨兵、Cluster、大 key/热 key、典型业务场景题

**M4 Elasticsearch（4 章）**
1. 核心概念：倒排索引、与 MySQL 概念映射、分片与副本、近实时性
2. 分词与 Mapping：analysis 流程、IK 中文分词、dynamic mapping、常见字段类型
3. 查询 DSL：match vs term、bool 组合查询、高亮、from/size 深分页问题与 search_after
4. 实战集成：聚合分析、Java RestClient、MySQL→ES 同步方案（logstash/canal/双写）、集群健康

### 阶段三 · 框架核心

**M5 Spring（5 章）**
1. IoC 与 DI：容器与 BeanDefinition、三种注入方式、循环依赖与三级缓存
2. Bean 生命周期与作用域：实例化→属性→初始化（前后处理器）→销毁；singleton/prototype
3. AOP：JDK 动态代理 vs CGLIB、切点与通知、典型应用（日志/鉴权/接口幂等）
4. 事务：传播行为、事务失效经典场景（自调用/非 public/异常被吞）
5. Spring MVC：DispatcherServlet 流程、参数绑定、拦截器 vs 过滤器

**M6 Spring Boot（6 章）**
1. 核心机制：自动配置原理、@EnableAutoConfiguration 与 SPI、条件注解、自定义 starter
2. 配置与 profiles：yml 语法、@ConfigurationProperties vs @Value、多环境切换
3. Web 开发：REST 接口规范、参数校验 validation、全局异常处理、统一返回体
4. 数据访问：整合 MyBatis-Plus、HikariCP 连接池、声明式事务使用
5. 整合 Redis 与缓存：RedisTemplate、Spring Cache 注解、缓存注解的坑
6. 工程化：logback 日志、Actuator 监控、定时任务、单元测试、打包部署与 Docker 概念

### 阶段四 · AI 应用

**M7 LangChain4j（4 章）**
1. LLM 接入与对话：ChatModel / StreamingChatModel、OpenAI 兼容接口接入、消息类型
2. AI Services 与结构化输出：@AiService、@SystemMessage/@UserMessage、Prompt 模板、输出解析为 POJO
3. Tools 与 RAG：@Tool 函数调用、EmbeddingModel、向量库 EmbeddingStore、检索增强完整流程
4. 记忆与实战：ChatMemory 与窗口管理、Token 与成本意识、Spring Boot starter 整合、流式输出

**M8 LangGraph4j（3 章）**
1. 图与状态：StateGraph、Node/Edge、状态 Channel 与 Reducer、START/END
2. 流程控制：条件边、分支与循环、子图、中断与人工介入（human-in-the-loop）
3. Agent 实战：ReAct 模式、多 Agent 协作、与 LangChain4j 模型层整合、调试与图可视化

> 并发深入（JUC、JVM 调优）超出"实习线"核心范围，作为后续扩展模块，v1 只在 M1 第 6 章打基础。

## 3. 内容模型

四层结构：`Module → Chapter → (KnowledgeCard* + Question*)`

**题型 4 种**

| 类型 | 说明 |
|---|---|
| `single` | 单选题 |
| `multiple` | 多选题（全对才得分） |
| `scenario` | 情景题：真实工作场景描述 + 选最佳处置/诊断，单选或多选 |
| `code` | 代码阅读题：题干含可运行代码块，选输出结果或找 bug |

**难度 3 级**：1 = 概念记忆（能不能记住）· 2 = 理解辨析（能不能想明白）· 3 = 场景实战（会不会用/排查）

**每题必带**：答案、解析（讲清"为什么对、其余选项错在哪"）、考点 tag。示例：

```json
{
  "id": "redis-cache-003",
  "type": "scenario",
  "difficulty": 3,
  "tags": ["缓存穿透"],
  "scenario": "运营反馈首页商品列表偶发空白，日志中出现大量对不存在商品 id 的查询，Redis 命中率正常，但 MySQL QPS 明显升高。",
  "stem": "最可能的问题与首选处置是？",
  "options": [
    { "key": "A", "text": "缓存雪崩，立即给所有 key 加随机过期时间" },
    { "key": "B", "text": "缓存穿透，对空结果做短期缓存并加参数校验/布隆过滤器" },
    { "key": "C", "text": "缓存击穿，对热点 key 加互斥锁重建" },
    { "key": "D", "text": "Redis 宕机，先重启 Redis 集群" }
  ],
  "answers": ["B"],
  "explanation": "查询不存在的数据导致请求直达数据库，是典型缓存穿透……A 是雪崩的处置（大面积 key 同时失效）；C 针对单个热点 key 过期瞬间；D 与「命中率正常」矛盾。"
}
```

**知识卡**：每章 2–3 张 Markdown 卡片，结构固定为 `是什么 → 为什么 → 怎么用 → 常见坑 → 面试怎么问`，并在卡末附 1–2 个"动手清单"小练习（写明自测标准，v1 不做自动判题）。

## 4. 功能与页面

1. **首页 Dashboard**：总进度、8 模块进度环、今日任务（继续上次章节 + 复习 5 道错题）、连续打卡天数
2. **学习路径页**：4 阶段 8 模块卡片 + 章节列表与完成状态
3. **章节学习页**：知识卡翻页阅读 → "开始练习"进入答题
4. **答题页**：单题流，提交即判分并展示解析与考点 tag；支持标记"存疑"；快捷键（1–4 选选项、回车提交/下一题）
5. **刷题模式**：按 模块/章节/难度/题型 任意组合筛选，顺序刷题
6. **模拟考试**：20 题 / 25 分钟，按难度配比与 tag 覆盖抽题；交卷后按 tag 出得分报告；支持单模块卷与跨模块综合卷
7. **错题本**：按模块分组，重做答对 2 次自动移出；支持"标记已掌握"手动移出
8. **设置页**：进度导出/导入（JSON 文件）、清空数据、存疑题清单

## 5. 进度与判定

- 每题记录：最近对错、连续答对次数、累计作答次数、最后作答时间
- 章节完成 = 该章全部题目答对过；模块正确率 = 最近一次作答的统计
- 存储：localStorage（键 `hds_progress_v1`），可导出/导入迁移
- 首页"实习就绪度"= 8 个模块达标状态汇总，一眼看出薄弱模块

## 6. 技术方案（默认推荐，待确认）

**方案 A（推荐）· 纯前端静态站**
- Vue 3 + TypeScript + Vite + Pinia + Vue Router
- 题库：`src/content/modules/*.json`，构建期静态导入，无运行时后端
- Markdown 渲染：marked（知识卡与解析支持代码块）
- 产物：纯静态文件，本地起服务或部署到任意静态托管皆可；进度存 localStorage
- **理由**：零运行依赖、当天可用，精力全部花在内容质量上

**方案 B · Spring Boot 全栈**
- Spring Boot 3 + MyBatis-Plus + SQLite/MySQL 提供 REST，前端同方案 A；进度入库、可多设备
- **理由**：网站本身成为你的后端练手项目；代价是要起服务、首版交付更慢

**方案 C · React + Vite**：仅当你想顺便学 React 生态时选

## 7. 内容生产计划（分批交付）

| 批次 | 模块 | 题量 | 知识卡 |
|---|---|---|---|
| P0 | Java 基础、MySQL、Redis | ~135 | 每章 2–3 张 |
| P1 | Spring、Spring Boot | ~85 | 每章 2 张 |
| P2 | ES、LangChain4j、LangGraph4j | ~85 | 每章 2 张 |

- **质量标准**：解析必须覆盖每个错误选项的坑点；情景题还原真实排查链路；代码题代码必须可运行、用 Java 8+ 语法
- 每批跑 **schema 校验脚本**（id 唯一、答案 key 合法、必填字段齐全）兜底
- 各模块并行生产，先 P0 后 P1/P2

## 8. 明确不做（v1 范围外）

多用户/登录/云端同步；讨论区评论；OJ 式在线判题（以"动手清单"替代）；原生移动端（做响应式即可）；题库后台管理（直接改 JSON）。

## 9. 自我 Review（风险与对策）

1. **内容体量是最大成本**（8 模块 × 300 题 × 知识卡）→ 分批 P0/P1/P2，P0 先可用；并行生产 + 校验脚本兜底
2. **选择题测不出"会写代码"** → 代码阅读题过渡 + 知识卡内嵌动手清单（含自测标准）；后续可加 OJ
3. **情景题答案可能有争议** → 解析写清完整排查链路；题目支持"存疑"标记，设置页汇总导出，便于复盘纠偏
4. **localStorage 换浏览器丢进度** → 导出/导入功能；若选方案 B 天然解决
5. **langchain4j / langgraph4j 生态新、版本迭代快** → 题目聚焦稳定核心概念，标注参考版本，难度以 1–2 级为主
6. **小题库下模考重复率高** → 按 tag 覆盖 + 难度配比抽题，题库未扩充前界面明确提示"题目可能重复"

## 10. 待确认的决策点

1. **技术栈**：A 纯前端静态站（默认推荐）/ B Spring Boot 全栈 / C React
2. **首发题库规模**：A 约 300 题（默认推荐）/ B 精简约 160 题 / C 500+ 题
3. **内容形式**：A 先学后练（知识卡+题，默认推荐）/ B 纯刷题 / C 学练分离

## 11. 里程碑

- **M1**：项目骨架 + 答题引擎 + P0 三模块内容 → 可日常刷题
- **M2**：模考、错题本、Dashboard 打卡 → 完整学习闭环
- **M3**：P1/P2 内容补齐 + 存疑复盘 + 导入导出 → 全量交付
