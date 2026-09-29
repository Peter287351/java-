# 04 泛型与异常

## 泛型：类型擦除与 PECS

### 是什么
泛型是编译期类型检查机制，运行时被擦除（type erasure）：List<String> 与 List<Integer> 是同一个 Class 对象，不能 new T() 也不能 new T[]；但字段与方法声明上的泛型会保留在字节码的 Signature 属性里，反射 getGenericType() 可以读到——JSON 框架的反序列化正靠它。通配符两条铁律：Producer Extends（只读用 ? extends T）、Consumer Super（只写用 ? super T），合称 PECS。

### 怎么用
- 集合参数「只出不进」用 extends，「只进不出」用 super，又进又出用确切类型 T。
- 记住泛型是不变（invariant）的：List<String> 不是 List<Object> 的子类型，不能靠元素继承关系混用。

### 常见坑
- 泛型只在编译期拦截，运行期可通过原始类型（raw type）绕过检查塞进错误类型。
- 静态方法与静态字段不能使用类上声明的类型参数 T。
- List<?> 只能读出 Object，除 null 外什么都写不进去。

### 面试怎么问
「为什么 Collections.copy 的 dest 用 ? super T、src 用 ? extends T？」——答 PECS：往里写（消费）用 super，让 List<Animal> 能接住 Dog 元素；往外读（生产）用 extends，保证读出来至少是 T。

## 异常：体系、try-with-resources 与异常链

### 是什么
Throwable 下分 Error（严重错误，不应捕获处理）与 Exception；Exception 中除 RuntimeException 分支外都是受检异常（checked），编译器强制 catch 或 throws。try-with-resources 要求资源实现 AutoCloseable，按声明逆序关闭；try 体与 close 同时抛异常时，close 的异常作为「被抑制异常」（suppressed）挂到主异常上，可用 getSuppressed() 取回。捕获 A 异常再抛 B 时，把 A 作为 cause 传入，保住完整根因链。

### 怎么用
- 自定义业务异常继承 RuntimeException，提供「无参、message、message + cause」三个构造器。
- 流、连接等资源一律 try-with-resources，告别手写 finally 关闭与嵌套 try。

### 常见坑
- finally 里写 return 会覆盖返回值，并吞掉 try 中抛出的异常。
- catch (Exception e) {} 空 catch 让线上问题「无日志可查」。
- 包装新异常时不带 cause，原始堆栈完全丢失。
- 异常构造要抓栈（fillInStackTrace），拿异常做流程控制又慢又语义混乱。

### 面试怎么问
「受检与非受检异常怎么选？」——答「调用方有能力恢复的用受检（强制处理），程序 bug 或非法状态用非受检」，再补 try-with-resources 的逆序关闭与 suppressed 机制，体现 JDK 7+ 的知识增量。

## 动手清单

### 练习 1：验证擦除与 finally 返回值
打印 new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()；再写 try-return + finally 修改局部变量的例子，先预测后验证输出。
自测标准：两个结果都能说出原理——擦除后运行时是同一个 Class；返回值在执行 return 时已暂存。

### 练习 2：写一个规范的业务异常
定义 OrderNotFoundException extends RuntimeException，三个构造器齐全；在 Service 里 catch IOException 后包装抛出，打印堆栈观察完整 cause 链。
自测标准：堆栈末尾能看到 Caused by: 段，且每一层 cause 都有信息量。
