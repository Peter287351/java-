# 02 Java 并发与 JUC

## 可见性、原子性与 happens-before

### 是什么
并发三要素：**可见性**（一个线程的写入能否被别的线程立刻看到）、**原子性**（一组操作能否不可分割地执行）、**有序性**（指令是否会被重排序）。`volatile` 保证可见性并禁止特定重排序，但 `count++` 这类「读-改-写」不是原子操作；`synchronized` / `ReentrantLock` 靠互斥同时保证三者；`AtomicInteger` 用 CAS 保证单个变量的原子更新。JMM 用 **happens-before** 描述保证：解锁先于后续加锁、volatile 写先于后续读、线程 start / join、传递性等。

### 为什么
CPU 有多级缓存、编译器和处理器都会重排序，所以「代码顺序」不等于「执行顺序」。如果语言不给出明确的内存语义，谁都无法推理并发程序的正确性；happens-before 就是给程序员的可推理契约。

### 怎么用
- 只做「状态标志位 / 发布配置」用 volatile 足够；有复合判断或累加就用锁或原子类。
- 停止线程的经典写法：`volatile boolean running` + 循环判断，比 `Thread.stop()` 安全。
- 多变量之间有一致性要求时，别用多个 volatile 拼，用一把锁把它们包起来。

### 常见坑
- 以为 volatile 能替代锁：`volatile int i; i++;` 在多线程下照样丢更新。
- 双重检查锁单例忘了给实例字段加 volatile：指令重排序可能让别的线程拿到「已分配内存但还没初始化完」的对象。
- 以为 `ConcurrentHashMap` 的复合操作天然原子：`if (!map.containsKey(k)) map.put(k, v)` 仍然有竞态，要用 `putIfAbsent` / `computeIfAbsent`。

### 面试怎么问
「volatile 保证什么、不保证什么？」——先答可见性与禁止重排序，再明确不保证复合操作原子性，最后举 `i++` 与 DCL 单例两个例子，基本满分。

## 线程池：参数、队列与拒绝策略

### 是什么
`ThreadPoolExecutor` 的执行顺序是：核心线程数未满 → 建核心线程；满了 → 进**阻塞队列**；队列也满了 → 扩到 `maximumPoolSize`；还满 → 触发拒绝策略。四个默认策略：AbortPolicy（抛异常）、CallerRunsPolicy（让提交线程自己跑，天然削峰）、DiscardPolicy（静默丢弃）、DiscardOldestPolicy（丢队列里最老的）。队列用无界 `LinkedBlockingQueue` 时，`maximumPoolSize` 几乎永远用不上。

### 为什么
线程创建销毁有成本，还可能把系统线程数打爆；池化 + 队列能把并发量控制在可控范围。Executors 的 `newFixedThreadPool` / `newCachedThreadPool` 分别用了无界队列和近乎无界的线程上限，生产上容易 OOM，所以规范通常要求显式 `new ThreadPoolExecutor(...)`。

### 怎么用
- CPU 密集型：线程数 ≈ 核数或核数+1；IO 密集型：≈ 核数 × (1 + 等待时间/计算时间)，最终靠压测定。
- 给线程池起有意义的名字（自定义 ThreadFactory），出问题时线程栈才看得懂。
- 任务要区分优先级/隔离：核心交易与后台导出别共用一个池，避免慢任务拖死快任务。

### 常见坑
- 无界队列 + 突发流量：请求全堆在队列里，延迟飙升直到 OOM，而不是快速失败。
- 用 DiscardPolicy 静默丢任务：线上数据悄悄少了一部分，日志里却不报错。
- 在池里提交的任务又等待同一个池里的另一个任务结果 → 线程饥饿死锁。
- 忘记 `shutdown()`，JVM 因非守护线程一直不退出。

### 面试怎么问
「线程池的七个参数、任务提交后的执行流程？」按「核心 → 队列 → 最大线程 → 拒绝」四步答，再补一句无界队列会让最大线程数失效，就能体现真用过。

## 动手清单

### 练习 1：亲眼看见丢更新
用 10 个线程各对同一个 `volatile int` 累加 10000 次，打印结果；再换成 AtomicInteger 与 synchronized 各跑一遍，对比三者。

### 练习 2：调一次拒绝
构造 core=2、max=4、队列容量=2 的池，一次提交 10 个任务，分别观察 AbortPolicy 抛异常与 CallerRunsPolicy 由主线程代跑的表现。
**自测标准**：能说清 volatile 与锁的边界，能画出线程池的四步执行流程并解释为什么生产禁用无界队列。
