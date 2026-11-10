import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'mybatis-02-mapping-001',
    type: 'single',
    difficulty: 1,
    tags: ['结果映射'],
    stem: `数据库列 user_name 要映射到 Java 属性 userName，最轻量的做法是？`,
    options: [
      { key: 'A', text: '必须写 resultMap 逐列声明，无法自动转换' },
      { key: 'B', text: '开启 mapUnderscoreToCamelCase，或给列起别名 user_name AS userName' },
      { key: 'C', text: '把 Java 属性改名为 user_name' },
      { key: 'D', text: '关闭一级缓存后框架会自动识别下划线' },
    ],
    answers: ['B'],
    explanation: `下划线转驼峰是 MyBatis 的全局配置项，SQL 里起别名也能达到同样效果。A 说「无法自动」不对，C 破坏 Java 命名约定，D 与缓存完全无关。`,
  },
  {
    id: 'mybatis-02-mapping-002',
    type: 'single',
    difficulty: 1,
    tags: ['结果映射'],
    stem: `查询用户及其多个订单（一对多）时，推荐哪种映射方式？`,
    options: [
      { key: 'A', text: 'resultType 指向 User，订单会被自动放进集合' },
      { key: 'B', text: 'resultMap 中用 collection 声明一对多，并按用户主键分组' },
      { key: 'C', text: 'resultMap 中用 association 声明一对多' },
      { key: 'D', text: '用 #{orderList} 把列表作为一个参数传进去' },
    ],
    answers: ['B'],
    explanation: `collection 负责一对多，association 负责一对一。直接 resultType 会因 JOIN 产生重复用户行，A 错；C 用错标签；D 把结果集当参数，方向反了。`,
  },
  {
    id: 'mybatis-02-mapping-003',
    type: 'single',
    difficulty: 2,
    tags: ['动态 SQL'],
    stem: `<where> 标签相比手写 WHERE 的主要作用是？`,
    options: [
      { key: 'A', text: '自动给 SQL 加 LIMIT 分页' },
      { key: 'B', text: '只在有子条件时输出 WHERE，并去掉开头多余的 AND / OR' },
      { key: 'C', text: '把参数自动转成大写' },
      { key: 'D', text: '强制走二级缓存' },
    ],
    answers: ['B'],
    explanation: `动态条件常以 AND 开头，<where> 会在无子条件时不输出 WHERE、有子条件时剔除首个 AND/OR，避免 WHERE AND 语法错误。A、C、D 都不是它的职责。`,
  },
  {
    id: 'mybatis-02-mapping-004',
    type: 'single',
    difficulty: 2,
    tags: ['foreach'],
    stem: `用 <foreach> 做 IN 查询时，separator 属性的作用是？`,
    options: [
      { key: 'A', text: '指定集合参数名' },
      { key: 'B', text: '指定每个元素的别名' },
      { key: 'C', text: '指定相邻元素之间的分隔符，通常是逗号' },
      { key: 'D', text: '指定 SQL 语句的结束符' },
    ],
    answers: ['C'],
    explanation: `collection 指定参数名、item 指定元素别名、separator 指定分隔符（配合 open="(" close=")" 拼出 IN 列表）。A 是 collection，B 是 item，D 不存在这个属性。`,
  },
  {
    id: 'mybatis-02-mapping-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['动态 SQL'],
    stem: `关于 MyBatis 动态 SQL 标签，说法正确的有哪些？`,
    options: [
      { key: 'A', text: '<set> 用于 UPDATE 并去掉末尾多余的逗号' },
      { key: 'B', text: '<choose> 只执行第一个命中的 <when> 分支' },
      { key: 'C', text: '<trim> 可以自定义要去掉或添加的前缀后缀' },
      { key: 'D', text: '<if> 的 test 中可以直接调用任意 Java 静态方法' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 都是标准行为。D 错：test 表达式由 OGNL 求值，虽然能访问对象属性与部分静态方法（需 @ 全限定名且受安全限制），但不能无条件调用任意静态方法，生产上也不建议这样写。`,
  },
  {
    id: 'mybatis-02-mapping-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['动态 SQL'],
    scenario: `一个多条件搜索框，SQL 写成 WHERE 后跟三个 <if>，每个片段以 AND 开头。用户不填任何条件时接口报 SQL 语法错误。`,
    stem: `最直接且符合框架惯例的修复是？`,
    options: [
      { key: 'A', text: '把三个 AND 全部删掉，让条件之间不加连接词' },
      { key: 'B', text: '用 <where> 包住这组 <if>，让框架按需生成 WHERE 并去掉多余 AND' },
      { key: 'C', text: '在 SQL 末尾加 LIMIT 1 绕过语法检查' },
      { key: 'D', text: '把参数全部改成 ${} 拼接，运行时再判断' },
    ],
    answers: ['B'],
    explanation: `无子条件时 <where> 不输出 WHERE，有子条件时自动剔除开头 AND，正好解决该场景。A 会让多条件同时命中时缺少 AND，C 与语法错误无关，D 引入注入风险且没解决空 WHERE。`,
  },
  {
    id: 'mybatis-02-mapping-007',
    type: 'code',
    difficulty: 3,
    tags: ['动态 SQL'],
    stem: `读下面的 XML 片段，当 name 为 null、status 为 1 时，最终 SQL 是？

~~~xml
SELECT * FROM user
<where>
  <if test="name != null">AND name = #{name}</if>
  <if test="status != null">AND status = #{status}</if>
</where>
~~~`,
    options: [
      { key: 'A', text: 'SELECT * FROM user WHERE AND status = ?' },
      { key: 'B', text: 'SELECT * FROM user WHERE status = ?' },
      { key: 'C', text: 'SELECT * FROM user AND status = ?' },
      { key: 'D', text: 'SELECT * FROM user' },
    ],
    answers: ['B'],
    explanation: `name 为 null 时第一个 <if> 不输出；<where> 检测到有子条件，输出 WHERE 并去掉剩下片段开头的 AND，于是得到 WHERE status = ?。A 是没用 <where> 的症状，C 丢了 WHERE，D 忽略了 status 条件。`,
  },
]
