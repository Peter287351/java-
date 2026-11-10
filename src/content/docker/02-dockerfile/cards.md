## Dockerfile 常用指令

### 是什么
`FROM` 指定基础镜像，`WORKDIR` 设置工作目录，`COPY` 复制文件，`RUN` 在构建时执行命令并产生新层，`ENV` 设环境变量，`EXPOSE` 声明端口，`CMD` / `ENTRYPOINT` 指定容器启动命令。

### 怎么用
`.dockerignore` 排除 `target/`、`node_modules/`、`.git/` 等，避免把无用文件送进构建上下文。Spring Boot 常用分层 jar（`layertools`）把依赖层与代码层分开。

### 常见坑
- `CMD` 会被 `docker run` 后面跟的命令整体覆盖，`ENTRYPOINT` 不会被覆盖（附加参数），两者搭配时要分清。
- `EXPOSE` 只是声明，不会真的发布端口，仍需 `-p`。
- 每条 `RUN` 生成一层，装完包不清理缓存会让镜像虚胖。

### 面试怎么问
「CMD 和 ENTRYPOINT 区别？」答覆盖方式与参数传递方式，能举 `docker run image echo hi` 的例子更好。

## 分层缓存与多阶段构建

### 是什么
Docker 按层缓存：某一层内容没变就复用缓存。多阶段构建用多个 `FROM`，前一阶段装 JDK/Maven 编译，后一阶段只复制产物到 JRE 基础镜像，最终镜像不含构建工具。

### 怎么用
把「几乎不变」的依赖复制与安装放在前面，把「经常变」的源码 COPY 放在最后，这样改代码只重建最后几层。Java 项目典型两阶段：`maven:3.9-eclipse-temurin-17 AS build` → `eclipse-temurin:17-jre`。

### 常见坑
- 一上来就 `COPY . .`，任何文件改动都会让后续所有层缓存失效，构建变得很慢。
- 构建阶段把凭据当构建参数传进去，会留在镜像历史里。
- 多阶段忘记 `--from=build` 复制产物，最终镜像里根本没有 jar。

### 面试怎么问
「怎么给 Java 镜像瘦身？」答多阶段构建 + JRE 基础镜像 + 分层 jar + 清理构建缓存。

## 动手清单
1. 写两个 Dockerfile：一个先 COPY . . 再装依赖，一个先复制依赖清单；各改一行源码后重新构建，对比耗时。
2. 用多阶段构建打一个 Spring Boot 镜像，用 docker history 观察最终镜像是否还含 Maven。
