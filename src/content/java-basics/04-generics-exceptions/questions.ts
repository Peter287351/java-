import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'java-basics-04-generics-exceptions-001',
    type: 'single',
    difficulty: 1,
    tags: ['受检异常', '非受检异常'],
    stem: '关于受检异常（checked）与非受检异常（unchecked），下列说法正确的是？',
    options: [
      { key: 'A', text: 'Error（如 OutOfMemoryError）属于受检异常，方法签名必须用 throws 声明' },
      { key: 'B', text: 'IOException、SQLException 这类继承自 Exception 但不属于 RuntimeException 分支的异常是受检的，编译器强制捕获或声明；RuntimeException 及其子类与 Error 都是非受检的' },
      { key: 'C', text: '受检异常都继承自 RuntimeException' },
      { key: 'D', text: 'throws 声明了某个受检异常，方法体内就必须真的抛出它' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：Throwable 下分 Error 与 Exception；Exception 里除 RuntimeException 分支外都是受检异常，编译期强制处理，其余为非受检。A 错误：Error 是非受检的，且表示严重的系统级问题，通常不应捕获。C 说反了：RuntimeException 恰恰是非受检分支的根。D 错误：throws 只是声明「可能抛出」，声明得比实际抛出的更宽是合法的。',
  },
  {
    id: 'java-basics-04-generics-exceptions-002',
    type: 'single',
    difficulty: 2,
    tags: ['泛型擦除'],
    stem: '关于泛型的类型擦除（type erasure），下列说法正确的是？',
    options: [
      { key: 'A', text: 'new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass() 的结果是 true' },
      { key: 'B', text: '擦除之后所有泛型信息都消失了，反射也无法获取字段上声明的泛型类型' },
      { key: 'C', text: '由于擦除，代码里不能 new T()，但可以 new T[10]' },
      { key: 'D', text: 'List<Object> 类型的变量可以直接接收一个 List<String> 的引用' },
    ],
    answers: ['A'],
    explanation:
      'A 正确：编译后泛型参数被擦除为边界（无边界即 Object），两个 List 在运行时是同一个 Class 对象。B 错误：擦除针对「实例的运行时类型」，但字段与方法声明上的泛型保留在字节码 Signature 属性里，field.getGenericType() 可读到——这正是 Gson、Jackson 反序列化的基础。C 错误：new T[] 同样不允许（数组创建需要运行时具体类型），只能 (T[]) new Object[10] 强转。D 错误：泛型是不变（invariant）的，List<String> 不是 List<Object> 的子类型，赋值编译不过。',
  },
  {
    id: 'java-basics-04-generics-exceptions-003',
    type: 'single',
    difficulty: 3,
    tags: ['PECS', '通配符'],
    stem: 'JDK 的集合复制方法签名为 copy(List<? super T> dest, List<? extends T> src)。按 PECS 原则，这样声明的原因是？',
    options: [
      { key: 'A', text: 'dest 负责生产数据、src 负责消费数据，所以方向相反' },
      { key: 'B', text: 'src 只被读取（生产 T 元素）用 extends；dest 只被写入（消费 T 元素）用 super。Producer Extends, Consumer Super，让方法兼容更多集合类型且类型安全' },
      { key: 'C', text: 'extends 比 super 的运行时性能更好，应尽量多用 extends' },
      { key: 'D', text: '通配符只是语法糖，把两个参数都改成 List<T> 语义完全等价且更简单' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：从 src 读出的一定「至少是 T」（extends 上界），往 dest 写入的 T 一定能放进「T 或其父类型」的集合（super 下界），读生产、写消费各取所需。A 把两个词的方向说反了。C 错误：通配符是编译期概念，运行期同样擦除，不存在性能差异。D 错误：泛型不变，改成 List<T> 后 copy(animalList, dogList) 这类「子类型集合读入父类型集合」的组合全部编译失败，灵活性大幅下降。',
  },
  {
    id: 'java-basics-04-generics-exceptions-004',
    type: 'code',
    difficulty: 2,
    tags: ['finally', '返回值'],
    stem: `下面代码的输出是什么？

~~~java
public class Main {
    static int calc() {
        int x = 1;
        try {
            return x;
        } finally {
            x = 99;
        }
    }

    public static void main(String[] args) {
        System.out.println(calc());
    }
}
~~~`,
    options: [
      { key: 'A', text: '99' },
      { key: 'B', text: '1' },
      { key: 'C', text: '100' },
      { key: 'D', text: '编译错误：finally 中不能修改局部变量' },
    ],
    answers: ['B'],
    explanation:
      '执行 return x 时，x 的当前值 1 已被复制到返回值暂存区；finally 修改的只是局部变量 x 本身，不影响已定型的返回值，输出 1，B 正确。A 错误：那需要 finally 里写 return 99——finally 中的 return 会直接覆盖返回值，还会吞掉 try 中抛出的异常，属于强烈不推荐的写法。C 无来源。D 错误：语法完全允许修改局部变量，只是修改不会回传到返回值。',
  },
  {
    id: 'java-basics-04-generics-exceptions-005',
    type: 'single',
    difficulty: 1,
    tags: ['try-with-resources'],
    stem: '关于 try-with-resources（JDK 7+），下列说法正确的是？',
    options: [
      { key: 'A', text: '只有实现了 Closeable 接口的类才能用在 try(...) 中' },
      { key: 'B', text: '多个资源按声明顺序依次关闭' },
      { key: 'C', text: '资源对象须实现 AutoCloseable；多个资源的关闭顺序与声明顺序相反，关闭时抛出的异常会作为被抑制异常（suppressed）挂到主异常上，可通过 getSuppressed() 取回' },
      { key: 'D', text: 'try(...) 中声明的资源变量在整个方法内都可访问' },
    ],
    answers: ['C'],
    explanation:
      'C 完整正确：门槛是 AutoCloseable（Closeable 是它的子接口）；关闭按声明的逆序执行，像出栈一样；try 体与 close 同时抛异常时，主异常保留、close 的异常被抑制记录，不会互相覆盖。A 错误：AutoCloseable 就够了。B 错误：顺序说反了。D 错误：资源变量的作用域限于 try 块内。',
  },
  {
    id: 'java-basics-04-generics-exceptions-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['异常链', '自定义异常'],
    stem: '关于异常链与自定义异常的设计，下列说法正确的有？（多选）',
    options: [
      { key: 'A', text: '捕获底层异常 A 后包装成业务异常 B 抛出时，应把 A 作为 cause 传入，保住完整根因链' },
      { key: 'B', text: '只要底层异常出现过，不带 cause 的 new BusinessException("下单失败") 事后也能被追溯' },
      { key: 'C', text: '自定义异常通常应提供「无参、带 message、带 message + cause」三个构造器' },
      { key: 'D', text: '异常对象构造要抓栈、开销大，所以用异常跳出深层循环可以提升性能' },
      { key: 'E', text: '任何异常对象的 getMessage() 都不会返回 null' },
    ],
    answers: ['A', 'C'],
    explanation:
      'A、C 正确：cause 是异常链的「上一环」，吞掉它排查时只剩「下单失败」四个字；三件套构造器是自定义异常的最小完备设计。B 错误：不传 cause，包装后的新异常与原异常毫无关联，原始堆栈完全丢失。D 因果颠倒：正因为 fillInStackTrace 抓栈昂贵，异常才只该用于异常路径，拿它做流程控制反而更慢且语义混乱。E 错误：例如 NullPointerException 的 getMessage() 经常是 null，打日志前要防二次 NPE。',
  },
  {
    id: 'java-basics-04-generics-exceptions-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['异常吞没', '日志排查'],
    scenario:
      '支付回调接口偶发丢单：第三方确认回调已送达，但订单状态未更新。排查发现：入口代码里有一处 catch (Exception e) { } 空捕获；另一个分支只调用 e.printStackTrace()（生产环境标准输出被重定向到了 /dev/null）。日志平台在这两个时间段内没有任何 ERROR 记录，数据库里也没有该笔回调的报文。',
    stem: '最合理的判断与修复是？',
    options: [
      { key: 'A', text: '根因是异常被静默吞掉：补全 catch 逻辑——用日志框架记录完整堆栈与回调报文（保留 cause），并按业务语义决定重试或抛出自定义业务异常交由上层统一处理；同时把「空 catch」设为 Code Review 红线' },
      { key: 'B', text: '在最外层加一个 catch (Throwable t) { } 兜底，保证接口永远不向调用方报错' },
      { key: 'C', text: '把 e.printStackTrace() 改成 System.out.println(e)，这样控制台总能看到异常' },
      { key: 'D', text: '先重启并扩容数据库，丢单通常是数据库压力过大导致的丢写入' },
    ],
    answers: ['A'],
    explanation:
      '「第三方已回调 + 日志无任何 ERROR + 报文未落库」三条线索共同指向异常被吞：空 catch 与 printStackTrace（不进日志框架、生产不可见）让失败完全不可观测。A 给出完整修复链：保留 cause 记录完整堆栈、留存回调报文、明确重试或上抛策略，并从规范上禁止空 catch。B 错误：继续吞掉异常，连 Error 一起吞，问题只会更隐蔽。C 错误：stdout 不是结构化日志，生产环境通常收集不到；println(e) 还只打印异常类名、不带堆栈。D 是无证据的误诊，重启扩容与丢单现象没有因果。',
  },
]
