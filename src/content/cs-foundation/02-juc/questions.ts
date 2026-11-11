import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'cs-foundation-02-juc-001',
    type: 'single',
    difficulty: 1,
    tags: ['volatile', '内存可见性'],
    stem: '关于 volatile 关键字，下列说法正确的是？',
    options: [
      { key: 'A', text: 'volatile 能保证 count++ 这类复合操作的原子性，可以替代 AtomicInteger' },
      { key: 'B', text: 'volatile 保证可见性并禁止特定指令重排序，但不保证复合操作原子性' },
      { key: 'C', text: 'volatile 变量的读写由 JVM 隐式加锁，因此同时保证互斥与原子性' },
      { key: 'D', text: 'volatile 只能修饰方法，不能修饰字段' },
    ],
    answers: ['B'],
    explanation:
      '考点是把「可见性」和「原子性」分开。A 错在 count++ 实际是读、改、写三步，volatile 只保证每次读到最新值，两个线程仍可能同时基于同一个旧值写回，导致丢更新。C 错在 volatile 不加锁、不互斥，它的语义来自内存屏障而不是管程，多线程同时写不会串行化。D 错在 volatile 只能修饰字段，修饰方法根本不是合法语法。B 正确：写操作立即刷回主存并使其他线程的缓存行失效，同时禁止 volatile 写之前的指令重排到写之后，但复合操作仍需 synchronized、Lock 或 CAS 原子类。',
  },
  {
    id: 'cs-foundation-02-juc-002',
    type: 'multiple',
    difficulty: 2,
    tags: ['线程池', '拒绝策略'],
    stem: '关于 ThreadPoolExecutor 的执行流程，下列说法正确的有？',
    options: [
      { key: 'A', text: '核心线程数未满时优先新建核心线程执行，而不是先入队' },
      { key: 'B', text: '核心线程满后任务先进入阻塞队列，队列满了才会扩容到 maximumPoolSize' },
      { key: 'C', text: '使用无界 LinkedBlockingQueue 时，maximumPoolSize 基本不会生效' },
      { key: 'D', text: '默认的 AbortPolicy 会静默丢弃新任务，不抛出任何异常' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      '记住「核心 → 队列 → 最大线程 → 拒绝」这条顺序链。A 是第一步，池子还没填满时不会把任务塞进队列排队。B 是第二、三步，只有队列也放不下才扩容到 maximumPoolSize。C 是常被忽略的推论，无界队列永远不会满，线程数就停在 corePoolSize，这也是 Executors.newFixedThreadPool 在生产上容易堆积 OOM 的原因。D 错在 AbortPolicy 会抛 RejectedExecutionException 让调用方快速失败，静默丢弃的是 DiscardPolicy——线上用后者而不留日志，丢任务会毫无痕迹。',
  },
  {
    id: 'cs-foundation-02-juc-003',
    type: 'scenario',
    difficulty: 3,
    tags: ['线程池', '线上问题'],
    scenario:
      '秒杀接口用一个自定义线程池异步扣库存，配置为 core=8、max=16、无界 LinkedBlockingQueue、AbortPolicy。活动开始后接口响应越来越慢，几分钟后容器被 OOM Kill；监控显示线程数稳定在 8、堆内存持续上涨，日志里没有一条 RejectedExecutionException。',
    stem: '最贴近根因的判断与改法是？',
    options: [
      { key: 'A', text: '把 maximumPoolSize 调到 64，让线程池有能力并发处理更多任务' },
      { key: 'B', text: '换成有界队列并配合明确的拒绝策略（如 CallerRunsPolicy 让调用方降速），同时给队列与任务加监控' },
      { key: 'C', text: '把拒绝策略改为 DiscardPolicy，直接丢掉排不下的任务以免占内存' },
      { key: 'D', text: '这是 GC 参数没调好，把 -Xmx 调大并换用 G1 即可' },
    ],
    answers: ['B'],
    explanation:
      '「线程数卡在 core、堆一直涨、没有拒绝日志」三条线索合起来，指向无界队列不断堆积任务对象，流量超过消费能力后把堆吃满。A 错在无界队列永远不满，maximumPoolSize 根本不会被触发，调再大也没用。C 错在 DiscardPolicy 会把扣库存请求静默丢弃，属于超卖级别的资损，而且掩盖了根因。D 错在加大堆只是延后 OOM，队列仍在无上限增长。B 正确：有界队列让容量有上限，CallerRunsPolicy 让提交线程自己执行任务从而形成天然背压（入口自动降速），再配合队列长度监控与明确告警，才能既保住数据又让流量可控。',
  },
]
