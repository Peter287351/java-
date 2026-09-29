import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'java-basics-01-syntax-001',
    type: 'single',
    difficulty: 1,
    tags: ['基本类型', '类型提升'],
    stem: '下列关于 Java 基本类型与运算行为的说法，正确的是？',
    options: [
      { key: 'A', text: '整数字面量默认类型是 long，浮点数字面量默认类型是 float' },
      { key: 'B', text: 'long x = 2147483648; 可以直接编译通过，因为 long 能容纳该值' },
      { key: 'C', text: 'byte、short、char 参与算术运算时会先提升为 int，运算结果也是 int' },
      { key: 'D', text: 'boolean 的大小由语言规范严格规定为 1 字节' },
    ],
    answers: ['C'],
    explanation:
      '整数（无后缀）默认按 int、浮点（无后缀）默认按 double 解析，A 把两者都说反了。B 错误：2147483648 超出 int 范围，字面量本身先按 int 解析就失败，必须写成 2147483648L。D 错误：JVM 规范并未规定 boolean 的精确大小，由具体虚拟机实现决定。C 正确：例如 byte b1 = 1, b2 = 2; 则 b1 + b2 的结果是 int，赋回 byte 需要强转。',
  },
  {
    id: 'java-basics-01-syntax-002',
    type: 'code',
    difficulty: 2,
    tags: ['IntegerCache', '自动装箱'],
    stem: `下面代码的输出是什么？

~~~java
public class Main {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println((a == b) + " " + (c == d));
    }
}
~~~`,
    options: [
      { key: 'A', text: 'true false' },
      { key: 'B', text: 'true true' },
      { key: 'C', text: 'false false' },
      { key: 'D', text: '编译错误：128 超出 byte 范围，不能赋给 Integer' },
    ],
    answers: ['A'],
    explanation:
      '自动装箱底层调用 Integer.valueOf，它复用 IntegerCache 缓存的 -128~127 区间对象：127 命中缓存，a 与 b 是同一个对象，== 为 true；128 超出区间，每次装箱都新建对象，== 比较地址为 false，A 正确、B 和 C 错误。D 错误：Integer 是 32 位整数包装类，与 byte 范围无关，代码能正常编译。包装类比较值应使用 equals，== 只在缓存区间内「碰巧」正确，是隐蔽 bug 的常见来源。',
  },
  {
    id: 'java-basics-01-syntax-003',
    type: 'single',
    difficulty: 2,
    tags: ['自动装箱拆箱', 'NullPointerException'],
    stem: `下面代码的运行结果是？

~~~java
Map<String, Integer> score = new HashMap<>();
score.put("math", 90);
int total = score.get("english");
System.out.println(total);
~~~`,
    options: [
      { key: 'A', text: '输出 0' },
      { key: 'B', text: '输出 null' },
      { key: 'C', text: '抛出 NullPointerException' },
      { key: 'D', text: '编译错误：get 返回 Integer，不能赋给 int' },
    ],
    answers: ['C'],
    explanation:
      'get("english") 返回 null，把它赋给 int 触发自动拆箱，编译器插入了 intValue() 调用，对 null 拆箱即抛 NullPointerException，C 正确。A 错误：key 缺失返回的是 null 而不是 0，默认值必须显式用 getOrDefault 提供。B 错误：null 一经拆箱就不存在，int 变量装不下 null。D 错误：编译期自动拆箱完全合法，问题发生在运行期。安全写法是 int total = score.getOrDefault("english", 0); 或先用 Integer 接住再判空。',
  },
  {
    id: 'java-basics-01-syntax-004',
    type: 'single',
    difficulty: 1,
    tags: ['String不可变', '常量池'],
    stem: '关于 String 的不可变性（immutability）与字符串常量池（string pool），下列说法正确的是？',
    options: [
      { key: 'A', text: '执行 s.toUpperCase() 后，s 本身变成大写' },
      { key: 'B', text: '"ab" + "cd" 是编译期常量折叠，结果与字面量 "abcd" 指向常量池中的同一个对象' },
      { key: 'C', text: 'new String("ab") 与字面量 "ab" 是同一个对象，== 比较为 true' },
      { key: 'D', text: 'String 设计成不可变只是为了节省内存，与安全和 hashCode 缓存无关' },
    ],
    answers: ['B'],
    explanation:
      '两个编译期常量相加会在编译期折叠成一个常量池条目，与字面量 "abcd" 是同一对象，B 正确。A 错误：String 不可变，toUpperCase 返回新对象，原串不变，必须用 s = s.toUpperCase() 接住返回值。C 错误：new 一定在堆上创建新对象，== 为 false，equals 才为 true。D 错误：不可变让 String 可安全共享（常量池）、hashCode 可缓存（可放心作 HashMap 的 key）且天然线程安全，内存只是收益之一。',
  },
  {
    id: 'java-basics-01-syntax-005',
    type: 'single',
    difficulty: 2,
    tags: ['==', 'equals'],
    stem: '关于 == 与 equals() 的区别，下列说法正确的是？',
    options: [
      { key: 'A', text: '== 比较引用类型时，比较的是对象内容是否一致' },
      { key: 'B', text: 'String 重写了 equals 按内容比较；自定义类不重写 equals 时，它继承 Object 的实现，行为与 == 相同' },
      { key: 'C', text: '重写 equals 而不重写 hashCode，会直接编译报错' },
      { key: 'D', text: 'equals 更安全，任何场景都应优先用 equals 代替 ==' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：Object.equals 的默认实现就是 return this == obj，只有重写后才变成内容比较，String、Integer 等常用类都重写了。A 错误：== 对引用类型比较的是引用（地址）。C 错误：不重写 hashCode 能通过编译，但违反「equals 相等则 hashCode 必须相等」的契约，对象放进 HashMap/HashSet 会出问题。D 错误：基本类型只能用 ==；对可能为 null 的引用调 equals 还会 NPE，应写成常量在前或用 Objects.equals。',
  },
  {
    id: 'java-basics-01-syntax-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['类型转换', '运算精度'],
    stem: '关于类型转换与运算精度，下列说法正确的有？（多选）',
    options: [
      { key: 'A', text: 'int 到 long 是自动拓宽转换；long 到 int 必须强制转换，且可能高位截断' },
      { key: 'B', text: 'double 计算 1.0 - 0.9 的结果精确等于 0.1' },
      { key: 'C', text: '两个 int 相除直接截断小数，5 / 2 的结果是 2' },
      { key: 'D', text: 'byte b = 1; b = b + 1; 可以直接编译通过' },
      { key: 'E', text: 'float f = 3.14; 可以直接编译通过' },
    ],
    answers: ['A', 'C'],
    explanation:
      'A 正确：窄化转换必须显式强转，如 (int) someLong，超范围会截断高位。C 正确：整数除法向零取整，想要小数须先转成 5.0 / 2。B 错误：IEEE 754 二进制浮点无法精确表示 0.1，1.0 - 0.9 得到 0.09999999999999998，金额计算应使用 BigDecimal。D 错误：b + 1 提升为 int，赋回 byte 报精度丢失错误；b += 1 是复合赋值、自带隐式窄化，反而能编译。E 错误：3.14 是 double 字面量，赋给 float 须写 3.14f。',
  },
  {
    id: 'java-basics-01-syntax-007',
    type: 'single',
    difficulty: 3,
    tags: ['switch', '循环控制'],
    stem: '关于 switch 与循环控制，下列说法正确的是？',
    options: [
      { key: 'A', text: 'switch 支持 String 与枚举，但 case 漏写 break 会「贯穿」继续执行下一个 case' },
      { key: 'B', text: 'switch 的条件表达式可以是 long、float 或 boolean' },
      { key: 'C', text: 'switch (null) 会匹配 default 分支' },
      { key: 'D', text: '循环体中的 continue 会终止整个循环' },
    ],
    answers: ['A'],
    explanation:
      'A 正确：switch 可用 byte/short/char/int 及其包装类、String（JDK 7 起）与枚举，漏写 break 会 fall-through 顺序执行后续 case。B 错误：long、float、double、boolean 都不能作为 switch 条件。C 错误：switch 的条件为 null 不会走 default，而是直接抛 NullPointerException。D 错误：continue 只跳过本次循环进入下一轮，终止循环的是 break；跳出多重循环需要「标签 + break」。',
  },
  {
    id: 'java-basics-01-syntax-008',
    type: 'scenario',
    difficulty: 3,
    tags: ['浮点精度', 'BigDecimal'],
    scenario:
      '账单系统上线后，财务对账发现「订单合计」比明细逐笔相加偶尔差一两分钱。相关代码用 double 存金额、用 0.1 表示折扣率，汇总循环里逐笔按 amount * 0.1 打折后累加。同事本地复现：0.1 + 0.2 的结果是 0.30000000000000004。数据库中金额字段是 DOUBLE 类型。',
    stem: '作为后端，最合理的修复方案是？',
    options: [
      { key: 'A', text: '金额链路整体改用 BigDecimal，并用 new BigDecimal("0.1") 这类字符串构造，数据库字段改为 DECIMAL' },
      { key: 'B', text: '把 double 全部换成 float，float 更省内存、误差也更小' },
      { key: 'C', text: '每笔累加后立即 Math.round 到分，误差就不会累积了' },
      { key: 'D', text: '误差来自数据库 DOUBLE 字段截断，只把数据库字段改成 FLOAT 即可' },
    ],
    answers: ['A'],
    explanation:
      '根因是 IEEE 754 二进制浮点无法精确表示 0.1 等十进制小数，逐笔折扣与累加不断放大误差。A 从表示层根治：BigDecimal 做十进制精确计算，字符串构造避免 new BigDecimal(0.1) 继承 double 的误差，数据库用 DECIMAL 定点存储。B 错误：float 只有约 7 位有效数字，精度更低。C 是治标：每笔中间舍入会引入新的累积偏差，还与舍入模式耦合。D 方向错：DOUBLE 换 FLOAT 精度更差，而且问题并不只出在数据库。',
  },
]
