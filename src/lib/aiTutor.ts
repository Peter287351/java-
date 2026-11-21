/* AI 助教：OpenAI 兼容接口的流式调用（Key 只存用户浏览器，直连服务商，不经过任何中间服务器） */

export interface AiConfig {
  baseUrl: string
  apiKey: string
  model: string
}

const CFG_KEY = 'hds_ai_config'
const CACHE_KEY = 'hds_ai_cache_v1'
/** 按服务商记忆各自的 Key：额度不够换服务商时自动带出，不用翻旧记录 */
const KEY_MEMORY = 'hds_ai_keys'

export interface AiPreset {
  id: string
  label: string
  baseUrl: string
  model: string
  /** 该服务商常用的模型下拉建议（可自由输入其他值） */
  models?: string[]
}

export const AI_PRESETS: AiPreset[] = [
  {
    id: 'opencode',
    label: 'OpenCode Go（ZCode 同款网关）',
    baseUrl: 'https://opencode.ai/zen/go/v1',
    model: '',
    models: [
      'glm-5.3-flash',
      'glm-5.3',
      'kimi-k3',
      'kimi-k2.7-code',
      'deepseek-v4.1-flash',
      'deepseek-v4-pro',
      'mimo-v2.5',
    ],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek（推荐，便宜）',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'moonshot',
    label: 'Kimi / Moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  {
    id: 'qwen',
    label: '通义千问（OpenAI 兼容）',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max'],
  },
  { id: 'custom', label: '自定义（任意 OpenAI 兼容）', baseUrl: '', model: '' },
]

export function rememberKey(baseUrl: string, apiKey: string) {
  if (!baseUrl || !apiKey) return
  try {
    const raw = localStorage.getItem(KEY_MEMORY)
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    map[baseUrl] = apiKey
    localStorage.setItem(KEY_MEMORY, JSON.stringify(map))
  } catch {
    /* 记忆失败不影响主流程 */
  }
}

export function recallKey(baseUrl: string): string {
  try {
    const raw = localStorage.getItem(KEY_MEMORY)
    if (!raw) return ''
    return (JSON.parse(raw) as Record<string, string>)[baseUrl] ?? ''
  } catch {
    return ''
  }
}

export function clearKeyMemory() {
  localStorage.removeItem(KEY_MEMORY)
}

/* ---------- AI 对话记录持久化（每道题的讲解 + 追问都可回看） ---------- */

const HISTORY_KEY = 'hds_ai_history_v1'
const HISTORY_LIMIT = 100

export interface AiRecord {
  id: string
  cacheKey: string
  date: number
  /** 不含 system 消息（恢复时组件自动拼接）；system 之后的完整对话 */
  messages: ChatMessage[]
}

export function loadAiRecords(): AiRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as AiRecord[]
    return Array.isArray(list) ? list.sort((a, b) => b.date - a.date) : []
  } catch {
    return []
  }
}

export function recordsFor(cacheKey: string): AiRecord[] {
  return loadAiRecords().filter((r) => r.cacheKey === cacheKey)
}

/** 按题目聚合查询：同一题的「讲背景」与「讲答案」两阶段对话互可见 */
export function recordsForGroup(groupKey: string): AiRecord[] {
  return loadAiRecords().filter(
    (r) => r.cacheKey === groupKey || r.cacheKey.startsWith(groupKey + ':'),
  )
}

export function saveAiRecord(rec: AiRecord) {
  try {
    const list = loadAiRecords().filter((r) => r.id !== rec.id && !(r.cacheKey === rec.cacheKey && r.date === rec.date))
    list.unshift(rec)
    while (list.length > HISTORY_LIMIT) list.pop()
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    /* 存储满等异常不阻塞主流程 */
  }
}

export function deleteAiRecord(id: string) {
  try {
    const list = loadAiRecords().filter((r) => r.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    /* 同上 */
  }
}

export function getAiConfig(): AiConfig | null {
  try {
    const raw = localStorage.getItem(CFG_KEY)
    if (!raw) return null
    const cfg = JSON.parse(raw) as AiConfig
    if (cfg.baseUrl && cfg.apiKey && cfg.model) return cfg
  } catch {
    /* 配置损坏按未配置处理 */
  }
  return null
}

export function saveAiConfig(cfg: AiConfig) {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg))
}

export function clearAiConfig() {
  localStorage.removeItem(CFG_KEY)
}

/* ---------- 讲解缓存（同一题不重复花 token） ---------- */

export function getCached(cacheKey: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as Record<string, string>)[cacheKey] ?? null
  } catch {
    return null
  }
}

export function setCached(cacheKey: string, answer: string) {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    // 缓存上限：最多存 200 条，超出丢最早的
    const keys = Object.keys(map)
    if (keys.length >= 200) delete map[keys[0]]
    map[cacheKey] = answer
    localStorage.setItem(CACHE_KEY, JSON.stringify(map))
  } catch {
    /* 缓存失败不影响主流程 */
  }
}

/* ---------- Prompt：类比先行、大白话、控制篇幅 ---------- */

export const SYSTEM_PROMPT = `你是「后端修炼场」的 AI 助教，学生是零基础的后端实习生，向你提问后端知识。

【最高优先级】直接回答学生最新消息里问的那个点：
- 学生问什么，你就答什么。不许复读你之前讲过的内容，不许把话题拉回题目解析，不许套任何固定结构。
- 像技术群里答疑的学长，不像客服：不要"希望对你有帮助""总的来说"这类客套话，不要重复上一次的比喻。

【讲法】
- 学生问新概念：第一句用大白话直接下定义（一句话说清它解决什么问题），再给一个生活化类比，最后讲一句真实后端里什么时候用到。
- 学生追问刚才的内容：只展开被追问的那个点，其他一律不提。
- 学生指出了你的问题（跑题/重复/讲错）：先承认，再重新回答。

【格式】
- 默认 150~250 字，学生明确要求展开才加长。
- 术语第一次出现时，括号里给一句人话解释。
- 用自然段落，禁止"**加粗小标题**"式的模板结构。
- 只有当内容涉及流程、架构、时序、对比结构时，才在末尾附一个 mermaid 图帮助学生想象（用 \`\`\`mermaid 代码块，flowchart 或 sequenceDiagram，节点文字不超过 8 个字，**围栏必须以 \`\`\` 闭合**，代码行首不要缩进）。纯概念解释不要硬塞图。`

export function buildQuestionPrompt(payload: {
  stem: string
  options?: { key: string; text: string }[]
  answers?: string[]
  explanation?: string
}): string {
  const lines: string[] = [`【当前题目】${payload.stem}`]
  if (payload.options?.length) {
    lines.push('选项：')
    for (const o of payload.options) lines.push(`${o.key}. ${o.text}`)
  }
  if (payload.answers?.length) lines.push(`正确答案：${payload.answers.join('、')}`)
  if (payload.explanation) lines.push(`官方解析（供你参考，不用复读它）：${payload.explanation}`)
  lines.push('请针对这道题做第一次讲解：它考察什么、正确项为什么对、错误项各自错在哪。讲完就停，不要预测我接下来会问什么。')
  return lines.join('\n')
}

export function buildChapterPrompt(title: string, cardText: string): string {
  return `我要学后端的「${title}」这一章，下面的讲义我看着有点抽象。请用生活化类比 + 大白话，帮我把这一章的核心概念讲成"听一遍就能懂"的版本（400 字内），最后用一句话总结面试时会怎么问。\n\n讲义：\n${cardText.slice(0, 3000)}`
}

/* ---------- 流式调用 ---------- */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 开发/预览模式下，把已知服务商的地址改写为 Vite 代理路径（绕开浏览器 CORS 限制）。
 * 生产静态部署没有代理，仍直连——此时需要服务商本身支持 CORS（见设置页说明）。
 */
const DEV_PROXIES: [string, string][] = [
  ['https://opencode.ai', '/ai-opencode'],
  ['https://api.deepseek.com', '/ai-deepseek'],
  ['https://api.moonshot.cn', '/ai-moonshot'],
  ['https://dashscope.aliyuncs.com', '/ai-qwen'],
]

function resolveEndpoint(baseUrl: string): string {
  const clean = baseUrl.replace(/\/+$/, '')
  if (import.meta.env.DEV) {
    for (const [host, prefix] of DEV_PROXIES) {
      if (clean.startsWith(host)) return prefix + clean.slice(host.length)
    }
  }
  return clean
}

/** 流式对话：onDelta 收到增量文本；返回完整文本。中途可 AbortController 取消 */
export async function chatStream(
  cfg: AiConfig,
  messages: ChatMessage[],
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const url = resolveEndpoint(cfg.baseUrl) + '/chat/completions'
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model: cfg.model, messages, stream: true, temperature: 0.7 }),
      signal,
    })
  } catch {
    throw new Error(
      '网络请求没有到达服务商（Failed to fetch）。常见原因：① 本地使用时 npm run dev 没在运行（代理不生效）；② 线上部署时服务商不支持浏览器跨域，请改用 DeepSeek 等预设；③ 本机网络无法访问该服务商。',
    )
  }
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    throw new Error(`接口返回 ${res.status}：${text.slice(0, 200) || '无响应体'}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let full = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue
      const data = t.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }
        const delta = json.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          full += delta
          onDelta(delta)
        }
      } catch {
        /* 忽略无法解析的行（心跳/注释） */
      }
    }
  }
  return full
}
