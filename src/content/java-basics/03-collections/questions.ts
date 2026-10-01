import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'java-basics-03-collections-001',
    type: 'single',
    difficulty: 1,
    tags: ['ArrayList', 'LinkedList'],
    stem: '关于 ArrayList 与 LinkedList，下列说法正确的是？',
    options: [
      { key: 'A', text: 'new ArrayList<>() 会立刻创建一个容量为 10 的数组' },
      { key: 'B', text: 'ArrayList 扩容约为原容量的 1.5 倍；LinkedList 按下标 get(i) 需要从头或尾遍历定位，平均 O(n)' },
      { key: 'C', text: 'LinkedList 在任意下标处插入元素都是 O(1)，因此增删场景永远选它' },
      { key: 'D', text: 'ArrayList 底层是「数组 + 链表」的混合结构' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：ArrayList 扩容公式是 oldCap + (oldCap >> 1)，即约 1.5 倍；LinkedList 虽会从较近的一端开始遍历，按下标定位仍是线性代价。A 错误：无参构造是懒初始化，持有空数组，第一次 add 时才扩到容量 10。C 错误：插到指定下标前要先 O(n) 定位，只有「已定位节点的摘除与挂接」才是 O(1)；加上 ArrayList 连续内存对 CPU 缓存更友好，多数业务场景仍首选 ArrayList。D 错误：ArrayList 底层就是纯 Object[] 数组。',
  },
  {
    id: 'java-basics-03-collections-002',
    type: 'single',
    difficulty: 1,
    tags: ['HashMap', '树化', '扩容'],
    stem: '关于 HashMap 的 put 与扩容（JDK 8+），下列说法正确的是？',
    options: [
      { key: 'A', text: '某个桶的链表长度达到 8 时，一定立刻树化为红黑树' },
      { key: 'B', text: '默认负载因子 0.75，元素数量超过 容量 × 0.75 时触发扩容，容量翻倍' },
      { key: 'C', text: '扩容后每个元素都要用 hashCode 重新计算数组下标' },
      { key: 'D', text: 'HashMap 的 key 为 null 时，put 会抛出 NullPointerException' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：默认容量 16、负载因子 0.75，size 超过阈值（如 16 × 0.75 = 12）就 resize 为原来的 2 倍。A 错误：树化还需表长 ≥ 64（MIN_TREEIFY_CAPACITY），否则优先扩容、通过链表拆分缓解碰撞。C 错误：JDK 8 扩容不重算 hash，只看 hash 在「新增那一位高位」上的 0/1，决定留在原下标还是落到「原下标 + 旧容量」。D 错误：HashMap 允许一个 null key（hash 固定按 0 处理）；禁 null 的是 Hashtable 与 ConcurrentHashMap。',
  },
  {
    id: 'java-basics-03-collections-003',
    type: 'single',
    difficulty: 3,
    tags: ['hash扰动'],
    stem: 'JDK 8 中 HashMap 的 hash 方法实现为：先 h = key.hashCode()，再返回 h ^ (h >>> 16)。引入「高低位异或扰动」的主要目的是？',
    options: [
      { key: 'A', text: '把负的 hashCode 转成正数，避免数组下标为负' },
      { key: 'B', text: '数组下标用 (n - 1) & hash 计算，n 较小时只用到低位；把高 16 位异或进低位，让高位信息也参与下标运算，减少小表下的碰撞' },
      { key: 'C', text: '这是一种加密散列，可以防御哈希碰撞拒绝服务攻击' },
      { key: 'D', text: '把任意长度的对象压缩到 int 范围内' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：n = 16 时 (n - 1) & hash 只取低 4 位，hashCode 的高位信息被完全丢弃；异或扰动把高 16 位「折」进低 16 位，显著降低小容量表上的碰撞概率。A 错误：& 运算天然把结果截断在 [0, n-1]，不需要正数化。C 错误：一次异或谈不上加密，HashMap 也未承诺抗碰撞攻击。D 错误：hashCode 本身就是 int，不存在压缩到 int 的问题。',
  },
  {
    id: 'java-basics-03-collections-004',
    type: 'single',
    difficulty: 3,
    tags: ['ConcurrentHashMap'],
    stem: '关于 JDK 8 的 ConcurrentHashMap，下列说法正确的是？',
    options: [
      { key: 'A', text: '沿用了 JDK 7 的分段锁（Segment）设计，只是把段数调大了' },
      { key: 'B', text: 'put 时空桶用 CAS 写入，非空桶用 synchronized 锁住桶的头节点，锁粒度细到单个桶' },
      { key: 'C', text: 'key 和 value 都允许为 null，与 HashMap 行为一致' },
      { key: 'D', text: 'size() 读取一个全局 volatile 计数器，永远精确等于当前元素数' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：JDK 8 抛弃 Segment，改为「CAS + synchronized 锁桶头」——空桶无锁 CAS 写入，冲突时只锁一个桶，并发度远高于 JDK 7 的段锁。A 错误：Segment 仅保留类结构做兼容，不再参与加锁。C 错误：ConcurrentHashMap 禁止 null key 和 null value——并发下 get 返回 null 无法区分「键不存在」与「值就是 null」，存在二义性。D 错误：计数分散在 baseCount 与 CounterCell 数组中，size() 是统计时刻的弱一致近似值。',
  },
  {
    id: 'java-basics-03-collections-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['equals', 'hashCode契约'],
    stem: '关于 equals 与 hashCode 的契约，下列说法正确的有？（多选）',
    options: [
      { key: 'A', text: '两个对象 equals 相等，则它们的 hashCode 必须相等' },
      { key: 'B', text: '两个对象 hashCode 相等，则它们必须 equals 相等' },
      { key: 'C', text: '重写了 equals 却不重写 hashCode，对象作为 HashMap 的 key 时可能出现「存得进去、取不出来」' },
      { key: 'D', text: '数组应使用 Arrays.equals 比较内容；直接调用数组继承来的 equals 比较的是引用' },
      { key: 'E', text: '对 String 来说，== 与 equals 的行为完全一致' },
    ],
    answers: ['A', 'C', 'D'],
    explanation:
      'A 是契约的一半：equals 相等则 hashCode 必须相等。C 正确：不重写 hashCode 时对象按「身份」散列，put 与 get 用两个内容相等的不同对象会落进不同桶，get 返回 null。D 正确：数组没有重写 equals，要用 Arrays.equals / Arrays.hashCode 按内容处理。B 错误：hashCode 相等只说明发生了碰撞，equals 仍可不等——契约是单向蕴含。E 错误：s1 == s2 比较引用（常量池可能相同、new 出来必不同），equals 比较字符内容。',
  },
  {
    id: 'java-basics-03-collections-006',
    type: 'single',
    difficulty: 2,
    tags: ['TreeMap', 'LinkedHashMap'],
    stem: '关于 TreeMap 与 LinkedHashMap，下列说法正确的是？',
    options: [
      { key: 'A', text: 'LinkedHashMap 继承 HashMap 后只保留插入顺序这一种遍历行为，无法实现 LRU 缓存' },
      { key: 'B', text: 'TreeMap 基于红黑树按 key 排序，put/get 为 O(log n)，key 必须可比较：实现 Comparable 或构造时传入 Comparator' },
      { key: 'C', text: 'TreeMap 在使用自然排序时允许插入 null key' },
      { key: 'D', text: 'LinkedHashMap 的遍历顺序与 hash 桶的分布有关，每次运行都不确定' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：TreeMap 按 key 有序维护红黑树，增删查都是对数复杂度，比较逻辑二选一。A 错误：构造时 accessOrder=true 后按访问顺序重排链表，配合重写 removeEldestEntry 就是经典 LRU 缓存。C 错误：自然排序下比较 null 会抛 NullPointerException。D 错误：LinkedHashMap 用双向链表把全部条目串成确定顺序（插入序或访问序），与桶分布无关。',
  },
  {
    id: 'java-basics-03-collections-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['fail-fast', '迭代'],
    scenario: `定时任务每分钟清理过期会话，核心代码：

~~~java
for (Session s : sessionList) {
    if (s.expired()) {
        sessionList.remove(s);
    }
}
~~~

上线后日志里偶发 ConcurrentModificationException；更棘手的是还出现过几次「不抛异常但漏删/跳过元素」。这段代码跑在单线程定时任务里，没有其他线程修改这个 list。`,
    stem: '对现象的判断与处置，最合理的是？',
    options: [
      { key: 'A', text: 'catch 住 ConcurrentModificationException 后重试整个清理任务' },
      { key: 'B', text: '把列表换成 CopyOnWriteArrayList，异常消失即可' },
      { key: 'C', text: '这是 fail-fast：增强 for 依赖的迭代器发现 modCount 被直接 remove 改动而失败；且删除恰好让 size 变化没被校验捕获时会漏删。改用 sessionList.removeIf(s -> s.expired()) 或显式 Iterator.remove()' },
      { key: 'D', text: '把增强 for 改成下标 for 循环，边遍历边 remove 就不会出问题' },
    ],
    answers: ['C'],
    explanation:
      'C 完整覆盖诊断与修复：ArrayList 内部用 modCount 记录结构性修改次数，增强 for 的迭代器每次 next 前校验 expectedModCount，不一致就抛 CME——fail-fast 只是「尽力快速失败」，不是保证抛出，「没抛但漏删」恰恰是证据；官方解法是 removeIf 或 Iterator.remove()。A 错误：重试既掩盖漏删的正确性 bug，也无法解释偶发性。B 错误：CopyOnWriteArrayList 遍历的是不可变快照，remove 修改的是新副本，异常确实消失，但本次遍历永远看不到删除结果，语义错误。D 错误：下标循环边删边前进同样会跳元素（删除后下标没有回退），问题只是换了形态。',
  },
  {
    id: 'java-basics-03-collections-008',
    type: 'code',
    difficulty: 2,
    tags: ['ArrayList', 'remove重载'],
    stem: `下面代码的输出是什么？

~~~java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);
        list.remove(1);
        System.out.println(list);
    }
}
~~~`,
    options: [
      { key: 'A', text: '[10, 30]' },
      { key: 'B', text: '[10, 20, 30]' },
      { key: 'C', text: '[20, 30]' },
      { key: 'D', text: '编译错误：1 无法匹配 remove(Object) 的参数类型' },
    ],
    answers: ['A'],
    explanation:
      'remove 有 remove(int index) 与 remove(Object o) 两个重载：字面量 1 是 int，精确匹配下标版本（装箱到 Object 的匹配优先级更低），删掉下标 1 的元素 20，剩 [10, 30]，A 正确。B 是「按值删 1、列表里没有 1 所以不变」的臆测——代码根本走不到按值分支。C 是把 remove(1) 误当成删除第一个元素（下标 0）。D 错误：int 参数完全合法。List<Integer> 想按值删除必须写 list.remove(Integer.valueOf(20))，这是一对经典重载坑。',
  },
  {
    id: 'java-basics-03-collections-009',
    type: 'scenario',
    difficulty: 2,
    tags: ['fail-fast', '遍历删除'],
    scenario:
      '定时任务遍历 ArrayList 过滤已注销用户：for-each 循环里直接 list.remove(u)。测试环境只有几十条数据从没出问题，生产数据上万后偶发 ConcurrentModificationException，且删除的元素越多越容易触发。',
    stem: '对原因与修复的判断，最准确的是？',
    options: [
      { key: 'A', text: 'for-each 底层用 Iterator，遍历中直接改 list 会让 modCount 与迭代器记录的 expectedModCount 不一致，下次 next() 抛 CME；应改用 iterator.remove() 或 list.removeIf(u -> 条件)' },
      { key: 'B', text: 'CME 是偶发的内存问题，捕获异常后重试整段逻辑即可' },
      { key: 'C', text: '把 ArrayList 换成 Vector（线程安全）就不会再抛这个异常了' },
      { key: 'D', text: '是堆内存不足导致的，把 -Xmx 调大一倍即可' },
    ],
    answers: ['A'],
    explanation:
      'fail-fast 机制：Iterator 每次 next() 校验 modCount，遍历中用 list 自身 remove 会修改它而不更新迭代器的 expectedModCount → 抛 CME；数据量小、删除恰好落在末尾时可能「侥幸不触发」，所以测试难复现。正确姿势是 iterator.remove()（同步修正两个计数）或 removeIf。B 治标且重试还会抛；Vector 同步的是线程安全不是 fail-fast，单线程遍历照样抛；D 与该异常无关。',
  },
]
