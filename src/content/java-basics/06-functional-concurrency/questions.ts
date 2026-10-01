import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'java-basics-06-functional-concurrency-001',
    type: 'single',
    difficulty: 1,
    tags: ['Lambda', '函数式接口'],
    stem: '关于 Lambda 与函数式接口，下列说法正确的是？',
    options: [
      { key: 'A', text: '任何接口都可以用 Lambda 表达式赋值' },
      { key: 'B', text: 'Lambda 的目标类型是函数式接口——有且仅有一个抽象方法的接口（default、static 方法不算）；@FunctionalInterface 只是编译期校验注解，不写也能当函数式接口用' },
      { key: 'C', text: 'Lambda 表达式内的 this 指向 Lambda 自身创建的对象' },
      { key: 'D', text: 'Lambda 只能实现抽象类，不能实现接口' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：SAM（Single Abstract Method）是 Lambda 的适用边界，default / static 方法不占抽象方法名额，注解只做防呆校验。A 错误：有多个抽象方法的接口无法用 Lambda 实现。C 错误：Lambda 不创建新作用域，this 指向外围实例——这正是它与匿名内部类（this 指向匿名类实例）的关键区别之一。D 说反了：Lambda 面向接口，抽象类不行。',
  },
  {
    id: 'java-basics-06-functional-concurrency-002',
    type: 'code',
    difficulty: 3,
    tags: ['Stream', '惰性求值'],
    stem: `下面代码的输出是什么？

~~~java
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Tom", "Jerry", "Spike");
        Stream<String> s = names.stream()
                .filter(n -> {
                    System.out.println("filter: " + n);
                    return n.length() > 3;
                });
        System.out.println("before");
        List<String> result = s.collect(Collectors.toList());
        System.out.println(result);
    }
}
~~~`,
    options: [
      { key: 'A', text: '先输出 3 行 filter，再输出 before，最后 [Jerry, Spike]' },
      { key: 'B', text: '只输出 before 和 [Jerry, Spike]，filter 一次都没执行' },
      { key: 'C', text: '先输出 before，再依次输出 3 行 filter，最后 [Jerry, Spike]' },
      { key: 'D', text: '先输出 before 和 [Jerry, Spike]，之后才补出 3 行 filter' },
    ],
    answers: ['C'],
    explanation:
      '中间操作（filter / map）是惰性的，只搭管道不执行，所以 before 先打印；collect 是终端操作，触发元素逐个流过管道，3 行 filter 依次出现，C 正确。A 错误：定义 Stream 时不会执行任何 filter。B 错误：只有全程没有终端操作时 filter 才会一行都不执行，这里 collect 已经触发。D 错误：执行严格发生在 collect 调用期间，不存在异步后补。要点：同一元素是一次性流过整条管道的（垂直执行），而不是每个阶段整体跑完再进下一阶段。',
  },
  {
    id: 'java-basics-06-functional-concurrency-003',
    type: 'single',
    difficulty: 2,
    tags: ['Optional'],
    stem: '关于 Optional 的使用，下列说法正确的是？',
    options: [
      { key: 'A', text: 'Optional.of(null) 会静默返回一个空 Optional' },
      { key: 'B', text: 'orElse 的参数无论是否用到都会先求值，默认值构造有开销或带副作用时应改用惰性的 orElseGet' },
      { key: 'C', text: 'Optional.empty().get() 返回 null' },
      { key: 'D', text: '官方推荐用 isPresent() 加 get() 的组合处理所有判空' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：orElse(defaultValue) 是「先算好再传参」，哪怕不需要也算；orElseGet(Supplier) 才按需构造，这是 Optional 的高频考点。A 错误：of(null) 直接抛 NullPointerException，容忍 null 的入口是 ofNullable。C 错误：空 Optional 调 get() 抛 NoSuchElementException，不是返回 null。D 错误：isPresent + get 是命令式旧写法，官方文档推荐 orElse / orElseThrow / map / ifPresent 链式表达业务意图。',
  },
  {
    id: 'java-basics-06-functional-concurrency-004',
    type: 'single',
    difficulty: 1,
    tags: ['Thread', '生命周期'],
    stem: '关于线程的创建与生命周期，下列说法正确的是？',
    options: [
      { key: 'A', text: 'new Thread(r).run() 与 new Thread(r).start() 效果相同，都会开启新线程' },
      { key: 'B', text: '线程 run() 执行结束后，可以再次调用 start() 复用该线程' },
      { key: 'C', text: '调用 start() 才会请求 JVM 创建新的执行流并由新线程回调 run()；直接调 run() 只是当前线程里的普通方法调用' },
      { key: 'D', text: '线程调用 Thread.sleep(1000) 后进入 WAITING 状态，等待被唤醒' },
    ],
    answers: ['C'],
    explanation:
      'C 正确：start() 走 JVM 原生流程创建线程，状态从 NEW 到 RUNNABLE，run() 由新线程执行；直接调 run() 等于在当前线程里执行一个普通方法，毫无并发效果。A 是面试高频陷阱，二者语义完全不同。B 错误：线程进入 TERMINATED 后再 start() 抛 IllegalThreadStateException，线程不可复用。D 错误：sleep(ms) 是带时限的 TIMED_WAITING；无时限的 WAITING 对应无参的 Object.wait()、join() 等。',
  },
  {
    id: 'java-basics-06-functional-concurrency-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['synchronized', 'volatile'],
    stem: '关于 synchronized 与 volatile，下列说法正确的有？（多选）',
    options: [
      { key: 'A', text: 'synchronized 同时保证原子性、可见性与有序性；volatile 只保证可见性与有序性，不保证原子性' },
      { key: 'B', text: '多线程执行 count++ 时，只要 count 声明为 volatile 就能保证结果正确' },
      { key: 'C', text: 'synchronized 修饰实例方法锁的是当前对象 this，修饰静态方法锁的是 Class 对象' },
      { key: 'D', text: 'volatile 修饰一个引用变量后，其指向对象内部字段的修改对所有线程立即可见' },
      { key: 'E', text: '线程获取 synchronized 锁失败后会进入 WAITING 状态' },
    ],
    answers: ['A', 'C'],
    explanation:
      'A、C 正确：monitor 锁天然覆盖原子性、可见性与有序性；两种加锁方式的锁对象不同，各自可重入但互不干扰。B 错误：count++ 是「读-改-写」三步非原子操作，volatile 只保证每次读到最新值，不保证写回不冲突，需要 synchronized 或 AtomicInteger。D 错误：volatile 只保证「引用本身」的读写可见，对象内部字段要靠对象自身的发布语义或加锁保证。E 错误：等锁是 BLOCKED，WAITING 需要主动调用 wait() / join() / park() 之类。',
  },
  {
    id: 'java-basics-06-functional-concurrency-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['线程池', '拒绝策略'],
    scenario:
      '订单导出服务用 Executors.newFixedThreadPool(10) 提交生成 Excel 的任务。大促期间任务提交速率突增，监控显示任务延迟从秒级涨到小时级，随后服务 Full GC 频繁并 OOM 崩溃，堆转储里有数百万个待执行任务对象。线程数始终是 10，CPU 占用并不高。',
    stem: '最合理的判断与处置是？',
    options: [
      { key: 'A', text: '根因是 newFixedThreadPool 使用无界 LinkedBlockingQueue，消费赶不上提交时任务无限堆积直至 OOM。改用 ThreadPoolExecutor 显式声明有界队列、合理的最大线程数与拒绝策略（如 CallerRunsPolicy 形成背压，或快速失败并告警），并通过自定义 ThreadFactory 给线程命名便于排查' },
      { key: 'B', text: '把线程数从 10 调到 100，消费能力上去了堆积自然消失' },
      { key: 'C', text: '改用 Executors.newCachedThreadPool，线程不够会自动创建，永远不会堆积' },
      { key: 'D', text: '给每个任务套一层 try-catch 打印日志，堆积累积的问题就能自愈' },
    ],
    answers: ['A'],
    explanation:
      '「CPU 不高 + 延迟暴涨 + 堆里全是排队任务」是无界队列堆积的标准画像：newFixedThreadPool 的 LinkedBlockingQueue 没有容量上限，提交持续快于消费时任务无限累积。A 给出正确改造：有界队列让队列满时先扩线程到 max、再走拒绝策略，CallerRunsPolicy 让提交线程自己干活形成天然背压，命名线程工厂是排查基本功。B 错误：盲目加线程不解决无界堆积，反而放大上下文切换成本。C 错误：cached 线程池最大线程数是 Integer.MAX_VALUE，高并发下线程爆炸、频繁创建销毁，同样 OOM——阿里 Java 规范明确禁用 Executors 快捷方法。D 与堆积毫无关系。',
  },
  {
    id: 'java-basics-06-functional-concurrency-007',
    type: 'single',
    difficulty: 2,
    tags: ['JVM内存区域'],
    stem: '关于 JVM 运行时内存区域，下列说法正确的是？',
    options: [
      { key: 'A', text: 'new 出来的对象存放在虚拟机栈中' },
      { key: 'B', text: 'StackOverflowError 的本质是堆内存不足' },
      { key: 'C', text: '线程私有的区域是虚拟机栈、本地方法栈和程序计数器；堆与方法区（JDK 8+ 由元空间实现）是线程共享的' },
      { key: 'D', text: 'JDK 7 之后字符串常量池被移到了元空间' },
    ],
    answers: ['C'],
    explanation:
      'C 正确：栈、本地方法栈、程序计数器随线程生灭、天然隔离；堆与方法区被所有线程共享。A 错误：对象在堆上，栈里只放局部变量表和对象引用。B 错误：栈溢出来自方法调用深度超限（典型如递归无出口），与堆大小无关，调大 -Xmx 无效。D 错误：字符串常量池 JDK 7 起就在堆中；元空间存放类元数据且使用本地内存。',
  },
  {
    id: 'java-basics-06-functional-concurrency-008',
    type: 'scenario',
    difficulty: 3,
    tags: ['线程池', 'OOM'],
    scenario:
      '导出服务用 Executors.newFixedThreadPool(10) 处理导出请求，任务内部同步调用慢速的外部接口（平均 3 秒）。运营搞大促期间，服务重启后日志出现 OutOfMemoryError: unable to create native thread 之前堆里堆积了大量排队任务对象，接口 RT 全面飙升。',
    stem: '对根因与改造的判断，最准确的是？',
    options: [
      { key: 'A', text: 'newFixedThreadPool 的无界 LinkedBlockingQueue 在提交速度 > 消费速度时无限堆积任务导致 OOM；应显式 new ThreadPoolExecutor 用有界队列 + 合理拒绝策略，并把慢 IO 任务与核心任务隔离（独立线程池/限流）' },
      { key: 'B', text: '线程数 10 太少，加到 200 让任务都能立刻执行就不会堆积了' },
      { key: 'C', text: '换成 Executors.newCachedThreadPool，线程能自动回收，天然不会 OOM' },
      { key: 'D', text: '在任务里把外部接口调用改成异步回调，线程池的问题就自然消失了' },
    ],
    answers: ['A'],
    explanation:
      'newFixedThreadPool 与 newCachedThreadPool 都不允许在生产使用：前者无界队列堆积任务（本题 OOM 根因），后者线程数无上限可能耗尽线程资源。B 加大线程只会延缓堆积且放大上下文切换；C 换一种 OOM 方式；D 只缩短单任务耗时，突发流量下队列仍会无界增长。有界队列 + 拒绝策略（降级/快速失败）+ 隔离才是标准答案，这也是《阿里巴巴 Java 开发手册》强制规约的出处。',
  },
]
