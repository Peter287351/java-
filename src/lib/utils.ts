export function dateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 选项集合判分：顺序无关、完全一致 */
export function setEquals(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const s = new Set(b)
  return a.every((x) => s.has(x))
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

/** 计时器用：不足 1 小时显示 mm:ss，超过显示 h:mm:ss */
export function formatClock(total: number): string {
  const s = Math.max(0, Math.floor(total))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** 统计卡片用：2 小时 15 分 / 45 分钟 / 42 秒 */
export function formatStudyTime(total: number): string {
  const s = Math.max(0, Math.floor(total))
  if (s < 60) return `${s} 秒`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h} 小时 ${m} 分` : `${h} 小时`
  return `${m} 分钟`
}

/** 把 Markdown 题干压成一行纯文本用于列表预览 */
export function plainText(md: string, limit = 90): string {
  const t = md
    .replace(/~~~[\s\S]*?~~~/g, '[代码]')
    .replace(/[#>*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > limit ? t.slice(0, limit) + '…' : t
}
