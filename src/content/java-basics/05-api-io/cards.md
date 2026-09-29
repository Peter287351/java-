# 05 常用 API 与 IO

## 字符串拼接与日期时间

### 是什么
String 不可变，循环拼接会每轮新建对象，应把 StringBuilder 提到循环外复用；StringBuffer 与 StringBuilder API 兼容，但每个方法带 synchronized，只在多线程共享同一个 builder 时才需要。java.time（JDK 8+）的 LocalDate / LocalDateTime 不可变且线程安全，plusXxx / minusXxx 都返回新对象；跨时区业务用 Instant / ZonedDateTime，本地业务用 LocalDateTime，跨系统传输用 UTC 的 Instant。

### 常见坑
- dt.plusDays(1) 忘记接返回值，日期纹丝不动——不可变对象的修改方法全部返回新对象。
- LocalDate.of(2026, 1, 31).plusMonths(1) 是 2026-02-28：月份加法会自动钳制到月末。
- SimpleDateFormat 线程不安全，并发格式化要用 DateTimeFormatter。
- FileReader 依赖平台默认字符集，跨平台读文件必埋雷，要显式传 Charset。

### 面试怎么问
「String、StringBuilder、StringBuffer 怎么选？」——按「单次表达式用 String（编译器会优化）、循环拼接用 StringBuilder、多线程共享用 StringBuffer」作答，再补一句 JDK 9 起单次拼接改用 invokedynamic 实现，体现版本敏感度。

## IO：字节流、字符流、缓冲与序列化

### 是什么
字节流（InputStream / OutputStream）处理一切二进制；字符流（Reader / Writer）按字符集完成字节与字符的转换、处理文本。缓冲流用内存缓冲把多次小 IO 合并成少数大 IO（默认约 8KB），写出路径上缓冲未刷 = 数据未落盘，靠 flush / close 保证。Java 序列化把对象转成字节流，serialVersionUID 是版本指纹，不一致抛 InvalidClassException；transient 字段跳过序列化。NIO.2 的 Files 与 Path（java.nio.file）是现代文件 API：readAllLines 整读小文件，Files.lines 流式读大文件。

### 常见坑
- 读文本不指定字符集：文件编码与解码字符集不一致就是乱码的唯一根因。
- 缓冲流写完不 close / flush，尾部数据丢在缓冲区里。
- 不固定 serialVersionUID，类结构一改旧数据全部反序列化失败。
- Files.copy 默认不覆盖已存在文件，要传 StandardCopyOption.REPLACE_EXISTING；Files.delete 删不存在文件抛异常，返回 false 的是 deleteIfExists。
- readAllBytes / readAllLines 整文件进内存，读大文件直接 OOM。

### 面试怎么问
「字节流和字符流怎么选？」——答「看内容有没有字符语义：文本用字符流并显式指定编码，图片、zip 等二进制用字节流」，再补缓冲流提速的本质是减少系统调用次数。

## 动手清单

### 练习 1：复现并修复一次乱码
用 GBK 编码写一个文本文件，用默认 UTF-8 的 FileReader 读出乱码，再换 InputStreamReader 显式指定 GBK 修好。
自测标准：能说出「文件编码 × 解码字符集」不匹配是乱码的唯一根因，修复点是显式 Charset。

### 练习 2：序列化兼容性实验
写一个实现 Serializable 的类并显式固定 serialVersionUID，序列化到文件后给类加一个新字段，再反序列化验证仍然成功（新字段为默认值）。
自测标准：能解释 UID 固定与「按类结构自动计算」的区别，以及新字段为什么取默认值。
