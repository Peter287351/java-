import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'springboot-02-config-profiles-001',
    type: 'single',
    difficulty: 1,
    tags: ['yml'],
    stem: '下列 YAML 写法正确的是？',
    options: [
      { key: 'A', text: '用 Tab 缩进层级，冒号后不加空格' },
      { key: 'B', text: '用空格缩进层级，冒号后必须跟一个空格' },
      { key: 'C', text: '层级用大括号嵌套表示' },
      { key: 'D', text: '缩进必须每行固定 4 空格否则报错' },
    ],
    answers: ['B'],
    explanation:
      'YAML 规范：缩进只能用空格（Tab 非法），`key: value` 冒号后需空格；层级靠缩进表达，宽度只需一致（常用 2 空格），不要求固定 4。C 是 JSON 的写法。',
  },
  {
    id: 'springboot-02-config-profiles-002',
    type: 'single',
    difficulty: 2,
    tags: ['ConfigurationProperties'],
    stem: '@ConfigurationProperties 的「松散绑定」指的是？',
    options: [
      { key: 'A', text: '配置文件写错属性名也不报错' },
      { key: 'B', text: 'yml 的 app-name、APP_NAME、appName 都能绑定到字段 appName' },
      { key: 'C', text: '配置可以放在任意文件名里' },
      { key: 'D', text: '绑定失败时自动创建默认对象' },
    ],
    answers: ['B'],
    explanation:
      '松散绑定是属性名与字段名之间的宽松匹配（中划线/下划线/驼峰互通），让 yml 惯用的 kebab-case 与 Java 驼峰互通。A 与绑定无关；C 必须在约定文件与位置；D 不存在。',
  },
  {
    id: 'springboot-02-config-profiles-003',
    type: 'single',
    difficulty: 2,
    tags: ['优先级'],
    stem: '同一属性在以下位置同时配置，Spring Boot 生效优先级最高的是？',
    options: [
      { key: 'A', text: 'application.yml' },
      { key: 'B', text: 'application-prod.yml（激活的 profile 文件）' },
      { key: 'C', text: '启动命令行参数 --server.port=9090' },
      { key: 'D', text: '操作系统环境变量' },
    ],
    answers: ['C'],
    explanation:
      '官方优先级序列中，命令行参数高于任何配置文件与环境变量——这也是 CI/CD 里"传参覆盖一切"的常用手段。顺序：命令行 > 环境变量 > profile 文件 > application.yml。',
  },
  {
    id: 'springboot-02-config-profiles-004',
    type: 'single',
    difficulty: 2,
    tags: ['配置选择'],
    stem: '邮件配置有 host、port、from、ssl 等七八个属性，团队要复用并校验必填项。最合适的方案是？',
    options: [
      { key: 'A', text: '在需要的地方逐个用 @Value 注入' },
      { key: 'B', text: '定义 MailProperties 类，@ConfigurationProperties(prefix="mail") + @Validated 校验' },
      { key: 'C', text: '全部写死在代码常量里' },
      { key: 'D', text: '存到 Redis，启动时读取' },
    ],
    answers: ['B'],
    explanation:
      '成组配置用属性类：类型安全、支持校验（@NotNull 等）、可在多处注入同一对象、能生成 IDE 提示元数据。A 冗长且无校验；C 失去外置能力；D 过度设计。',
  },
  {
    id: 'springboot-02-config-profiles-005',
    type: 'code',
    difficulty: 2,
    tags: ['占位符'],
    stem: '在 Spring Boot 的 yml 中引用另一个配置项的正确写法是？\n\n~~~yaml\napp:\n  name: order-service\n  desc: ???\n~~~\n希望 desc 的值为 "order-service v2"。',
    options: [
      { key: 'A', text: 'desc: \${app.name} v2' },
      { key: 'B', text: 'desc: {app.name} v2' },
      { key: 'C', text: 'desc: @app.name@ v2' },
      { key: 'D', text: 'desc: %app.name% v2' },
    ],
    answers: ['A'],
    explanation:
      'Spring 配置占位符语法是 \${app.name}，可用于 yml 内部引用与注入到 @Value。B 缺 \$ 前缀；C 的 @@ 是 Maven resource filtering 语法；D 是 Windows 环境变量风格。',
  },
  {
    id: 'springboot-02-config-profiles-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['优先级'],
    scenario:
      '同事反馈：在 application.yml 里把 server.port 改成 8081，IDE 里重启后端口仍是 8080；终端执行 `java -jar app.jar` 时端口变成 9090，且 yml 里没有任何 9090。',
    stem: '两次现象最合理的解释组合是？',
    options: [
      { key: 'A', text: '第一次：改错了文件（如 jar 内解压副本）或 profile 指向了 application-prod.yml；第二次：启动环境里有 SERVER_PORT 环境变量或命令行参数覆盖' },
      { key: 'B', text: 'Spring Boot 端口配置只支持命令行，不支持 yml' },
      { key: 'C', text: 'Tomcat 缓存了旧端口，重启机器即可' },
      { key: 'D', text: '9090 是 Spring Boot 的默认端口' },
    ],
    answers: ['A'],
    explanation:
      '端口生效与否取决于"激活的文件 + 更高优先级来源"：环境变量 SERVER_PORT/命令行参数会覆盖 yml——排查方向是列出实际激活的 profile 与外部覆盖源。B 与事实相反；C 无此机制；D 默认端口是 8080。',
  },
  {
    id: 'springboot-02-config-profiles-007',
    type: 'single',
    difficulty: 3,
    tags: ['多环境'],
    stem: '关于多环境配置，下列做法错误的是？',
    options: [
      { key: 'A', text: 'application.yml 放公共配置，application-dev.yml / application-prod.yml 放环境差异' },
      { key: 'B', text: '生产数据库密码写死在 application-prod.yml 提交到 Git 仓库' },
      { key: 'C', text: '用 spring.profiles.active 指定激活环境，也可用 spring.profiles.group 组合多个 profile' },
      { key: 'D', text: '敏感项优先用环境变量或配置中心注入' },
    ],
    answers: ['B'],
    explanation:
      '密钥入库是安全红线，仓库泄露即等于数据库泄露；正确做法是环境变量/启动参数/配置中心注入，仓库只留占位。A/C/D 都是标准实践。',
  },
]
