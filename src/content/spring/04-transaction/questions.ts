import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'spring-04-transaction-001',
    type: 'single',
    difficulty: 1,
    tags: ['@Transactional', 'AOP'],
    stem: `声明式事务 @Transactional 的底层实现机制是？`,
    options: [
      { key: 'A', text: '基于 AOP 动态代理：代理对象在目标方法执行前后开启事务、提交或回滚' },
      { key: 'B', text: 'JVM 在加载字节码时识别该注解，直接在字节码层面插入事务代码' },
      { key: 'C', text: '数据库驱动检测到注解后自动开启事务，注解本身只是标记' },
      { key: 'D', text: '必须配合 AspectJ 编译器织入才能生效' },
    ],
    answers: ['A'],
    explanation: `@Transactional 由 TransactionInterceptor（AOP 的 MethodInterceptor）实现：代理在方法调用前通过 PlatformTransactionManager 开启事务，并把数据库连接绑定到 ThreadLocal，方法正常返回则提交、抛出匹配回滚规则的异常则回滚。B 错，它是普通注解，JVM/编译器不会做特殊处理；C 错，事务的开启由 Spring 事务管理器完成，与驱动无关；D 错，Spring AOP 的动态代理即可生效，AspectJ 只是另一种可选织入方式。`,
  },
  {
    id: 'spring-04-transaction-002',
    type: 'single',
    difficulty: 1,
    tags: ['传播行为', 'REQUIRED'],
    stem: `关于 Spring 默认的传播行为 PROPAGATION_REQUIRED，下列说法正确的是？`,
    options: [
      { key: 'A', text: '当前存在事务就加入其中，不存在就新建一个事务' },
      { key: 'B', text: '总是新建一个独立事务，并挂起当前事务' },
      { key: 'C', text: '当前存在事务时，以非事务方式执行' },
      { key: 'D', text: '当前存在事务时直接抛出异常' },
    ],
    answers: ['A'],
    explanation: `REQUIRED 是默认传播行为：方法被调用时，若外层已有事务则加入（同一事务、同生共死），没有则新建，这使嵌套调用的多个方法天然处于同一事务边界内。B 描述的是 REQUIRES_NEW；C 描述的是 NOT_SUPPORTED（挂起当前事务，以非事务方式运行）；D 描述的是 NEVER。分析"内层异常被外层 catch 是否回滚"这类问题，都要先回到 REQUIRED"同一个事务"这一前提。`,
  },
  {
    id: 'spring-04-transaction-003',
    type: 'single',
    difficulty: 3,
    tags: ['传播行为', 'REQUIRES_NEW', 'NESTED'],
    stem: `关于 REQUIRES_NEW 与 NESTED 两种传播行为的区别，下列说法正确的是？`,
    options: [
      { key: 'A', text: 'NESTED 在当前事务内用保存点实现，外层回滚时它必然一起回滚；REQUIRES_NEW 是物理独立的新事务，外层回滚不影响它已提交的结果' },
      { key: 'B', text: 'REQUIRES_NEW 通过 JDBC 保存点实现，开销比 NESTED 更小' },
      { key: 'C', text: '外层事务回滚时，REQUIRES_NEW 开启的内层事务也会一起回滚' },
      { key: 'D', text: 'NESTED 不依赖数据库的保存点能力，任何数据库都支持' },
    ],
    answers: ['A'],
    explanation: `REQUIRES_NEW 挂起外层事务、另开一个物理独立的事务，两边的提交与回滚互不影响；NESTED 不开新事务，只是在当前事务里设置 Savepoint，内层可局部回滚，但外层最终回滚时它跟着回滚。B 错，保存点是 NESTED 的实现手段；C 错，内层事务已独立提交，外层回滚不波及它；D 错，NESTED 依赖保存点支持。补充：外层没有事务时，NESTED 退化为 REQUIRED，REQUIRES_NEW 则总是新开事务。`,
  },
  {
    id: 'spring-04-transaction-004',
    type: 'single',
    difficulty: 2,
    tags: ['大事务', '事务优化'],
    stem: `一个 @Transactional 方法内部依次执行：本地写库 → 调用第三方 HTTP 接口（约 2 秒）→ 发送 MQ 消息 → 再次写库。高峰期频繁出现数据库连接池耗尽、接口 RT 长尾。下列优化方案最合理的是？`,
    options: [
      { key: 'A', text: '用 TransactionTemplate 把前后两段写库分别包进小事务，HTTP 调用与 MQ 发送移出事务边界' },
      { key: 'B', text: '调大 @Transactional 的 timeout 并扩容连接池，让长事务能撑住' },
      { key: 'C', text: '在类上补一个 @Transactional，并把每个私有方法都标上注解，让事务粒度更细' },
      { key: 'D', text: '把传播行为改成 REQUIRES_NEW，减少回滚范围' },
    ],
    answers: ['A'],
    explanation: `大事务的危害在于：事务期间连接被独占，远程调用把事务时长从毫秒级拉到秒级，连接池迅速被占满。A 对，核心思路是缩小事务边界——只把必要的 DB 操作包进事务，远程 IO、MQ 移出去（跨系统一致性用事件表/事务消息等最终一致方案兜底）。B 错，治标不治本，连接占用依旧；C 错，私有方法上的注解不生效，且事务更碎反而失控；D 错，传播行为决定的是"加入还是新开事务"，解决不了方法内耗时操作占用连接的问题。`,
  },
  {
    id: 'spring-04-transaction-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['事务失效'],
    stem: `下列哪些情况会导致 @Transactional 事务失效（不回滚或不在事务中）？`,
    options: [
      { key: 'A', text: '同一个类里，方法 A（无注解）内部通过 this 直接调用带 @Transactional 的方法 B' },
      { key: 'B', text: '@Transactional 标注在 private 方法上' },
      { key: 'C', text: '方法内 try-catch 吞掉异常后正常返回' },
      { key: 'D', text: '抛出自定义受检异常（extends Exception）且未配置 rollbackFor' },
      { key: 'E', text: '在方法内 new Thread 的 run 里执行写库，事务上下文会随 ThreadLocal 自动传递到子线程，子线程的写库也受主线程事务控制' },
    ],
    answers: ['A', 'B', 'C', 'D'],
    explanation: `A 对，自调用走的是原始对象，绕过代理，增强不执行；B 对，代理无法增强 private 方法；C 对，异常被吞后方法正常返回，代理按"正常结束"提交；D 对，默认回滚规则只认 RuntimeException 与 Error，受检异常需 rollbackFor 声明；E 错，事务上下文通过 ThreadLocal 绑定到当前线程，不会传递给子线程——"子线程写库不在事务中"确实是另一类真实的失效场景，但它不受主线程事务控制、更不会"随之回滚"，E 的断言本身是错的。`,
  },
  {
    id: 'spring-04-transaction-006',
    type: 'code',
    difficulty: 2,
    tags: ['事务失效', '异常处理'],
    stem: `阅读以下代码：

~~~java
@Service
public class OrderService {

    @Transactional
    public void createOrder() {
        orderMapper.insert(new Order("A001"));   // 写订单，SQL 正常执行
        try {
            stockMapper.deduct("A001", 1);       // 扣库存，SQL 正常执行
            int risk = 1 / 0;                    // 抛出 ArithmeticException
        } catch (Exception e) {
            log.error("扣减异常: {}", e.getMessage()); // 仅记录日志，未重新抛出
        }
    }
}
~~~

createOrder() 执行完毕（没有任何异常抛给调用方），订单表与库存表的数据状态是？`,
    options: [
      { key: 'A', text: '订单与库存扣减都正常提交落库' },
      { key: 'B', text: '订单与库存扣减都被回滚' },
      { key: 'C', text: '订单提交落库，库存扣减被回滚' },
      { key: 'D', text: '方法向调用方抛出 ArithmeticException' },
    ],
    answers: ['A'],
    explanation: `声明式事务的回滚由代理在目标方法抛出异常时触发：本题 ArithmeticException 在方法内部被 catch 吞掉，方法正常结束，代理看到的是"正常返回"，于是提交事务，两条 SQL 都落库。B 错，没有异常抛到代理层就不会回滚；C 错，同一事务内没有任何回滚动作，不存在部分回滚；D 错，异常已被 catch。想让它回滚的正确做法是 catch 后重新抛出，或调用 TransactionAspectSupport.currentTransactionStatus().setRollbackOnly() 主动标记回滚。`,
  },
  {
    id: 'spring-04-transaction-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['rollbackFor', '事务排查'],
    scenario: `用户注册接口上线后出现诡异现象：接口返回 500 报错，但 user 表和 points 表里却留下了数据，本应"要么全成功要么全失败"。排查发现：register 方法有 @Transactional 注解、方法为 public、类标注了 @Service；方法内依次执行 userMapper.insert(u) 与 pointsMapper.addPoints(u.getId(), 100)，最后 smsClient.send(u) 抛出自定义异常 SmsException（继承自 Exception，非 RuntimeException），异常没有被 catch，直接向上抛出。`,
    stem: `事务为什么没有回滚？下列原因分析与修复方案哪个是正确的？`,
    options: [
      { key: 'A', text: '@Transactional 默认只回滚 RuntimeException 和 Error，SmsException 是受检异常，应改为 @Transactional(rollbackFor = Exception.class)，或让业务异常继承 RuntimeException' },
      { key: 'B', text: '@Transactional 注解没有生效，必须再添加 @EnableTransactionManagement 才能开启事务' },
      { key: 'C', text: '需要在方法内 catch 住 SmsException，并手动调用 TransactionAspectSupport.currentTransactionStatus().setRollbackOnly() 才能回滚' },
      { key: 'D', text: '这是数据库隔离级别导致的，把隔离级别调成 READ COMMITTED 即可回滚' },
    ],
    answers: ['A'],
    explanation: `排查链路：确认类是容器 Bean、方法 public、无自调用（题干已排除）→ 异常确实抛到了代理层 → 检查异常类型：Spring 默认回滚规则只覆盖 RuntimeException 与 Error，受检异常默认提交，因此前面的 insert 都落了库。修复就是声明 rollbackFor = Exception.class（或收窄到 SmsException.class），也可以让业务异常继承 RuntimeException。B 错，Spring Boot 自动装配已开启事务管理，且注解实际生效（连接绑定都在工作）；C 错，诊断方向不对，异常已经抛出，setRollbackOnly 是给"想吞异常又想回滚"的场景兜底，不是本题的原因；D 错，隔离级别与回滚规则无关。`,
  },
]
