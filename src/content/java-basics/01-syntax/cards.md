# 01 语法与数据类型

## 基本类型、类型转换与浮点精度

### 是什么
Java 有 8 种基本类型：整型的 byte / short / int / long、浮点的 float / double、字符 char、布尔 boolean。整数字面量默认按 int 解析、浮点字面量默认按 double 解析；long 字面量要加 L 后缀，float 要加 f 后缀。窄化转换（long→int、double→int）必须显式强转；byte、short、char 参与算术运算时会先提升（promotion）为 int 再计算。

### 为什么
JVM 的算术指令按 int / long 设计，窄类型运算提升为 int 可以简化指令集；而 double 遵循 IEEE 754 二进制浮点标准，0.1 这类十进制小数在二进制下是无限循环小数，天生就「存不准」。

### 怎么用
- 金额、费率等精确小数一律用 BigDecimal，并用字符串构造：new BigDecimal("0.1")，数据库字段用 DECIMAL。
- 想要小数除法，先把操作数转成 double：5.0 / 2，而不是依赖 5 / 2 的整数截断。

### 常见坑
- long x = 2147483648; 编译不过：字面量先按 int 解析就溢出了，必须写 2147483648L。
- byte b = 1; b = b + 1; 编译报错（b + 1 是 int），但 b += 1 能编译——复合赋值自带隐式窄化转换。
- 0.1 + 0.2 == 0.3 为 false，结果是 0.30000000000000004。

### 面试怎么问
「为什么金额不能用 double？」——先答 IEEE 754 二进制无法精确表示十进制小数，再说累加与折扣会放大误差，最后给出 BigDecimal（字符串构造）或以「分」为单位存 long 的方案，链路完整。

## 包装类缓存、String 常量池与 ==/equals

### 是什么
包装类（wrapper class）让基本类型能参与泛型与集合，自动装箱底层调用 Integer.valueOf，它会复用 IntegerCache 在 -128~127 区间缓存的同一个对象。String 是不可变类（immutable），字面量与编译期常量折叠的结果都放在字符串常量池（string pool）里。== 比较的是引用（地址）；equals 的默认实现就是 ==，String、Integer 等重写后才变成内容比较。

### 常见坑
- Integer a = 128, b = 128; 则 a == b 为 false——缓存只在 -128~127 生效，包装类比较值永远用 equals 或 Objects.equals。
- Map 里 get 返回的 Integer 直接赋给 int：key 不存在时拆箱 null 抛 NullPointerException，改用 getOrDefault。
- new String("ab") 一定在堆上创建新对象，与常量池里的 "ab" 用 == 比较为 false。
- 循环里 s += x 每轮都新建 String 对象，循环拼接要用 StringBuilder。

### 面试怎么问
「127 的 Integer == 比较为 true，128 为什么 false？」——先答 IntegerCache 缓存区间，再补一句「== 比地址、值比较用 equals」，最后提 -XX:AutoBoxCacheMax 可以调上限，三句话体现完整度。

## 动手清单

### 练习 1：亲眼验证缓存与常量池
写一个 main 方法：打印 127、128 两对 Integer 的 == 结果；再构造三组字符串（字面量相加、new String、StringBuilder.toString），分别打印 == 与 equals 的结果。
自测标准：不看资料能逐行预测输出，并用「缓存区间」「常量池折叠」「堆上新对象」解释每一行。

### 练习 2：亲手拆出一个拆箱 NPE
用 Map<String, Integer> 复现「get 不存在的 key 后直接赋给 int」抛 NullPointerException，再改写成 getOrDefault 版本验证修复。
自测标准：能说出编译器在拆箱处插入了 intValue() 调用，null 调用该方法才炸。
