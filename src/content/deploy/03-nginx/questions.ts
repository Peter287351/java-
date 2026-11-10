import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'deploy-03-nginx-001',
    type: 'single',
    difficulty: 1,
    tags: ['反向代理'],
    stem: `在后端服务前放 Nginx 做反向代理，主要收益是？`,
    options: [
      { key: 'A', text: '统一对外入口、处理 TLS 与静态资源，并隐藏后端端口' },
      { key: 'B', text: '替代数据库执行 SQL' },
      { key: 'C', text: '自动修复 Java 代码里的 bug' },
      { key: 'D', text: '让 JVM 内存占用减半' },
    ],
    answers: ['A'],
    explanation: `反向代理负责入口收敛、证书卸载、静态资源与转发，后端只需监听内网端口。B、C、D 都不属于 Web 服务器职责。`,
  },
  {
    id: 'deploy-03-nginx-002',
    type: 'single',
    difficulty: 1,
    tags: ['HTTPS'],
    stem: `HTTPS 默认监听的端口是？`,
    options: [
      { key: 'A', text: '80' },
      { key: 'B', text: '443' },
      { key: 'C', text: '8080' },
      { key: 'D', text: '3306' },
    ],
    answers: ['B'],
    explanation: `HTTPS/TLS 默认 443，HTTP 默认 80；8080 常是应用端口，3306 是 MySQL 默认端口。`,
  },
  {
    id: 'deploy-03-nginx-003',
    type: 'single',
    difficulty: 2,
    tags: ['proxy_pass'],
    stem: `location /api/ 里写 proxy_pass http://127.0.0.1:8080（末尾无斜杠），请求 /api/user 转发后的路径通常是？`,
    options: [
      { key: 'A', text: '/api/user' },
      { key: 'B', text: '/user' },
      { key: 'C', text: '/' },
      { key: 'D', text: '/8080/api/user' },
    ],
    answers: ['A'],
    explanation: `proxy_pass 不带 URI 部分时，Nginx 保留原始请求 URI；带结尾斜杠才会把 location 前缀替换掉。B 是带斜杠写法的效果，C、D 不符合规则。`,
  },
  {
    id: 'deploy-03-nginx-004',
    type: 'single',
    difficulty: 2,
    tags: ['负载均衡'],
    stem: `Nginx 的 upstream 块主要用于？`,
    options: [
      { key: 'A', text: '定义一组后端实例并做负载均衡' },
      { key: 'B', text: '存放 TLS 私钥' },
      { key: 'C', text: '配置 DNS 解析记录' },
      { key: 'D', text: '压缩 JVM 日志' },
    ],
    answers: ['A'],
    explanation: `upstream 列出多个 server，配合轮询/权重/ip_hash 等策略分发请求。B 是 ssl_certificate_key，C 在 DNS 服务商配置，D 与 Nginx 无关。`,
  },
  {
    id: 'deploy-03-nginx-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['代理头'],
    stem: `反向代理场景下，为了让后端拿到真实客户端信息，通常会设置哪些头？`,
    options: [
      { key: 'A', text: 'Host' },
      { key: 'B', text: 'X-Real-IP / X-Forwarded-For' },
      { key: 'C', text: 'X-Forwarded-Proto' },
      { key: 'D', text: 'Content-Length 由 Nginx 强制改成 0' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 分别传递原始域名、客户端 IP 链与原始协议，Spring 侧需配合 ForwardedHeaderFilter 解析。D 会破坏请求体，不是常规做法。`,
  },
  {
    id: 'deploy-03-nginx-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['502'],
    scenario: `应用进程正常、本机 curl 127.0.0.1:8080 能返回结果，但外网访问域名返回 502 Bad Gateway。`,
    stem: `最应该优先排查的是？`,
    options: [
      { key: 'A', text: '浏览器缓存，先清 Cookie' },
      { key: 'B', text: 'Nginx 的 proxy_pass / upstream 指向是否正确、后端是否监听在可访问地址' },
      { key: 'C', text: '数据库表结构是否变更' },
      { key: 'D', text: '前端 CSS 是否压缩' },
    ],
    answers: ['B'],
    explanation: `502 表示 Nginx 连不上上游，优先看 upstream 地址、端口、后端绑定地址与错误日志。A、C、D 都不会让代理层返回 502。`,
  },
  {
    id: 'deploy-03-nginx-007',
    type: 'code',
    difficulty: 3,
    tags: ['Nginx 配置'],
    stem: `读下面配置，访问 http://example.com/api/user 时请求会去哪？

~~~nginx
upstream backend { server 127.0.0.1:8081; server 127.0.0.1:8082; }
server {
  listen 80;
  location /api/ { proxy_pass http://backend; }
  location / { root /var/www/html; }
}
~~~`,
    options: [
      { key: 'A', text: '按默认轮询转发到 8081 或 8082，路径保留 /api/user' },
      { key: 'B', text: '直接返回 /var/www/html 下的静态文件' },
      { key: 'C', text: '固定转发到 8081，路径变成 /user' },
      { key: 'D', text: '返回 404，因为没有配置后端' },
    ],
    answers: ['A'],
    explanation: `location /api/ 命中 proxy_pass，upstream 两个 server 默认轮询；proxy_pass 不带 URI 后缀所以保留原路径。B 是 location / 的行为，C 错在路径与固定实例，D 忽略了 upstream。`,
  },
]
