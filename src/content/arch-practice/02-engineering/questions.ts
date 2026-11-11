import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'arch-practice-02-engineering-001',
    type: 'single',
    difficulty: 2,
    tags: ['设计模式', '策略模式'],
    stem: '下单时按会员等级选用不同折扣算法，且后续会不断新增等级。在 Spring Boot 里最合适的做法是？',
    options: [
      { key: 'A', text: '定义一个折扣策略接口，各等级各写一个无状态实现，用 Map<String, DiscountStrategy> 由容器注入并按等级取用' },
      { key: 'B', text: '把折扣逻辑写成静态工具类，用 synchronized 保证并发安全' },
      { key: 'C', text: '在下单方法里用一串 if-else 判断等级，以后每加一个等级就往这个方法里加一个分支' },
      { key: 'D', text: '为每个等级新建一个 Controller，由前端根据等级调用不同接口' },
    ],
    answers: ['A'],
    explanation:
      '这里变化的是「算法本身」，正是策略模式的适用场景。A 正确：新增等级时只加一个实现类（通常连路由代码都不用改，Spring 会按 bean 名收进 Map），下单主流程保持不动，策略无状态才能安全地作为单例 bean 并发复用。B 错在静态工具类只是把 if-else 换个地方，同步锁既没解决扩展问题还会无谓串行化。C 错在每次新增都要改动已稳定的下单方法，分支会越堆越长、回归风险持续升高。D 错在把业务规则泄漏到接口层，前端要感知等级，且多个 Controller 重复准入与校验逻辑，属于职责错置。',
  },
  {
    id: 'arch-practice-02-engineering-002',
    type: 'multiple',
    difficulty: 2,
    tags: ['单元测试', 'Maven'],
    stem: '关于单元测试与 Maven 依赖管理，下列说法正确的有？',
    options: [
      { key: 'A', text: '@SpringBootTest 会启动完整应用上下文，比纯 Mockito 单测慢，不宜用来覆盖所有分支逻辑' },
      { key: 'B', text: 'test scope 的依赖只在测试阶段可见，不会打进最终交付产物' },
      { key: 'C', text: '为了让测试更真实，单元测试应直连生产数据库并发送真实短信' },
      { key: 'D', text: '依赖冲突可用 mvn dependency:tree 定位引入路径，并用 dependencyManagement 统一版本' },
    ],
    answers: ['A', 'B', 'D'],
    explanation:
      '工程化的核心是「可重复、可快速验证」。A 是测试金字塔的直接推论，启动上下文的成本应只花在真正需要验证装配、事务、SQL 的测试上。B 是 scope 的基本语义，JUnit、Mockito 就该声明为 test，避免污染生产包。D 是排查版本漂移的标准路径，先看清谁把旧版本带进来，再锁定版本而不是盲目 exclusion。C 错在测试必须可重复且无副作用，连生产库会污染数据、发真实短信会造成骚扰和资损，正确做法是用内存库/Testcontainers 加 mock 外部通道；把「不可控」当成「真实」是常见误区。',
  },
]
