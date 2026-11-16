import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'microservices-07-auth-001',
    type: 'single',
    difficulty: 1,
    tags: ['JWT', '令牌结构'],
    stem: '关于 JWT 的三段结构与安全性，下列说法正确的是？',
    options: [
      { key: 'A', text: '三段都经过加密，服务端必须持有密钥才能解出 payload' },
      { key: 'B', text: 'payload 只是 Base64URL 编码，任何人拿到令牌都能解码出明文，敏感信息不应放进去' },
      { key: 'C', text: '只要不改 header，改动 payload 里的 userId 后签名依然有效' },
      { key: 'D', text: 'HS256 与 RS256 只是签名长度不同，密钥的分发方式完全一样' },
    ],
    answers: ['B'],
    explanation:
      'JWT 的 header 与 payload 是 Base64URL 编码（可逆向解码），signature 才负责防篡改，所以「能解码」不等于「被加密」，更不能把密码、手机号塞进 payload。A 错在把编码当加密。C 错在签名覆盖的正是前两段，改了 payload 签名就对不上，验签会直接失败——但前提是服务端真的验签。D 错在 HS256 是对称算法（所有验签方共享同一把密钥，任一服务泄露就能伪造令牌），RS256 是非对称算法（认证中心私钥签，业务服务只拿公钥验），微服务场景更推荐后者。B 正确。',
  },
  {
    id: 'microservices-07-auth-002',
    type: 'single',
    difficulty: 1,
    tags: ['OAuth2', 'OIDC'],
    stem: '关于 OAuth2、OIDC 与 JWT 的关系，下列说法正确的是？',
    options: [
      { key: 'A', text: 'OAuth2 是认证协议，专门用来向业务系统证明用户是谁' },
      { key: 'B', text: 'OIDC 在 OAuth2 之上增加 id_token 表达用户身份；OAuth2 本身是授权框架，JWT 只是令牌的一种格式' },
      { key: 'C', text: 'JWT 是 OAuth2 四种授权模式中的一种' },
      { key: 'D', text: '只要拿到 access token，就可以直接把它当作用户身份证明使用' },
    ],
    answers: ['B'],
    explanation:
      '这题考三层不要混淆：OAuth2 是「流程与角色」的规范，解决第三方在不拿密码的前提下拿到有限授权（scope）；OIDC 是它上面的身份层，用 id_token 回答「你是谁」；JWT 只是令牌的编码格式，和前两者不在同一层。A 错在 OAuth2 管的是授权而非认证。C 错在四种模式是授权码、隐式、密码、客户端凭证，JWT 是格式不是流程。D 错在 access token 是给资源服务器用的凭据，直接拿来当用户身份是常见设计错误，应该用 OIDC 的 id_token 或 /userinfo。B 正确。',
  },
  {
    id: 'microservices-07-auth-003',
    type: 'single',
    difficulty: 2,
    tags: ['OAuth2', 'PKCE'],
    stem: '为什么现在推荐「授权码 + PKCE」，而不推荐隐式模式与密码模式？',
    options: [
      { key: 'A', text: 'PKCE 让前端可以安全地长期保存客户端密钥' },
      { key: 'B', text: '授权码一次性且换取令牌时必须带上只有发起方知道的 code_verifier，授权码被截获也换不到令牌；隐式模式把令牌暴露在 URL 片段，密码模式让应用直接接触用户密码' },
      { key: 'C', text: 'PKCE 会把令牌加密后放进回调 URL，所以不怕中间人截获' },
      { key: 'D', text: '密码模式最安全，因为每次登录都会重新校验用户密码' },
    ],
    answers: ['B'],
    explanation:
      'PKCE 的流程是：发起授权时先生成随机 code_verifier，把它的哈希 code_challenge 随授权请求送出；换令牌时必须同时提交 code 与原始 code_verifier，认证中心比对哈希通过才发令牌。攻击者即使截获了回调里的 code，没有 verifier 也换不到令牌。A 错在 PKCE 恰恰是为了让无法保密密钥的公开客户端（SPA、移动端）安全使用，不是让它保存密钥。C 错在令牌从不在回调 URL 里传递，令牌走的是后端与认证中心之间的令牌端点，PKCE 也没有「加密放进 URL」这回事。D 错在密码模式要求应用收集用户密码，把密码扩散到客户端、也无法支持 MFA 与统一风控，已被明确弃用；隐式模式则因 token 出现在 URL 片段而同样不推荐。B 正确。',
  },
  {
    id: 'microservices-07-auth-004',
    type: 'single',
    difficulty: 2,
    tags: ['JWT', '验签'],
    stem: '服务端校验一个外部传入的 JWT，下列哪组校验最完整？',
    options: [
      { key: 'A', text: '只要签名能通过验证就放行' },
      { key: 'B', text: '验证签名 + 限制算法白名单 + 校验 exp/nbf + iss + aud，必要时按 jti 防重放' },
      { key: 'C', text: '只要三段能被 Base64URL 解码就放行' },
      { key: 'D', text: '只要 payload 里带有 userId 字段就放行' },
    ],
    answers: ['B'],
    explanation:
      '验签是「令牌没被改过」，但授权判断还要回答「谁签的、签给谁、还有效吗」。B 覆盖了算法白名单（拒绝 alg=none 与 RS256→HS256 混淆攻击）、有效期（exp/nbf）、签发方（iss）、受众（aud，防止把签给 A 系统的令牌用到 B 系统）与重放（jti）。A 错在只验签名会放过过期令牌、别系统签发的令牌，甚至接受被降级算法的伪造令牌。C 错在解码不需要任何密钥，等于不设防。D 错在 payload 是客户端可任意构造的明文，改一下就能冒充任意用户。B 正确。',
  },
  {
    id: 'microservices-07-auth-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['JWT', '令牌吊销'],
    stem: '需要实现「用户改密码后，旧的 access token 尽快失效」，下列哪些做法可行？',
    options: [
      { key: 'A', text: '缩短 access token 有效期（如 5～15 分钟），配合 refresh token 轮换与主动失效' },
      { key: 'B', text: '用 Redis 黑名单按 jti 记录被吊销的令牌，条目过期时间设为该令牌原本的 exp' },
      { key: 'C', text: '在用户记录里存 token_version 并写进 claim，改密时递增，验签后比对当前值' },
      { key: 'D', text: '退出登录时只在前端删掉 localStorage 里的 token，后端不需要改动' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'JWT 无状态的代价就是「签发后不能像 Session 一样直接删」，工程上有三种折中：A 让失效窗口足够短并把长会话收敛到可吊销的 refresh token；B 用黑名单把「不能立刻作废」变成「中心化查一次」，条目随原 exp 自动清理，不会无限膨胀；C 用版本号让某个用户的所有旧令牌一次性失效，适合改密、封禁这类按用户维度的吊销。D 错在前端删除只是让浏览器不再携带令牌，令牌本身在 exp 之前依然有效，攻击者若已拿到副本照样能用；这也是「退出登录仍然能访问」的典型成因。',
  },
  {
    id: 'microservices-07-auth-006',
    type: 'multiple',
    difficulty: 3,
    tags: ['网关鉴权', 'RBAC'],
    stem: '关于网关统一鉴权与业务授权，下列说法正确的有？',
    options: [
      { key: 'A', text: '网关入口应先剔除外部请求里自带的身份 Header，再由网关写入可信身份，防止客户端伪造 X-User-Id' },
      { key: 'B', text: '内网服务对网关下发的身份不能完全盲信，至少做最小校验（内部令牌 / mTLS / 签名复核）' },
      { key: 'C', text: '401 表示未认证或令牌无效，403 表示已认证但没有权限，两者语义不能混用' },
      { key: 'D', text: '网关已经验过签名，订单接口就不必再校验「这条订单是否属于当前登录人」' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A 是防伪造的基本功：外部带上来的同名 Header 必须先清掉，否则客户端自己写一个 X-User-Id 就能冒充任何人。B 说的是信任边界：网关可能被绕过、内部可能有直连，所以下游要有兜底校验。C 是 HTTP 语义，混用会让前端该跳登录页时不跳、该提示无权限时乱跳。D 错在混淆了「认证」与「授权」：网关只证明「你是谁」，资源归属（水平越权）只能由业务服务按当前登录人做数据级校验，接口级与数据级权限一个都不能省。',
  },
  {
    id: 'microservices-07-auth-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['越权', '安全排查'],
    scenario:
      '订单查询接口 GET /api/orders/{id} 上线后接到投诉：用户 A 登录后把 URL 里的订单号改成 B 的订单号，就能看到 B 的收货地址与金额。网关已正确校验 JWT 签名与 exp，接口正常返回 200，日志里也没有任何异常。',
    stem: '最贴近根因与修复方案的是？',
    options: [
      { key: 'A', text: 'JWT 签名算法太弱，把 HS256 换成 RS256 即可解决' },
      { key: 'B', text: '属于水平越权：接口只判断了「是否登录」，没校验「资源是否属于当前登录人」；应从可信身份取 userId 并作为查询条件，同时补接口级与数据级权限' },
      { key: 'C', text: '网关没配限流，补上限流即可' },
      { key: 'D', text: '把订单号改成不可枚举的 UUID 就能彻底解决，不需要服务端再做校验' },
    ],
    answers: ['B'],
    explanation:
      '令牌合法、签名有效、返回 200，说明认证这一层完全正常；问题出在业务层只做了「登录了没」，没有做「这条数据是不是他的」，这正是水平越权的定义。A 错在换签名算法防的是伪造令牌，与数据归属无关，题目里令牌本来就是合法签发的。C 错在限流控制的是请求速率，解释不了「换一个 id 就看到别人的数据」。D 错在 UUID 只是提高猜测难度，属于「靠别人猜不到」而不是访问控制：订单号会出现在物流短信、对账单、分享链接里，一旦泄露照样越权，且共享链接等场景本来就要暴露 id。B 正确：查询条件强制带上从可信身份解析出的 userId（不能用请求参数里的用户 id），对越权返回 403 或按业务返回 404，并补审计日志。',
  },
  {
    id: 'microservices-07-auth-008',
    type: 'code',
    difficulty: 2,
    tags: ['JWT', '验签'],
    stem: `某服务用下面这个工具方法从 JWT 里取当前用户身份：

~~~java
public String currentUserId(String token) {
  String[] parts = token.split("[.]");
  String json = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
  Map<String, Object> claim = objectMapper.readValue(json, Map.class);
  return (String) claim.get("sub");
}
~~~

下列说法正确的是？`,
    options: [
      { key: 'A', text: '只要请求走 HTTPS，改动 payload 会被 TLS 阻止，所以这段代码是安全的' },
      { key: 'B', text: '该方法只做 Base64URL 解码、完全没有验签，攻击者把 payload 里的 sub 改成别人的 id 即可冒充；必须先验证签名，并校验 exp / iss / aud 与算法白名单' },
      { key: 'C', text: 'split 的分隔符写错了，应该用逗号分隔三段' },
      { key: 'D', text: 'payload 是加密的，改了以后 Base64URL 解码会直接失败' },
    ],
    answers: ['B'],
    explanation:
      '这段代码从 parts[1] 直接解出 payload 就返回 sub，签名段 parts[2] 从头到尾没被使用，等于把身份完全交给客户端自报。攻击者把 sub 换成任意用户 id、重新 Base64URL 编码拼回去即可冒充，服务端照单全收。B 正确：必须先用公钥/密钥验签（并限制算法白名单），再校验 exp、nbf、iss、aud，之后才能信任 claim。A 错在 TLS 只保护传输过程不被窃听篡改，防不了「客户端自己构造一个合法格式的请求」。C 错在 JWT 三段本来就是用点号分隔，split 写成字符类 [.] 是按点号切分，没有错。D 错在 payload 只是编码不是加密，任何人都能解码与重新编码。',
  },
]
