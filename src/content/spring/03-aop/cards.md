## AOP：切面、代理与失效排查

### 是什么
AOP（面向切面编程）把"日志、事务、权限"这类横切逻辑从业务代码里抽出来，织入到目标方法周围。核心术语：**连接点（JoinPoint）**是程序中可被拦截的点（Spring AOP 里就是方法执行）；**切点（Pointcut）**是筛选连接点的表达式，如 `execution(* com.demo.service..*.*(..))`；**通知（Advice）**是拦截后执行的逻辑，分 @Before/@AfterReturning/@AfterThrowing/@After/@Around 五种；**切面（Aspect）**= 切点 + 通知。

### 为什么
Spring AOP 靠**动态代理**实现：目标类有接口默认用 JDK 动态代理，无接口用 CGLIB 生成子类；Spring Boot 2.x 起默认统一用 CGLIB（proxyTargetClass=true）。代理包裹目标对象，调用方拿到的是代理实例，增强逻辑因此能"透明"插入，业务代码零改动。

### 怎么用
同一个切面内（Spring 5.2.7+ 顺序统一）：正常返回时执行顺序是 **@Around 前半 → @Before → 目标方法 → @AfterReturning → @After → @Around 后半**；抛异常时 @AfterThrowing 替代 @AfterReturning 的位置，@After 依旧兜底执行。写耗时统计优先 @Around + System.nanoTime()，用 JoinPoint 取方法签名（getSignature）与入参（getArgs）。

### 常见坑
切面"不生效"几乎逃不出这几条：**同类 this 自调用**（绕过代理）、方法非 public、目标类/方法被 final 修饰（CGLIB 无法继承覆写）、对象是 new 出来的不归容器管、切点表达式写错。排查口诀：先确认对象是容器 Bean，再确认切点命中，最后看调用是否经过了代理。

### 面试怎么问
「Spring AOP 和 AspectJ 的区别？」——运行时动态代理 vs 编译期/类加载期织入；Spring AOP 只支持方法级连接点，AspectJ 功能更全、性能更好，Spring 可复用其注解风格。

## 动手清单

### 练习 1：写一个接口耗时统计切面
用 @Aspect + @Around 给 com.demo.controller 包下所有方法打印"方法名 + 入参 + 耗时毫秒数"（切点可用 execution 表达式）。

**自测标准**：能用 JoinPoint 拿到方法签名与参数，耗时用 System.nanoTime() 计算；故意在同类里自调用一次，确认日志消失并能解释原因。

### 练习 2：复现一次"切面失效"
把目标方法改成 private、把切面类上的 @Component 去掉、再用 new 创建目标对象，逐一验证通知不再执行。

**自测标准**：每种失效方式都能说出底层原因（代理没生成/没走代理），面试能不假思索列举三条以上。
