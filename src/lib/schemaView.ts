/**
 * 把 sqlDatasets 里的原始 DDL 解析成「表 → 列顺序 + 数据行」，
 * 供 SQL 练习页把裸 SQL 渲染成带中文注释的可视化表格。
 * 数据仍以 ddl 为唯一来源，这里只做展示用解析，不参与判分。
 */

export interface ParsedTable {
  name: string
  /** 列名，顺序与 CREATE TABLE 中定义一致 */
  columns: string[]
  /** 数据行，每个元素是去引号后的单元格值 */
  rows: string[][]
}

/** 按顶层括号拆分多个元组 (...) ，字符串内的括号/逗号不受影响 */
function splitTopLevelTuples(body: string): string[] {
  const tuples: string[] = []
  let i = 0
  let depth = 0
  let buf = ''
  while (i < body.length) {
    const ch = body[i]
    if (ch === "'") {
      let j = i + 1
      while (j < body.length && body[j] !== "'") j++
      buf += body.slice(i, j + 1)
      i = j + 1
      continue
    }
    if (ch === '(') {
      if (depth === 0) {
        buf = ''
        depth = 1
      } else {
        buf += ch
        depth++
      }
    } else if (ch === ')') {
      depth--
      if (depth === 0) {
        tuples.push(buf)
        buf = ''
      } else {
        buf += ch
      }
    } else if (depth >= 1) {
      buf += ch
    }
    i++
  }
  return tuples
}

/** 把一个元组内部按顶层逗号拆成单元格，并去掉字符串引号 */
function splitCells(inner: string): string[] {
  const out: string[] = []
  let cur = ''
  let inStr = false
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (ch === "'") {
      inStr = !inStr
      cur += ch
    } else if (ch === ',' && !inStr) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.trim() !== '') out.push(cur.trim())
  return out.map((s) => {
    s = s.trim()
    if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1)
    return s
  })
}

export function parseDataset(ddl: string): ParsedTable[] {
  const createMap = new Map<string, string[]>()
  const createRe = /CREATE\s+TABLE\s+(\w+)\s*\(([^)]*)\)/g
  let m: RegExpExecArray | null
  while ((m = createRe.exec(ddl))) {
    const name = m[1]
    const cols = m[2]
      .split(',')
      .map((c) => c.trim().split(/\s+/)[0])
      .filter(Boolean)
    createMap.set(name, cols)
  }

  const result: ParsedTable[] = []
  const insertRe = /INSERT\s+INTO\s+(\w+)\s+VALUES\s*([\s\S]*?);/g
  while ((m = insertRe.exec(ddl))) {
    const name = m[1]
    const rows = splitTopLevelTuples(m[2]).map(splitCells)
    result.push({ name, columns: createMap.get(name) ?? [], rows })
  }
  return result
}
