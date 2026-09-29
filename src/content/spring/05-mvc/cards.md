## Spring MVC：请求的一生

### 是什么
DispatcherServlet（前端控制器）是 MVC 的总调度，核心流程：接收请求 → **HandlerMapping** 根据 URL 找到能处理的 Handler（@RequestMapping 方法）和拦截器链 → **HandlerAdapter** 按 Handler 类型适配调用（参数绑定、执行、返回值处理）→ @ResponseBody 直接经 HttpMessageConverter 写 JSON，普通返回走 ViewResolver 渲染 → 全程异常交给 HandlerExceptionResolver 解析。

### 为什么
把"找谁处理"和"怎么调用"拆成两个组件，才能同时支持注解方法等多种 Handler 形态。拦截器（HandlerInterceptor）挂在 Handler 执行链上，能拿到处理方法信息，适合登录校验、权限、耗时统计；过滤器（Filter）是 Servlet 规范，在 DispatcherServlet 之前生效，适合编码、跨域、全链路日志。

### 怎么用
- 参数绑定：@PathVariable 取路径变量，@RequestParam 取查询参数（配了 defaultValue 隐含非必填；required=false 缺失时为 null），@RequestBody 把 JSON 请求体转对象。
- 前后端分离：定义 Result<T> 统一返回结构，配合 @RestControllerAdvice + @ExceptionHandler 全局处理异常，避免每个方法都 try-catch；本类 @ExceptionHandler 优先于全局的。

### 常见坑
- 拦截器 preHandle 返回 false 表示拦截不放行，本次调用终止；只有 preHandle 返回 true 的拦截器才会触发 afterCompletion（逆序执行）。
- @ResponseBody 的响应在 postHandle 之前已由消息转换器写出，别想在 postHandle 里改 JSON。
- @ControllerAdvice 够不到 Filter 里抛的异常——那发生在 DispatcherServlet 之前。

### 面试怎么问
「说说 DispatcherServlet 的执行流程」——按"找 Handler → 适配执行 → 异常解析 → 渲染/写响应"四步讲，并点出 HandlerMapping 与 HandlerAdapter 的分工。

## 动手清单

### 练习 1：打印请求的一生
写两个拦截器，preHandle/postHandle/afterCompletion 各打印一行；再写一个抛 RuntimeException 的 Controller 和 @RestControllerAdvice 全局异常处理，观察完整执行顺序与异常时的行为。

**自测标准**：能默写"preHandle 顺序、postHandle 顺序、afterCompletion 逆序"，并解释 preHandle 返回 false 时 afterCompletion 的触发规则。

### 练习 2：统一返回改造
给练习 1 的项目定义 Result<T>（code/message/data）+ 全局 @ExceptionHandler，把所有 Controller 的 try-catch 删掉，用 Postman 验证正常与异常两种响应。

**自测标准**：任何接口异常都能返回统一结构，且不再有方法级 try-catch；能说出 @ControllerAdvice 处理不了 Filter 内的异常。
