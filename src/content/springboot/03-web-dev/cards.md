## Web 开发：接口、校验与统一返回

### 是什么
- `@RestController` = `@Controller` + `@ResponseBody`，返回值直接序列化为 JSON（Jackson）。
- 参数绑定：`@RequestParam` 查询参数、`@PathVariable` 路径、`@RequestBody` JSON 体。
- 校验：`@Validated`/`@Valid` + `@NotNull/@Size/@Email` 等，绑定失败抛 `MethodArgumentNotValidException`。
- 统一返回体 + `@RestControllerAdvice` 全局异常处理，让前端拿到一致的 `{code, message, data}`。

### 为什么
没有统一异常处理，异常堆栈直接漏给前端（不安全且不可用）；没有统一返回体，前端要写 N 种解析逻辑。

### 怎么用
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public Result<Void> handle(MethodArgumentNotValidException e) {
    String msg = e.getBindingResult().getFieldErrors().stream()
        .map(FieldError::getDefaultMessage).collect(Collectors.joining(";"));
    return Result.fail(400, msg);
  }
}
```
跨域：全局配 `WebMvcConfigurer#addCorsMappings` 或 `@CrossOrigin`。

### 常见坑
- @RequestBody 只能有一个；GET 里的对象参数要用 `@ParameterObject` 风格（逐字段绑定）。
- 日期参数用 `@DateTimeFormat` 或全局 Jackson 格式配置，别靠魔法字符串。
- 校验注解加在 controller 参数上时类要标 `@Validated` 才生效。

### 面试怎么问
「接口参数校验怎么做？校验不通过前端拿到什么？」——答出注解 + 全局异常转统一返回体，是工程化基本功。

## 动手清单

1. 给用户注册接口加 @NotBlank/@Email/@Size 校验 + 全局异常处理，用 curl 传非法参数验证返回统一错误体。自测标准：返回结构统一且不漏堆栈。
2. 实现一个文件上传接口（@RequestParam MultipartFile），限制类型与大小（spring.servlet.multipart.max-file-size）。自测标准：能说明超限时的异常与处理位置。
