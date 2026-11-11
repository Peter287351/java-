/* 从解析中按选项字母切片，提取每个选项的点评（"A 是…"、"B 错在…" 等写法） */

/**
 * 选项起点：句子分隔符（含中文逗号、顿号、分号、换行）或开头，
 * 后面跟一个选项字母，字母后必须是空白 / 冒号 / 标点 / 中文。
 * 不再依赖「字母后面必须是哪些动词」的白名单 —— 题库里既有「A 是…」也有「A 只打印一次」「C 接近…」，
 * 白名单会漏掉大半，导致后面的选项点评被整段并进第一个选项。
 */
const OPTION_START =
  /(?:^|[，,、；;。！？!?\n])[ \t]*\*{0,2}([A-F])\*{0,2}(?=[ \t：:、，,;；。！？!?\n]|[\u4e00-\u9fff])/g

/** 清洗一段点评：去掉前导标点、选项字母、尾部标点与常见 Markdown 记号 */
function cleanNote(text: string): string {
  return text
    .replace(/^[ \t：:、，,;；。！？!?\n]+/, '')
    .replace(/[，,、；;。！？!?\n \t]+$/, '')
    .replace(/[`*_]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

/**
 * 返回 { A: '该选项点评', ... }，提取不到的选项不出现在结果里。
 *
 * @param explanation 题目解析原文（Markdown 自由文本）
 * @param optionKeys  本题实际存在的选项字母，例如 ['A','B','C','D']。
 *                    传了它才不会把正文里的 "A 和 B 都…"、型号里的 "B+ 树" 之类误当成点评。
 */
export function splitOptionNotes(
  explanation: string,
  optionKeys: readonly string[] = [],
): Record<string, string> {
  const notes: Record<string, string> = {}
  if (!explanation || !optionKeys.length) return notes
  const allowed = new Set(optionKeys)

  const starts: { key: string; index: number; letterEnd: number; sep: string }[] = []
  for (const m of explanation.matchAll(OPTION_START)) {
    if (!allowed.has(m[1])) continue
    const full = m[0]
    const index = m.index ?? 0
    // letterEnd 指向选项字母之后，切片从这里开始，避免点评里重复出现 "A "
    const letterEnd = index + full.lastIndexOf(m[1]) + 1
    starts.push({ key: m[1], index, letterEnd, sep: full[0] })
  }
  if (!starts.length) return notes

  // 「A、B、C 都是…」「C、D 不解决问题」这类写法：紧邻且只用顿号/逗号相连的
  // 几个字母共用同一段说明，合并成一组，避免只挂到最后一个字母上。
  const groups: { keys: string[]; start: number; letterEnd: number }[] = []
  for (const s of starts) {
    const last = groups[groups.length - 1]
    const gap = last ? explanation.slice(last.letterEnd, s.index) : ''
    const isListJoin =
      !!last &&
      /^[ \t]*$/.test(gap) &&
      /^[、,，]$/.test(s.sep) &&
      s.index - last.letterEnd <= 3
    if (isListJoin && last) {
      last.keys.push(s.key)
      last.letterEnd = s.letterEnd
    } else {
      groups.push({ keys: [s.key], start: s.index, letterEnd: s.letterEnd })
    }
  }

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]
    const to = i + 1 < groups.length ? groups[i + 1].start : explanation.length
    const text = cleanNote(explanation.slice(g.letterEnd, to))
    // 太短的多半是正文里偶然出现的字母，过长则说明没切开，都不展示
    if (text.length < 3 || text.length > 400) continue
    for (const key of g.keys) {
      if (!(key in notes)) notes[key] = text
    }
  }
  return notes
}
