import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'deploy-02-upload-001',
    type: 'single',
    difficulty: 1,
    tags: ['打包'],
    stem: `Spring Boot 的 fat jar 相比普通 jar 的特点是？`,
    options: [
      { key: 'A', text: '内嵌 Web 容器与依赖，可直接 java -jar 运行' },
      { key: 'B', text: '必须放到外部 Tomcat 的 webapps 目录才能运行' },
      { key: 'C', text: '体积更小，因为不含依赖' },
      { key: 'D', text: '只能用于开发环境' },
    ],
    answers: ['A'],
    explanation: `fat jar 把依赖与内嵌容器一起打包，由 JarLauncher 启动。B 是 war 部署方式，C 与实际体积相反，D 与生产常用方式矛盾。`,
  },
  {
    id: 'deploy-02-upload-002',
    type: 'single',
    difficulty: 1,
    tags: ['传输'],
    stem: `把本地 app.jar 传到服务器 /opt/app/，最常用的命令是？`,
    options: [
      { key: 'A', text: 'git commit' },
      { key: 'B', text: 'scp app.jar user@server:/opt/app/' },
      { key: 'C', text: 'chmod 755' },
      { key: 'D', text: 'curl -I' },
    ],
    answers: ['B'],
    explanation: `scp 基于 SSH 复制文件，rsync 适合增量同步。A 是版本控制，C 改权限，D 发 HTTP 请求。`,
  },
  {
    id: 'deploy-02-upload-003',
    type: 'single',
    difficulty: 2,
    tags: ['进程守护'],
    stem: `nohup java -jar app.jar > app.log 2>&1 & 中 nohup 的作用是？`,
    options: [
      { key: 'A', text: '让进程忽略挂断信号，终端关闭后继续运行' },
      { key: 'B', text: '自动给应用配置 HTTPS' },
      { key: 'C', text: '把日志压缩归档' },
      { key: 'D', text: '限制 JVM 内存上限' },
    ],
    answers: ['A'],
    explanation: `nohup 屏蔽 SIGHUP，配合 & 与输出重定向实现最简单的后台常驻。B、C、D 分别属于证书、日志轮转与 JVM 参数。`,
  },
  {
    id: 'deploy-02-upload-004',
    type: 'single',
    difficulty: 2,
    tags: ['systemd'],
    stem: `systemd unit 里 Restart=always 的含义是？`,
    options: [
      { key: 'A', text: '服务器开机时重启整台机器' },
      { key: 'B', text: '进程退出后由 systemd 自动拉起' },
      { key: 'C', text: '每次 HTTP 请求都重启应用' },
      { key: 'D', text: '禁止服务被停止' },
    ],
    answers: ['B'],
    explanation: `Restart 定义退出后的重启策略，always 表示无论退出原因都拉起；配合 RestartSec 可以控制间隔。A、C、D 都不是它的语义。`,
  },
  {
    id: 'deploy-02-upload-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['发版'],
    stem: `一次安全的发版通常包含哪些动作？`,
    options: [
      { key: 'A', text: '备份上一版产物，保证能快速回滚' },
      { key: 'B', text: '停旧进程后再替换 jar，避免类加载异常' },
      { key: 'C', text: '启动后检查健康检查接口与最近日志' },
      { key: 'D', text: '把数据库密码明文写进启动脚本方便排查' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 是标准发版动作。D 是安全反模式，凭据应走环境变量、配置中心或密钥管理。`,
  },
  {
    id: 'deploy-02-upload-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['进程守护'],
    scenario: `用 java -jar app.jar & 启动应用后一切正常，但关闭 SSH 终端几分钟后服务就访问不到了，登录后 ps 也找不到进程。`,
    stem: `最可能的原因和首选改进是？`,
    options: [
      { key: 'A', text: 'JVM 内存不足，调大 -Xmx' },
      { key: 'B', text: '进程随会话收到挂断信号退出，改用 systemd 或 nohup 做进程守护' },
      { key: 'C', text: 'Nginx 配置错误，重写 proxy_pass' },
      { key: 'D', text: '数据库连不上，检查连接池' },
    ],
    answers: ['B'],
    explanation: `现象是「终端关闭即进程消失」，典型的前台进程随会话退出。systemd 是生产首选，nohup 是最小改法。A、C、D 都不会表现为「SSH 断开才挂」。`,
  },
  {
    id: 'deploy-02-upload-007',
    type: 'code',
    difficulty: 3,
    tags: ['systemd'],
    stem: `读下面这个 unit 片段，应用异常退出后会怎样？

~~~ini
[Service]
ExecStart=/usr/bin/java -jar /opt/app/app.jar
Restart=always
RestartSec=5
WorkingDirectory=/opt/app
~~~`,
    options: [
      { key: 'A', text: 'systemd 等待 5 秒后自动重新执行 ExecStart' },
      { key: 'B', text: '系统立即关机重启' },
      { key: 'C', text: '应用只会被启动一次，之后不再拉起' },
      { key: 'D', text: '自动回滚到上一版 jar' },
    ],
    answers: ['A'],
    explanation: `Restart=always 表示任何退出都重启，RestartSec=5 指定间隔 5 秒。B、C、D 都不是 systemd 的行为，回滚需要人工或发布系统完成。`,
  },
]
