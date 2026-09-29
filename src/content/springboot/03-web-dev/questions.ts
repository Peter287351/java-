import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'springboot-03-web-dev-001',
    type: 'single',
    difficulty: 1,
    tags: ['REST'],
    stem: '创建用户（POST /users）成功后返回什么状态码最符合 REST 语义？',
    options: [
      { key: 'A', text: '200 OK，body 里返回新用户' },
      { key: 'B', text: '201 Created，Location 头指向新资源' },
      { key: 'C', text: '204 No Content' },
      { key: 'D', text: '302 Found 跳转到用户页' },
    ],
    answers: ['B'],
    explanation:
      'POST 创建资源的标准响应是 201 + Location；200 也常见于国内实践但语义稍弱；204 表示无内容（通常用于删除成功）；302 是重定向，不适合 API。',
  },
  {
    id: 'springboot-03-web-dev-002',
    type: 'single',
    difficulty: 2,
    tags: ['参数校验'],
    stem: 'Controller 方法参数标注了 @Valid @RequestBody UserDTO，UserDTO 字段上有 @NotBlank。校验不通过时 Spring Boot 默认抛出的异常是？',
    options: [
      { key: 'A', text: 'IllegalArgumentException' },
      { key: 'B', text: 'MethodArgumentNotValidException' },
      { key: 'C', text: 'ConstraintViolationException' },
      { key: 'D', text: 'BindException 的子类且返回 200' },
    ],
    answers: ['B'],
    explanation:
      '@RequestBody + @Valid 失败抛 MethodArgumentNotValidException（默认 400）；ConstraintViolationException 对应 @Validated 标在类上校验 @RequestParam/@PathVariable 的场景。D 描述自相矛盾。',
  },
  {
    id: 'springboot-03-web-dev-003',
    type: 'multiple',
    difficulty: 2,
    tags: ['统一返回'],
    stem: '关于统一返回体与全局异常处理，下列实践合理的有？',
    options: [
      { key: 'A', text: '业务码与 HTTP 状态码可以并存：HTTP 表达传输层语义，body 里 code 表达业务语义' },
      { key: 'B', text: '@RestControllerAdvice + @ExceptionHandler 集中处理，避免每个接口 try-catch' },
      { key: 'C', text: '兜底的 Exception handler 要记录日志，但不能把堆栈返回给前端' },
      { key: 'D', text: '所有异常都返回 200，靠 body 里的 code 区分，前端永远不用判断状态码' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A/B/C 是标准实践。D 是有争议的反模式：网关、监控、重试中间件都依赖 HTTP 状态码，全部 200 会让运维可观测性坍塌。',
  },
  {
    id: 'springboot-03-web-dev-004',
    type: 'single',
    difficulty: 2,
    tags: ['CORS'],
    stem: '前后端分离部署在 b.example.com（前端）与 api.example.com（后端），浏览器控制台报 CORS 错误。在 Spring Boot 后端正确的处理是？',
    options: [
      { key: 'A', text: '让前端把请求改成 JSONP' },
      { key: 'B', text: '后端配置 CorsRegistry/Filter 返回 Access-Control-Allow-Origin 等响应头；带 cookie 时 origin 不能为 *' },
      { key: 'C', text: '在前端 nginx 把两个域名改成同一个' },
      { key: 'D', text: '后端无需任何配置，CORS 由浏览器自动放行同公司域名' },
    ],
    answers: ['B'],
    explanation:
      'CORS 是浏览器安全策略，放行的决定权在后端响应头；allowCredentials(true) 时 allowOrigin 不能用 *，要列具体域名。A 的 JSONP 已过时且只支持 GET；C 是一种部署层方案但改变架构；D 错误，同公司不同域名照样跨域。',
  },
  {
    id: 'springboot-03-web-dev-005',
    type: 'single',
    difficulty: 2,
    tags: ['参数绑定'],
    stem: '请求 GET /orders/1001/items?page=2&size=10，对应 Controller 方法签名正确的是？',
    options: [
      { key: 'A', text: 'public List<Item> list(@RequestParam Long orderId, @RequestParam int page, @RequestParam int size)' },
      { key: 'B', text: 'public List<Item> list(@PathVariable Long orderId, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size)' },
      { key: 'C', text: 'public List<Item> list(@RequestBody OrderQuery query)' },
      { key: 'D', text: 'public List<Item> list(@PathVariable Long page, @PathVariable Long size)' },
    ],
    answers: ['B'],
    explanation:
      '路径段 /orders/{orderId} 用 @PathVariable 取，查询参数用 @RequestParam 且可给默认值。A 把路径参数当成了 @RequestParam；C 的 @RequestBody 用于 JSON 体，GET 通常不用；D 类型张冠李戴。',
  },
  {
    id: 'springboot-03-web-dev-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['异常处理'],
    scenario:
      '前端反馈注册接口有时正常、有时收到一长串 Java 堆栈 HTML；后端排查发现某个 NPE 从 Service 抛出，Controller 没有任何 try-catch。',
    stem: '最规范的修复组合是？',
    options: [
      { key: 'A', text: '在 Controller 每个方法里都包一层 try-catch，捕获后返回统一错误体' },
      { key: 'B', text: '加 @RestControllerAdvice 全局异常处理：业务异常转统一错误码，未知异常记日志后返回通用"系统繁忙"，绝不向客户端输出堆栈' },
      { key: 'C', text: '把 NPE 的位置打上 null 判断就够了，其他异常不用管' },
      { key: 'D', text: '关闭 Spring Boot 的错误页配置就行' },
    ],
    answers: ['B'],
    explanation:
      '全局异常处理器一处覆盖所有接口，分层清晰：可预期业务异常 → 业务码；未知异常 → 日志 + 通用文案（防信息泄露）。A 是旧式做法，代码冗余且容易遗漏；C 只修一个点；D 治标不治本。',
  },
  {
    id: 'springboot-03-web-dev-007',
    type: 'single',
    difficulty: 3,
    tags: ['序列化'],
    stem: '前端希望时间字段统一为 "yyyy-MM-dd HH:mm:ss"。全局最合适的配置是？',
    options: [
      { key: 'A', text: '每个 DTO 的日期字段上手写 @JsonFormat(pattern=...) 并逐一检查' },
      { key: 'B', text: '全局配置 spring.jackson.date-format 与时区（或自定义 Jackson2ObjectMapperBuilderCustomizer），LocalDateTime 另配 JavaTimeModule 格式' },
      { key: 'C', text: '把所有日期字段改成 String，在 Service 层手工格式化' },
      { key: 'D', text: '前端自己处理，后端返回时间戳即可，不用配置' },
    ],
    answers: ['B'],
    explanation:
      '全局 Jackson 配置一次覆盖所有接口，是标准做法；个别字段确有差异时才用 @JsonFormat 局部覆盖。A 重复劳动易漏；C 丢失类型语义；D 属于约定问题，但"不用配置"不成立——两端必须先约定格式，B 就是后端落实约定的位置。',
  },
  {
    id: 'springboot-03-web-dev-008',
    type: 'single',
    difficulty: 2,
    tags: ['文件上传'],
    stem: '文件上传接口报 MaxUploadSizeExceededException，最直接的解决途径是？',
    options: [
      { key: 'A', text: '改前端 FormData 的编码方式' },
      { key: 'B', text: '调整 spring.servlet.multipart.max-file-size 与 max-request-size 配置' },
      { key: 'C', text: '把 MultipartFile 换成 byte[] 接收' },
      { key: 'D', text: '升级 Spring Boot 版本' },
    ],
    answers: ['B'],
    explanation:
      '上传大小由 multipart 配置限制，调大（或按业务用对象存储直传绕开应用层）即可；同时建议在全局异常处理器里对该异常返回友好提示。A/C/D 与限制来源无关。',
  },
]
