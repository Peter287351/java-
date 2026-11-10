import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'deploy-01-linux-001',
    type: 'single',
    difficulty: 1,
    tags: ['权限'],
    stem: `chmod 755 app.jar 表示？`,
    options: [
      { key: 'A', text: '所有人都有读写执行权限' },
      { key: 'B', text: '属主可读可写可执行，属组与其他人可读可执行' },
      { key: 'C', text: '只有属主可读，其他人都不能访问' },
      { key: 'D', text: '把文件改成目录' },
    ],
    answers: ['B'],
    explanation: `7=rwx、5=r-x，三组分别对应属主/属组/其他人。A 是 777 的效果，C 接近 700 但描述不准，D 与 chmod 无关。`,
  },
  {
    id: 'deploy-01-linux-002',
    type: 'single',
    difficulty: 1,
    tags: ['日志'],
    stem: `想实时跟踪应用日志新增内容，应使用？`,
    options: [
      { key: 'A', text: 'cat app.log' },
      { key: 'B', text: 'tail -f app.log' },
      { key: 'C', text: 'cp app.log app.log.bak' },
      { key: 'D', text: 'chmod 644 app.log' },
    ],
    answers: ['B'],
    explanation: `tail -f 持续输出文件末尾新增行，是线上看日志的常用方式。A 只打印一次，C 是备份，D 是改权限。`,
  },
  {
    id: 'deploy-01-linux-003',
    type: 'single',
    difficulty: 2,
    tags: ['进程'],
    stem: `要查 8080 端口被哪个进程占用，最直接的命令组合是？`,
    options: [
      { key: 'A', text: 'df -h' },
      { key: 'B', text: 'ss -lntp | grep 8080' },
      { key: 'C', text: 'uname -a' },
      { key: 'D', text: 'date' },
    ],
    answers: ['B'],
    explanation: `ss -lntp 列出监听端口与对应 PID/进程名（lsof -i:8080 也可）。A 看磁盘，C 看内核版本，D 看时间。`,
  },
  {
    id: 'deploy-01-linux-004',
    type: 'single',
    difficulty: 2,
    tags: ['权限'],
    stem: `应用启动报 Permission denied，最不可能的原因是？`,
    options: [
      { key: 'A', text: '应用账号对日志目录没有写权限' },
      { key: 'B', text: '启动脚本没有执行权限' },
      { key: 'C', text: 'jar 所在目录被挂载为只读' },
      { key: 'D', text: '服务器时间与本地相差 5 分钟' },
    ],
    answers: ['D'],
    explanation: `时间偏差通常影响证书校验与日志时间戳，不会触发文件权限错误。A、B、C 都是典型的权限/挂载问题。`,
  },
  {
    id: 'deploy-01-linux-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['排查'],
    stem: `服务「本机可访问、外网访问不了」时，应检查哪些？`,
    options: [
      { key: 'A', text: '应用是否只绑定了 127.0.0.1' },
      { key: 'B', text: '云主机安全组 / 防火墙是否放行端口' },
      { key: 'C', text: 'Nginx 是否监听公网网卡并正确转发' },
      { key: 'D', text: '浏览器是否开启了深色模式' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 都是内外网可达性差异的常见原因。D 只影响显示样式，与网络连通性无关。`,
  },
  {
    id: 'deploy-01-linux-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['权限'],
    scenario: `新部署的 Spring Boot 应用用专用账号 appuser 启动，日志里出现 java.io.FileNotFoundException: /var/log/app/app.log (Permission denied)。`,
    stem: `最小且正确的修复是？`,
    options: [
      { key: 'A', text: '把应用改成 root 账号启动' },
      { key: 'B', text: '给 /var/log/app 目录授予 appuser 写权限（chown 或 chmod）' },
      { key: 'C', text: '把日志级别改成 DEBUG' },
      { key: 'D', text: '重启整台服务器' },
    ],
    answers: ['B'],
    explanation: `根因是应用账号对日志目录无写权限，按最小权限原则把该目录授权给 appuser 即可。A 放大权限带来安全风险，C、D 不解决权限问题。`,
  },
  {
    id: 'deploy-01-linux-007',
    type: 'code',
    difficulty: 3,
    tags: ['权限'],
    stem: `读下面 ls -l 的输出，哪个判断正确？

~~~text
-rw-r--r-- 1 appuser app 2048 Nov 10 09:00 app.yml
-rwxr-xr-x 1 appuser app  512 Nov 10 09:00 start.sh
~~~`,
    options: [
      { key: 'A', text: 'app.yml 可被属主读写，其他人只读；start.sh 可执行' },
      { key: 'B', text: 'app.yml 任何人都可以执行' },
      { key: 'C', text: 'start.sh 只有属主能执行' },
      { key: 'D', text: '两个文件都没有读权限' },
    ],
    answers: ['A'],
    explanation: `rw-r--r-- 对应 644，rwxr-xr-x 对应 755。B 把读权限说成执行，C 忽略了其他人的 x 位，D 与 r 位矛盾。`,
  },
]
