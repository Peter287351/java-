# 06 函数式与并发入门

## Lambda、Stream 与 Optional

### 是什么
Lambda 的目标类型是函数式接口（functional interface）：有且仅有一个抽象方法的接口，default 与 static 方法不算，@FunctionalInterface 只是编译期校验注解；Lambda 内的 this 指向外围实例（匿名内部类则指向匿名类自身）。Stream 分两类：中间操作（filter / map / sorted）是惰性的、只搭管道；终端操作（collect / forEach / reduce）触发执行，且每个元素「垂直」地流过整条管道。Optional 是「可能没有值」的显式容器：of / ofNullable 创建，orElse / orElseGet / orElseThrow 取值，map / ifPresent 链式表达「有则如何、无则如何」。

### 常见坑
- 只定义 Stream 不写终端操作，一行都不会执行。
- orElse 的参数无论用不用都会先求值，默认值构造昂贵或带副作用时改用惰性的 orElseGet。
- Optional.of(null) 直接抛 NPE，容 null 的入口是 ofNullable。
- isPresent() + get() 是命令式旧写法；Optional 适合做返回值，不适合做字段与入参。

### 面试怎么问
「Stream 的惰性求值是什么？」——答「中间操作只搭管道不执行，终端操作才触发，且逐元素垂直流过管道」，最好举「filter 里打日志、before 先于 filter 输出」的例子，一句话见真章。

## 线程、线程池与 JVM 内存初识

### 是什么
线程 new Thread 后调用 start() 才真正并发，直接调 run() 只是当前线程里的普通方法调用；生命周期为 NEW / RUNNABLE / BLOCKED / WAITING / TIMED_WAITING / TERMINATED。synchronized 修饰实例方法锁 this、静态方法锁 Class 对象，保证原子性、可见性与有序性；volatile 只保证可见性与有序性，count++ 这类「读-改-写」复合操作它救不了。生产环境线程池用 ThreadPoolExecutor 显式声明七参数：核心线程数、最大线程数、空闲存活时间、时间单位、有界队列、线程工厂、拒绝策略，扩容顺序是「核心线程 → 入队 → 扩到最大线程 → 拒绝」。JVM 内存：虚拟机栈、本地方法栈、程序计数器线程私有；堆与方法区（JDK 8+ 由元空间实现）线程共享，对象在堆、局部变量与引用在栈。

### 常见坑
- Executors.newFixedThreadPool 用无界队列，任务堆积直到 OOM；newCachedThreadPool 线程数无上限，同样能 OOM。
- volatile 修饰引用变量，不保证其指向对象内部字段的可见性。
- Thread.sleep(ms) 是 TIMED_WAITING，不是 WAITING。
- StackOverflowError 是栈深度的事（典型：递归无出口），调大 -Xmx 没用。
- 字符串常量池 JDK 7 起在堆里，不在元空间。

### 面试怎么问
「为什么禁用 Executors 快捷创建线程池？」——答「无界队列 / 无界线程两个 OOM 口子」，再按「核心线程 → 入队 → 扩到最大 → 拒绝」说出 ThreadPoolExecutor 的扩容顺序与拒绝策略选型。

## 动手清单

### 练习 1：亲眼看惰性求值与线程状态
写 Stream 例子：filter 里打印元素，观察 before 先于 filter 输出；再写两个线程用 synchronized + wait / notify 交替打印奇偶数。
自测标准：能解释「没有终端操作就不执行」；能说出 BLOCKED（等锁）与 WAITING（主动等待被唤醒）的区别。

### 练习 2：手写一个规范的线程池
new ThreadPoolExecutor(2, 4, 60, TimeUnit.SECONDS, new ArrayBlockingQueue<>(10), 命名线程工厂, new CallerRunsPolicy())，提交 20 个睡眠任务，观察活跃线程数、队列水位与拒绝行为。
自测标准：能复述七参数含义，以及「先核心、再入队、后扩线程、最后拒绝」的顺序。
