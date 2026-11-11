import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'cs-foundation-01-jvm-001',
    type: 'single',
    difficulty: 1,
    tags: ['运行时数据区', '线程私有'],
    stem: '关于 HotSpot JVM 的运行时数据区，下列说法正确的是？',
    options: [
      { key: 'A', text: '堆与元空间都是线程私有的，每个线程各有一份' },
      { key: 'B', text: '虚拟机栈、本地方法栈与程序计数器是线程私有的，堆与元空间由所有线程共享' },
      { key: 'C', text: 'new 出来的对象实例存放在虚拟机栈的局部变量表里，方法结束即自动释放' },
      { key: 'D', text: 'JDK 8 之后字符串常量池位于永久代，只有发生 Full GC 时才可能回收' },
    ],
    answers: ['B'],
    explanation:
      '分代与分区的前提是先分清「线程私有」和「线程共享」。A 错在堆与元空间恰恰是全线程共享的，正因为共享才需要 GC 和并发安全。C 错在局部变量表里只有基本类型的值和指向堆对象的引用，对象本体一律在堆上，栈帧出栈只是丢掉引用，回收仍由 GC 决定。D 错在 JDK 7 就把字符串常量池移到堆、JDK 8 又用本地内存的元空间取代了永久代， PermGen 这一说法本身已过时。B 正确：栈、本地方法栈、程序计数器随线程创建销毁，天然私有；堆和元空间被所有线程共用。',
  },
  {
    id: 'cs-foundation-01-jvm-002',
    type: 'multiple',
    difficulty: 2,
    tags: ['GC Roots', '可达性分析'],
    stem: '下列哪些对象可以作为可达性分析的 GC Roots（选出所有正确项）？',
    options: [
      { key: 'A', text: '虚拟机栈的栈帧中，局部变量表引用的对象' },
      { key: 'B', text: '方法区中类的静态字段引用的对象' },
      { key: 'C', text: '本地方法栈中 JNI（Native 方法）引用的对象' },
      { key: 'D', text: '堆里某个已死对象，通过成员字段引用到的另一个对象' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'GC Roots 必须是「从 JVM 外部确定的、活的起点」，不能是堆内部互相指来指去的引用。A 是栈帧中的局部变量引用，属于最典型的一类 GC Root。B 是类静态字段引用，随 Class 存活，同样是起点。C 是 JNI 引用，Native 代码持有的对象不能被 GC 悄悄收走。D 错在这是两个堆对象之间的引用，若它们都不与任何 Root 连通，会被整组判定为不可达并一起回收——正是引用计数法会漏掉、而可达性分析能解决的场景。',
  },
  {
    id: 'cs-foundation-01-jvm-003',
    type: 'scenario',
    difficulty: 3,
    tags: ['GC 排查', '线上问题'],
    scenario:
      '一个 Spring Boot 订单服务上线两周后，监控显示 Full GC 从每天 1 次涨到每小时 3 次，每次停顿 1.2 秒，接口 P99 从 80ms 升到 900ms。堆 dump 的支配树里，一个 static 修饰的 ConcurrentHashMap 占了老年代 70%，里面堆着按订单号缓存的历史查询结果，且只 put 从没 remove。年轻代 GC 正常，堆已设成 -Xms=-Xmx=4g。',
    stem: '下列处置最合理的是？',
    options: [
      { key: 'A', text: '把 -Xmx 调到 8g，给老年代更大空间，Full GC 自然变少' },
      { key: 'B', text: '给缓存加上限与过期淘汰（如 Caffeine maximumSize + expireAfterWrite），改完压测观察 GC 曲线' },
      { key: 'C', text: '在每次接口返回前调用 System.gc()，主动把垃圾及时清掉' },
      { key: 'D', text: '把新生代比例调小、让对象更快晋升老年代，减少 Minor GC 次数' },
    ],
    answers: ['B'],
    explanation:
      '现象是「老年代被一个只增不减的静态集合吃满」，属于典型的内存泄漏，不是堆不够大。A 错在调大堆只是把装满的时间推后，对象仍不释放，Full GC 单次停顿反而可能更长。C 错在 System.gc() 只是建议且默认触发 Full GC，会主动制造 Stop-The-World，生产上通常用 -XX:+DisableExplicitGC 禁掉。D 错在让对象更快进老年代会加速泄漏堆积，与排查方向相反。B 正确：先定位泄漏源（支配树已指向这个 static Map），再给缓存加容量上限与 TTL，让对象可被回收，最后用压测验证 Full GC 频率与 P99 是否回落。',
  },
]
