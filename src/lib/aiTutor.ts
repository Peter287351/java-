/* AI 助教：OpenAI 兼容接口的流式调用（Key 只存用户浏览器，直连服务商，不经过任何中间服务器） */

export interface AiConfig {
  baseUrl: string
  apiKey: string
  model: string
}

const CFG_KEY = 'hds_ai_config'
const CACHE_KEY = 'hds_ai_cache_v1'

export const AI_PRESETS = [
  { id: 'deepseek', label: 'DeepSeek（推荐，便宜）', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'moonshot', label: 'Kimi / Moonshot', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { id: 'qwen', label: '通义千问（OpenAI 兼容）', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'custom', label: '自定义（任意 OpenAI 兼容）', baseUrl: '', model: '' },
]

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

export const SYSTEM_PROMPT = `你是「后端修炼场」的 AI 助教，学生是零基础的后端实习生。你的讲解必须遵守：
1. 先用 1-2 句生活化类比建立直觉（比如把 Redis 过期删除比作图书馆管理）；
2. 再用不超过 5 句话讲清概念本身；
3. 给 1 个真实工作场景，说明这个知识什么时候会用到；
4. 全程大白话，禁止连续堆砌术语，每个术语第一次出现时用括号给一句人话解释；
5. 总长度控制在 300 字以内，分 3 个小段，每段开头用一个小 emoji。
学生追问时保持同样的风格，一次只回答追问的那个点。`

export function buildQuestionPrompt(payload: {
  stem: string
  options?: { key: string; text: string }[]
  answers?: string[]
  explanation?: string
}): string {
  const lines: string[] = [`题目：${payload.stem}`]
  if (payload.options?.length) {
    lines.push('选项：')
    for (const o of payload.options) lines.push(`${o.key}. ${o.text}`)
  }
  if (payload.answers?.length) lines.push(`正确答案：${payload.answers.join('、')}`)
  if (payload.explanation) lines.push(`官方解析（供参考，讲得更通俗）：${payload.explanation}`)
  lines.push('请按系统要求，用人话给零基础学生讲解这道题在考什么、为什么这个答案对、其他选项错在哪。')
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

/** 流式对话：onDelta 收到增量文本；返回完整文本。中途可 AbortController 取消 */
export async function chatStream(
  cfg: AiConfig,
  messages: ChatMessage[],
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const url = cfg.baseUrl.replace(/\/+$/, '') + '/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, messages, stream: true, temperature: 0.7 }),
    signal,
  })
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
