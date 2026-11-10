import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'docker-02-dockerfile-001',
    type: 'single',
    difficulty: 1,
    tags: ['Dockerfile'],
    stem: `Dockerfile 中 FROM 指令的作用是？`,
    options: [
      { key: 'A', text: '指定基础镜像，作为后续层的起点' },
      { key: 'B', text: '声明容器对外端口' },
      { key: 'C', text: '定义容器启动命令' },
      { key: 'D', text: '复制本地文件到镜像' },
    ],
    answers: ['A'],
    explanation: `每个阶段都从 FROM 开始。B 是 EXPOSE，C 是 CMD/ENTRYPOINT，D 是 COPY/ADD。`,
  },
  {
    id: 'docker-02-dockerfile-002',
    type: 'single',
    difficulty: 1,
    tags: ['.dockerignore'],
    stem: `.dockerignore 的主要作用是？`,
    options: [
      { key: 'A', text: '排除不需要的文件进入构建上下文，减小上下文并避免误拷贝' },
      { key: 'B', text: '运行时忽略容器日志' },
      { key: 'C', text: '让镜像自动压缩' },
      { key: 'D', text: '指定容器网络模式' },
    ],
    answers: ['A'],
    explanation: `它类似 .gitignore，作用于构建上下文，常排除 .git、target、node_modules 与本地密钥。B、C、D 都不是它的职责。`,
  },
  {
    id: 'docker-02-dockerfile-003',
    type: 'single',
    difficulty: 2,
    tags: ['COPY'],
    stem: `关于 COPY 与 ADD，下列说法正确的是？`,
    options: [
      { key: 'A', text: 'ADD 只能复制本地文件，COPY 能自动解压远程 URL' },
      { key: 'B', text: 'COPY 语义更明确；ADD 额外支持自动解压归档与远程 URL，日常推荐用 COPY' },
      { key: 'C', text: '两者都会执行 Shell 命令' },
      { key: 'D', text: 'COPY 只能在多阶段构建中使用' },
    ],
    answers: ['B'],
    explanation: `官方建议优先 COPY，因为 ADD 的隐式解压/拉取行为不直观。A 说反，C 是 RUN 的能力，D 与阶段无关。`,
  },
  {
    id: 'docker-02-dockerfile-004',
    type: 'single',
    difficulty: 2,
    tags: ['CMD', 'ENTRYPOINT'],
    stem: `Dockerfile 同时写了 ENTRYPOINT ["java","-jar"] 与 CMD ["app.jar"]，执行 docker run image debug.jar 时会？`,
    options: [
      { key: 'A', text: 'ENTRYPOINT 保留，CMD 被替换成 debug.jar，最终参数变成 java -jar debug.jar' },
      { key: 'B', text: '整条命令被替换成只运行 debug.jar' },
      { key: 'C', text: '两个参数都会执行，启动两个 Java 进程' },
      { key: 'D', text: '构建阶段就报错' },
    ],
    answers: ['A'],
    explanation: `docker run 后的命令会覆盖 CMD，但 ENTRYPOINT 不变，因此覆盖值作为 ENTRYPOINT 的参数追加。B 是没有 ENTRYPOINT 时的行为，C、D 不符合 exec 格式语义。`,
  },
  {
    id: 'docker-02-dockerfile-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['镜像分层'],
    stem: `关于镜像分层与缓存，说法正确的有哪些？`,
    options: [
      { key: 'A', text: '每条 RUN / COPY 通常生成一层，未变化的层可以复用缓存' },
      { key: 'B', text: '把依赖安装放在源码 COPY 之前，能减少改代码后的重建范围' },
      { key: 'C', text: '多阶段构建可让最终镜像不包含编译工具链' },
      { key: 'D', text: 'EXPOSE 8080 会自动把端口发布到宿主机' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 都是分层与多阶段构建的核心用法。D 错：EXPOSE 只是元数据声明，真正发布端口要靠 docker run -p 或 Compose ports。`,
  },
  {
    id: 'docker-02-dockerfile-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['构建缓存'],
    scenario: `团队 Dockerfile 第一行就是 COPY . .，之后才是 RUN mvn package。每次只改一行 Java 代码，镜像构建都要重新下载全部 Maven 依赖，耗时十几分钟。`,
    stem: `最有效的优化是？`,
    options: [
      { key: 'A', text: '给 docker build 加 --no-cache' },
      { key: 'B', text: '先单独 COPY pom.xml 并跑依赖下载，再 COPY 源码并构建，让依赖层命中缓存' },
      { key: 'C', text: '把基础镜像换成完整版操作系统' },
      { key: 'D', text: '改用 docker commit 手工制作镜像' },
    ],
    answers: ['B'],
    explanation: `缓存按层失效：COPY . . 让任何源码变动都使后续层失效。拆成「依赖清单层 + 源码层」后，只改代码不会重跑依赖下载。A 反而禁用缓存，C、D 都不是构建优化。`,
  },
  {
    id: 'docker-02-dockerfile-007',
    type: 'code',
    difficulty: 3,
    tags: ['多阶段构建'],
    stem: `读下面 Dockerfile，最终镜像里运行的是什么？

~~~dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY . .
RUN mvn -q package -DskipTests
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /src/target/app.jar app.jar
ENTRYPOINT ["java","-jar"]
CMD ["app.jar"]
~~~`,
    options: [
      { key: 'A', text: '只含 JRE 与 app.jar，启动命令是 java -jar app.jar' },
      { key: 'B', text: '含 Maven 与全部源码，启动时重新 mvn package' },
      { key: 'C', text: '镜像里没有任何 jar，启动会失败' },
      { key: 'D', text: '启动命令是 mvn -q package' },
    ],
    answers: ['A'],
    explanation: `第二个 FROM 开启新阶段，只从 build 阶段复制 jar，构建工具与源码不会进入最终镜像；ENTRYPOINT + CMD 拼成 java -jar app.jar。B、D 把构建阶段当成运行阶段，C 忽略了 --from 复制。`,
  },
]
