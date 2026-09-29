import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'spring-05-mvc-001',
    type: 'single',
    difficulty: 1,
    tags: ['DispatcherServlet', '处理流程'],
    stem: `Spring MVC 中，负责统一接收所有请求并协调各组件完成处理的"前端控制器"是？`,
    options: [
      { key: 'A', text: 'DispatcherServlet' },
      { key: 'B', text: 'HandlerMapping' },
      { key: 'C', text: 'HandlerAdapter' },
      { key: 'D', text: 'Controller' },
    ],
    answers: ['A'],
    explanation: `DispatcherServlet 是 MVC 流程的总调度：请求先到达它，它通过 HandlerMapping 找到 Handler 与拦截器链，交给 HandlerAdapter 执行，期间异常交给 HandlerExceptionResolver 处理，最后渲染视图或直接写出响应。B 只负责"根据请求找 Handler"；C 负责"如何调用 Handler"；D 是业务处理器本身，被前三者调度。`,
  },
  {
    id: 'spring-05-mvc-002',
    type: 'single',
    difficulty: 2,
    tags: ['HandlerMapping', 'HandlerAdapter'],
    stem: `关于 HandlerMapping 与 HandlerAdapter 的分工，下列说法正确的是？`,
    options: [
      { key: 'A', text: 'HandlerMapping 负责根据请求找到 Handler 与拦截器链；HandlerAdapter 负责按 Handler 类型适配执行（参数绑定、调用、返回值处理）' },
      { key: 'B', text: 'HandlerMapping 负责实际执行控制器方法，HandlerAdapter 负责解析 URL' },
      { key: 'C', text: 'ViewResolver 负责根据 URL 找到对应的 Controller' },
      { key: 'D', text: '两者是同一个组件的两个别名，职责完全相同' },
    ],
    answers: ['A'],
    explanation: `DispatcherServlet 把"找谁处理"和"怎么调用"拆开：HandlerMapping 回答"谁来处理"——根据请求路径匹配到 @RequestMapping 方法等 Handler，并组装拦截器链；HandlerAdapter 回答"怎么调用"——屏蔽不同 Handler 形态的差异，完成参数解析、方法执行与返回值处理。B 错，执行交给 HandlerAdapter；C 错，ViewResolver 在返回视图名之后负责解析渲染视图；D 错，两者职责不同、先后配合，这种拆分让框架能同时支持多种 Handler 形态。`,
  },
  {
    id: 'spring-05-mvc-003',
    type: 'code',
    difficulty: 2,
    tags: ['参数绑定', '@RequestParam'],
    stem: `阅读以下接口定义：

~~~java
@RestController
public class OrderController {

    @GetMapping("/users/{userId}/orders")
    public String list(@PathVariable("userId") Long userId,
                       @RequestParam(value = "status", defaultValue = "ALL") String status,
                       @RequestParam(value = "page", required = false) Integer page) {
        return userId + "-" + status + "-" + page;
    }
}
~~~

请求为 GET /users/42/orders（不带任何查询参数），返回的字符串是？`,
    options: [
      { key: 'A', text: '42-ALL-null' },
      { key: 'B', text: '42-null-null' },
      { key: 'C', text: '请求返回 400，因为缺少 page 参数' },
      { key: 'D', text: '42-ALL-0' },
    ],
    answers: ['A'],
    explanation: `{userId} 占位符把路径段绑定到 @PathVariable 参数并自动转换为 Long 型 42；defaultValue 有两个作用：参数缺失时取默认值 ALL，同时隐含 required=false；page 只声明了 required=false，缺失时注入 null（Integer 类型就是 null，不是 0）。因此输出 42-ALL-null。B 错在 status 有 defaultValue；C 错在 page 非必传，不会报 400；D 错在 page 没有配 defaultValue，不会变成 0。`,
  },
  {
    id: 'spring-05-mvc-004',
    type: 'scenario',
    difficulty: 2,
    tags: ['统一返回', '全局异常'],
    scenario: `团队刚从 JSP 切到前后端分离：后端只出 JSON 接口。现状是每个 Controller 方法里都包着一层 try-catch，手动组装错误 Result，代码重复且经常有方法忘写，前端拿到的错误结构五花八门。`,
    stem: `作为方案负责人，你选择哪种改造方式？`,
    options: [
      { key: 'A', text: '定义 Result<T>（code/message/data）作为统一响应体，用 @RestControllerAdvice + @ExceptionHandler 按异常类型集中转换，并留一个 Exception.class 兜底' },
      { key: 'B', text: '建一个 BaseController，把 try-catch 模板写在父类里，让所有 Controller 继承' },
      { key: 'C', text: '直接把异常堆栈以 500 状态码返回给前端，让前端根据状态码自行判断' },
      { key: 'D', text: '在每个方法里继续 try-catch，但抽一个静态工具方法生成 Result 减少重复' },
    ],
    answers: ['A'],
    explanation: `A 对，统一返回结构 + 全局异常处理器是前后端分离的标准做法：业务代码只管抛异常，@ExceptionHandler 按类型精确匹配（本类优先、全局兜底），响应结构永远一致，新增接口零成本。B 错，用继承换重复，耦合了继承体系，忘写 catch 的问题依旧存在；C 错，堆栈泄露内部实现且无法承载业务错误码；D 错，模板代码还在每个方法里重复，遗漏风险没有消除。`,
  },
  {
    id: 'spring-05-mvc-005',
    type: 'single',
    difficulty: 1,
    tags: ['拦截器', '过滤器'],
    stem: `关于过滤器（Filter）与拦截器（HandlerInterceptor）的区别，下列说法正确的是？`,
    options: [
      { key: 'A', text: 'Filter 由 Servlet 容器管理，执行在 DispatcherServlet 之前，能覆盖包括静态资源在内的所有请求；Interceptor 由 Spring MVC 提供，围绕 Handler 执行前后生效' },
      { key: 'B', text: 'Interceptor 由 Servlet 容器规范定义，Filter 由 Spring MVC 提供，选项 A 把两者说反了' },
      { key: 'C', text: 'Filter 只能拦截 Controller 请求，无法覆盖静态资源' },
      { key: 'D', text: 'Interceptor 的执行早于 DispatcherServlet 接收请求' },
    ],
    answers: ['A'],
    explanation: `A 对，两者作用点不同：Filter 挂在 Servlet 容器的过滤器链上，先于 DispatcherServlet 生效，所有请求（含静态资源）都会经过；Interceptor 挂在 Spring MVC 的 Handler 执行链上，能拿到待执行的处理方法信息、可直接注入容器 Bean。B 错，Filter 是 Servlet 规范、Interceptor 是 Spring MVC 机制，这个选项故意说反；C 错，Filter 恰恰能拦静态资源；D 错，Interceptor 在 DispatcherServlet 内部流程中生效，晚于它接收请求。选型上：编码、跨域、全链路 traceId 用 Filter，登录校验、权限、接口级耗时统计用 Interceptor。`,
  },
  {
    id: 'spring-05-mvc-006',
    type: 'multiple',
    difficulty: 3,
    tags: ['拦截器', 'preHandle'],
    stem: `关于 HandlerInterceptor 的三个方法，下列说法正确的有？`,
    options: [
      { key: 'A', text: 'preHandle 按拦截器声明顺序执行，afterCompletion 按逆序触发' },
      { key: 'B', text: '某个拦截器 preHandle 返回 false 时，只有排在它之前且 preHandle 返回 true 的拦截器会触发 afterCompletion' },
      { key: 'C', text: 'postHandle 里可以随意修改 @ResponseBody 接口的 JSON 响应内容' },
      { key: 'D', text: 'preHandle 返回 false 属于异常情况，DispatcherServlet 会转入异常解析流程' },
      { key: 'E', text: '只要本拦截器的 preHandle 返回了 true，无论目标方法是否抛出异常，afterCompletion 都会执行，适合做资源清理' },
    ],
    answers: ['A', 'B', 'E'],
    explanation: `A 对，preHandle 正序、afterCompletion 逆序；B 对，preHandle 返回 false 时处理中断，HandlerExecutionChain 只对之前已放行的拦截器触发 afterCompletion；E 对，afterCompletion 是 finally 语义，无论正常返回还是抛异常都会执行。C 错，@ResponseBody 的响应在 HandlerAdapter 处理返回值时已由 HttpMessageConverter 写出，postHandle 阶段改不动；D 错，返回 false 是正常的"拦截不放行"手段，不会进入异常解析流程。`,
  },
  {
    id: 'spring-05-mvc-007',
    type: 'single',
    difficulty: 3,
    tags: ['@ExceptionHandler', '异常解析'],
    stem: `关于 Spring MVC 的异常解析（HandlerExceptionResolver / @ExceptionHandler），下列说法正确的是？`,
    options: [
      { key: 'A', text: 'Controller 自身定义的 @ExceptionHandler 优先于 @ControllerAdvice 中的全局处理器' },
      { key: 'B', text: '匹配异常类型时，声明父类异常的 @ExceptionHandler 优先于声明子类异常的' },
      { key: 'C', text: '@ExceptionHandler 方法必须返回 ModelAndView，不能返回 JSON 对象' },
      { key: 'D', text: '@ControllerAdvice 中的 @ExceptionHandler 能捕获 Filter 中抛出的异常' },
    ],
    answers: ['A'],
    explanation: `A 对，DispatcherServlet 解析异常时先在发生异常的 Controller 类内部找匹配的 @ExceptionHandler，找不到才到 @ControllerAdvice 全局范围查找；B 错，匹配规则是更具体的异常类型（子类）优先；C 错，放在 @RestControllerAdvice 或方法标了 @ResponseBody 时，可直接返回 JSON 对象或 ResponseEntity；D 错，Filter 执行在 DispatcherServlet 之前，其异常进入不了 MVC 的 HandlerExceptionResolver 体系，只能由 Servlet 容器处理。`,
  },
]
