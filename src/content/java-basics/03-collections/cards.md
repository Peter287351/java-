# 03 集合框架

## List 选型与 ArrayList 扩容

### 是什么
ArrayList 底层是一个 Object[] 数组：无参构造是懒初始化，第一次 add 才分配容量 10；容量不足时按 oldCap + (oldCap >> 1) 扩到约 1.5 倍，并用 Arrays.copyOf 整体复制。LinkedList 是双向链表，头尾插删 O(1)，但按下标访问 get(i) 要从较近的一端遍历定位，平均 O(n)。TreeMap 基于红黑树按 key 有序；LinkedHashMap 继承 HashMap 并用双向链表维护遍历顺序（插入序或访问序）。

### 怎么用
- 业务场景默认选 ArrayList（连续内存对 CPU 缓存友好）；预估容量就传 initialCapacity，减少扩容复制。
- 需要「最近访问淘汰」的缓存，用 LinkedHashMap(accessOrder=true) + removeEldestEntry 实现 LRU。

### 常见坑
- List<Integer> 的 remove(1) 删的是下标 1 而不是元素 1；按值删要写 remove(Integer.valueOf(1))。
- 增强 for 中直接 list.remove 抛 ConcurrentModificationException（fail-fast），改用 removeIf 或 Iterator.remove()。
- 「LinkedList 增删一定快」是误解：先 O(n) 定位、后 O(1) 摘接，随机位置插入并不占优。

### 面试怎么问
「ArrayList 扩容机制？」——按「懒初始化 → 1.5 倍扩容 → 整体复制」三步答，再补「预估容量可避免反复复制」，体现工程意识。

## HashMap 原理与并发容器

### 是什么
JDK 8 的 HashMap 是「数组 + 链表 + 红黑树」：hash 先做高低位异或扰动（h ^ (h >>> 16)），下标用 (n - 1) & hash 计算；默认容量 16、负载因子 0.75，元素数超过阈值就扩容为 2 倍，扩容不重算 hash，只按新增高位是 0 还是 1 决定留在原位还是「原位 + 旧容量」；链表长度达到 8 且表长 ≥ 64 才树化为红黑树，退化阈值是 6。JDK 8 的 ConcurrentHashMap 改为「空桶 CAS + 非空桶 synchronized 锁头节点」，计数分散在 baseCount 与 CounterCell。fail-fast 靠迭代器比对 modCount 与 expectedModCount 实现。

### 常见坑
- 重写 equals 不重写 hashCode：作为 HashMap 的 key 会「存得进去、取不出来」。
- 树化条件是「链表长 8 + 表长 64」，表长不够时优先扩容拆链，不是 8 就树化。
- HashMap 允许一个 null key；ConcurrentHashMap 的 key 与 value 全禁 null（并发下 get 返回 null 有二义性）。
- ConcurrentHashMap.size() 是弱一致的近似值，没有全局锁就没有「永远精确」。

### 面试怎么问
「HashMap 什么时候链表转红黑树？」——先答 8，再补表长 64 与扩容优先，最后补退化阈值 6，一层比一层完整。

## 动手清单

### 练习 1：复现 fail-fast 与正确修法
写一段增强 for 中 remove 的代码触发 ConcurrentModificationException，改成 removeIf 再跑通；再构造一个「不抛异常但漏删」的用例。
自测标准：能解释 modCount / expectedModCount 校验为何是「尽力而为」，为什么偶发而不是必现。

### 练习 2：实现一个 LRU 缓存
用 new LinkedHashMap<Integer, String>(16, 0.75f, true) 重写 removeEldestEntry，容量设 3，依次 put 4 个 key 并打印遍历结果，验证最旧的被逐出、刚访问的被排到末尾。
自测标准：能说清 accessOrder=true 的访问序与默认插入序的区别。
