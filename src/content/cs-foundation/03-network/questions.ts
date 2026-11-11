import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'cs-foundation-03-network-001',
    type: 'single',
    difficulty: 1,
    tags: ['TCP', 'TIME_WAIT'],
    stem: '关于 TCP 连接的建立与关闭，下列说法正确的是？',
    options: [
      { key: 'A', text: '两次握手已足够，第三次 ACK 只是为了顺带携带业务数据' },
      { key: 'B', text: 'TIME_WAIT 出现在主动关闭连接的一方，用于保证最后 ACK 可达并让残留报文消散' },
      { key: 'C', text: '四次挥手中，被动关闭方发完 FIN 后直接进入 CLOSED，不需要等待' },
      { key: 'D', text: 'TIME_WAIT 只会出现在服务端，客户端不会进入该状态' },
    ],
    answers: ['B'],
    explanation:
      '这题考的是连接生命周期里最容易被背错的两个点。A 错在第三次 ACK 是为了让服务端确认客户端的接收能力，并防止历史重复的 SYN 被误建成连接，不是捎带数据。C 错在发送最后一个 ACK 的一方必须等 2MSL 才能关闭，否则这个 ACK 丢了、对方重发 FIN 时已无人应答。D 错在 TIME_WAIT 归「主动关闭方」，与客户端或服务端的角色无关，短连接高并发的客户端机器上往往堆积最多。B 正确：2MSL 既保证最后 ACK 丢失时可重发，也让本次连接的迟到报文在网络中自然消亡，不污染复用相同四元组的新连接。',
  },
  {
    id: 'cs-foundation-03-network-002',
    type: 'multiple',
    difficulty: 2,
    tags: ['HTTP', '幂等性'],
    stem: '关于 HTTP 状态码与幂等性，下列说法正确的有？',
    options: [
      { key: 'A', text: '401 表示未认证，403 表示已认证但权限不足，两者语义不同' },
      { key: 'B', text: '304 表示资源未修改，响应通常不携带响应体，可配合协商缓存使用' },
      { key: 'C', text: 'POST 天然幂等，网络超时后直接重试不会产生副作用' },
      { key: 'D', text: '502 通常是网关收到上游无效响应，504 通常是等待上游响应超时' },
    ],
    answers: ['A', 'B', 'D'],
    explanation:
      '状态码定位责任边界，幂等性决定能不能自动重试。A 是 4xx 里最常混用的一对，把 403 当 401 会让客户端不停跳登录页。B 是协商缓存的核心，服务端只回头部不回实体，省带宽。D 是网关排障的第一步，502 看上游是否返回了非法内容，504 看上游是否根本没在超时内应答。C 错在 POST 用于创建资源，重复提交可能生成两笔订单；网络抖动时下游往往已经执行成功、只是响应丢了，必须靠幂等键、唯一索引或幂等表兜底，不能盲目重试。',
  },
  {
    id: 'cs-foundation-03-network-003',
    type: 'code',
    difficulty: 3,
    tags: ['HTTP', '连接复用'],
    stem: `某 Java 服务用下面方式调用下游接口，压测 QPS 到 300 后出现大量 connect timeout，下游 CPU 和 GC 都正常。

~~~java
public String call(String url) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest req = HttpRequest.newBuilder(URI.create(url)).GET().build();
    return client.send(req, HttpResponse.BodyHandlers.ofString()).body();
}
~~~

下列判断正确的是？`,
    options: [
      { key: 'A', text: '问题在下游处理慢，应优先给下游扩容并调大堆内存' },
      { key: 'B', text: '每次调用都新建客户端与连接，握手与端口消耗累积；应复用单例客户端并保持长连接' },
      { key: 'C', text: 'connect timeout 说明对端返回了 HTTP 500，应改用 POST 重试' },
      { key: 'D', text: '这是 TLS 证书校验失败，关闭证书校验即可解决' },
    ],
    answers: ['B'],
    explanation:
      'connect timeout 是「连不上」，不是「对端处理慢」，结合下游指标正常，问题应在调用方。A 错在下游 CPU 与 GC 都正常，扩容无助于连接建立阶段的超时。C 错在 HTTP 500 属于已建立连接后收到的响应，与 connect timeout 是两回事，换 POST 更改变不了语义。D 错在证书校验失败会抛 SSLHandshakeException，而非连接超时，且关闭校验会带来中间人风险。B 正确：方法内每次 newHttpClient 都新建连接池，高频短连接会持续消耗三次握手与 TLS 握手开销，并快速耗尽本地临时端口（表现为 Cannot assign requested address 或 connect timeout）；把客户端提为单例复用连接，并设置连接/读取超时与连接池上限，才是根治。',
  },
]
