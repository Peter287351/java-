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

/** 把 Markdown 题干压成一行纯文本用于列表预览 */
export function plainText(md: string, limit = 90): string {
  const t = md
    .replace(/~~~[\s\S]*?~~~/g, '[代码]')
    .replace(/[#>*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > limit ? t.slice(0, limit) + '…' : t
}
