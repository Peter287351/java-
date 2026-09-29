## 声明式事务：@Transactional 的能与不能

### 是什么
@Transactional 声明"这个方法要在数据库事务里跑"。它基于 **AOP 动态代理**：代理在方法执行前开启事务（获取连接并绑定到 ThreadLocal），方法正常结束提交、抛出匹配的异常回滚，**默认只回滚 RuntimeException 和 Error**，受检异常要通过 rollbackFor = Exception.class 显式声明。传播行为（Propagation）决定方法遇到已有事务怎么办：默认 REQUIRED（有则加入、无则新建）；REQUIRES_NEW 挂起当前事务新开独立事务；NESTED 在当前事务内设保存点，可局部回滚，外层回滚它必回滚。

### 为什么
一次业务操作往往涉及多条 SQL，要么全成功要么全失败，事务保证一致性；声明式让事务代码与业务代码解耦，比编程式 TransactionTemplate 侵入性低。

### 怎么用
嵌套调用时，内层 REQUIRES_NEW 适合"无论主流程成败都要留痕"的日志/通知表；内层失败只想局部回滚用 NESTED。大事务优化的核心是**缩小事务边界**：HTTP/RPC/MQ 等耗时 IO 移出事务，或用 TransactionTemplate 只包住真正的 DB 操作，避免长时间占用连接拖垮连接池。

### 常见坑
事务失效经典五连：**同类 this 自调用**不走代理；方法**非 public** 不被增强；异常被 **catch 吞掉**代理感知不到；抛的是**受检异常**默认不回滚；**子线程里的 DB 操作**不在当前事务（事务上下文绑在 ThreadLocal 上）。排查口诀：先确认走的是代理，再确认异常真的抛到了代理层、且类型在回滚规则内。

### 面试怎么问
「REQUIRED 和 REQUIRES_NEW 的区别？」——加入还是新开、回滚是否联动，再补一句"外层回滚不影响已提交的 REQUIRES_NEW 内层事务"的细节，就是满分答案。

## 动手清单

### 练习 1：复现事务失效
写一个 @Transactional 方法：先 insert，再抛出自定义受检异常（extends Exception），观察数据已落库；加 rollbackFor = Exception.class 再验证回滚；最后把受检异常换成 RuntimeException 对比。

**自测标准**：能说出默认回滚规则（RuntimeException/Error），并解释为什么 catch 吞掉异常后事务正常提交。

### 练习 2：缩小一个大事务
构造一个 @Transactional 方法，里面夹一次 sleep(2000) 模拟远程调用，用日志打印事务起止时间；再用 TransactionTemplate 把远程调用移出事务，对比占用时长。

**自测标准**：能解释"事务里不要做 RPC/HTTP/MQ"的原因，并说出 TransactionTemplate 与声明式的取舍。
