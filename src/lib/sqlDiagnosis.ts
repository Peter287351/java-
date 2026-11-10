/* SQL 报错归因：把 SQLite 原始报错翻译成「错在哪」的中文提示。
   纯函数、不依赖 sql.js 与 WASM，可单独校验。 */
import type { SqlDataset } from '@/types'

export interface SqlErrorContext {
  /** 用户提交的 SQL（用于分析 FROM / JOIN 用了哪些表） */
  sql?: string
  /** 本题的数据集（提供表结构，用于区分「表名选错」与「列名拼错」） */
  dataset?: SqlDataset
}

/** FROM 表名后面常被误当成别名的关键字 */
const CLAUSE_WORDS = new Set([
  'where', 'group', 'order', 'having', 'limit', 'offset', 'on', 'join',
  'left', 'right', 'inner', 'outer', 'cross', 'full', 'union', 'select',
  'with', 'and', 'or', 'as', 'set', 'using', 'when', 'then', 'else',
])

/** 把字符串字面量换成等长空格：避免 'a;b'、'from emp' 里的字符干扰结构分析 */
export function stripStringLiterals(sql: string): string {
  return sql.replace(/'(?:''|[^'])*'/g, (s) => ' '.repeat(s.length))
}

/** 按顶层逗号切分（忽略括号内的逗号与字符串里的逗号） */
function splitTopLevel(body: string): string[] {
  const clean = stripStringLiterals(body)
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === '(') depth++
    else if (clean[i] === ')') depth--
    else if (clean[i] === ',' && depth === 0) {
      out.push(body.slice(start, i))
      start = i + 1
    }
  }
  out.push(body.slice(start))
  return out
}

/** 从 CREATE TABLE 语句解析出「表 -> 列名」；括号配平，兼容列类型里带括号的写法 */
export function parseSchema(ddl: string): Map<string, string[]> {
  const schema = new Map<string, string[]>()
  const clean = stripStringLiterals(ddl)
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?["'`]?([\w]+)["'`]?\s*\(/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(clean)) !== null) {
    let depth = 1
    let i = re.lastIndex
    for (; i < clean.length && depth > 0; i++) {
      if (clean[i] === '(') depth++
      else if (clean[i] === ')') depth--
    }
    const body = ddl.slice(re.lastIndex, Math.max(re.lastIndex, i - 1))
    const cols: string[] = []
    for (const part of splitTopLevel(body)) {
      const name = part.trim().replace(/^["'`]/, '').match(/^([\w]+)/)?.[1]?.toLowerCase()
      if (name && !/^(primary|unique|check|foreign|constraint)$/.test(name)) cols.push(name)
    }
    schema.set(m[1].toLowerCase(), cols)
    re.lastIndex = i
  }
  return schema
}

/** 提取用户 SQL 里 FROM / JOIN 引用的真实表名与表别名（支持逗号分隔多表） */
export function referencedTables(sql: string, schema: Map<string, string[]>) {
  const clean = stripStringLiterals(sql)
  const tables = new Set<string>()
  const aliases = new Set<string>()

  const add = (word: string | undefined, alias: string | undefined) => {
    const t = (word ?? '').toLowerCase()
    if (schema.has(t)) {
      tables.add(t)
      aliases.add(t)
    }
    const a = (alias ?? '').toLowerCase()
    if (a && !CLAUSE_WORDS.has(a) && !schema.has(a)) aliases.add(a)
  }

  // FROM 段到下一个子句关键字为止，内部按顶层逗号切成一块块「表 [别名]」
  const fromSeg =
    /\bfrom\s+([\s\S]*?)(?=\bwhere\b|\bgroup\b|\border\b|\bhaving\b|\blimit\b|\bunion\b|\bjoin\b|$)/i.exec(
      clean,
    )?.[1] ?? ''
  for (const item of splitTopLevel(fromSeg)) {
    const m = item
      .trim()
      .match(/^["'`]?([\w]+)["'`]?(?:\s+(?:as\s+)?["'`]?([\w]+)["'`]?)?/i)
    if (m) add(m[1], m[2])
  }
  // JOIN 后面的「表 [别名]」
  for (const m of clean.matchAll(
    /\bjoin\s+["'`]?([\w]+)["'`]?(?:\s+(?:as\s+)?["'`]?([\w]+)["'`]?)?/gi,
  )) {
    add(m[1], m[2])
  }
  return { tables, aliases }
}

/** 编辑距离，用于给拼错的表名一个「你是不是想写…」的建议 */
function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
  }
  return dp[a.length][b.length]
}

function closest(name: string, candidates: string[]): string | null {
  let best: string | null = null
  let bestDist = Infinity
  for (const c of candidates) {
    const d = editDistance(name.toLowerCase(), c.toLowerCase())
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  if (!best) return null
  // 除了「差一两个字母」，也认「多打了几个字母」：emplyee → emp
  const n = name.toLowerCase()
  const partial = n.includes(best) || best.includes(n)
  return bestDist <= 2 || (partial && n.length >= 3 && bestDist <= 4) ? best : null
}

/** 把 SQLite 报错翻译成「错在哪」的提示（含语句搭配规则） */
export function explainSqlError(err: string, ctx: SqlErrorContext = {}): string {
  // 输入校验产生的中文提示不是 SQLite 报错，必须原样透传，否则会被兜底文案吞掉
  if (/^(请输入 SQL|本练习只接受|只能提交一条)/.test(err)) return err
  const m = err.toLowerCase()
  const schema = ctx.dataset ? parseSchema(ctx.dataset.ddl) : new Map<string, string[]>()
  const tableList = [...schema.keys()]

  if (/no such table:\s*(\S+)/.test(m)) {
    const bad = (/no such table:\s*([^\s:;,]+)/i.exec(err)?.[1] ?? '').replace(/["'`]/g, '')
    const guess = closest(bad, tableList)
    return `表名 "${bad}" 写错或不存在${guess ? `，你是不是想写 "${guess}"` : ''}${
      tableList.length ? `。本题可用表：${tableList.join('、')}` : '。注意题目给定的表名大小写与拼写'
    }。`
  }

  if (/no such column:\s*(\S+)/.test(m)) {
    // 报错列可能带别名前缀（e.salary），也可能带引号
    const raw = (/no such column:\s*([^\s]+)/i.exec(err)?.[1] ?? '').replace(/["'`]/g, '')
    const seg = raw.split('.')
    const qualifier = seg.length > 1 ? seg[0].toLowerCase() : null
    const col = seg[seg.length - 1].toLowerCase()
    const ref = ctx.sql ? referencedTables(ctx.sql, schema) : null
    const owners = tableList.filter((t) => (schema.get(t) ?? []).includes(col))
    const fromTables = ref ? [...ref.tables] : []

    // 1) 写了「别名.列」但别名根本没定义 → 漏 JOIN 或别名拼错
    if (qualifier && ref && !ref.aliases.has(qualifier) && !schema.has(qualifier)) {
      const ownerHint = owners.length ? `列 "${col}" 在表 ${owners.join('、')} 里，` : ''
      return `表别名 "${qualifier}" 没有定义：${ownerHint}检查 FROM / JOIN 是否漏了这张表，或别名拼写不对。跨表取列要先 JOIN 并给表起别名。`
    }

    // 2) 列确实存在，但不在 FROM 的表里 → 是「表选错」而不是「列名拼错」
    //    例：SELECT name, salary FROM dept（salary 在 emp 表里）
    if (schema.size && owners.length && fromTables.length && !owners.some((t) => fromTables.includes(t))) {
      return `表名用错了：你 FROM 的是 ${fromTables.join('、')}，但列 "${col}" 不在这张表里，它在 ${owners.join('、')} 表里。检查题目要查哪张表（本题可用表：${tableList.join('、')}）。`
    }

    // 3) 数据集里根本没有这一列 → 才是真的列名拼错
    const tail = tableList.length ? ` 本题可用表：${tableList.join('、')}。` : ''
    return `列 "${col}" 不存在：检查列名拼写；跨表取列别忘了 JOIN 并给表起别名。${tail}`
  }

  if (/misuse of aggregate|aggregate functions are not allowed/.test(m))
    return '聚合函数（SUM/COUNT/MAX…）不能出现在 WHERE 里——WHERE 在分组前执行，过滤聚合结果要搭配 HAVING，或先包一层子查询。'
  if (/must appear in the group by|non-aggregate/.test(m))
    return 'SELECT 的非聚合列必须与 GROUP BY 搭配：该列要么加进 GROUP BY，要么套上聚合函数——否则引擎不知道该显示哪一组的值。'
  if (/a group by clause is required before having/.test(m))
    return 'HAVING 必须与 GROUP BY 搭配使用（或对整表聚合）：它过滤的是「分组后的聚合结果」，过滤原始行请用 WHERE。'
  if (/order by term does not match|second order by term/.test(m))
    return 'ORDER BY 引用了 SELECT 之外的列：使用 DISTINCT（或聚合查询）时，ORDER BY 的列必须出现在 SELECT 清单里。'
  if (/no such function:\s*(\S+)/.test(m)) {
    const fn = /no such function:\s*(\S+)/i.exec(err)?.[1] ?? ''
    return `函数 ${fn} 不存在：判分引擎内置 DATEDIFF(a,b)（返回 a-b 天数）与标准 SQL 函数（substr/COALESCE/IFNULL/CASE WHEN）；MySQL 的 DATE_FORMAT/DATE_ADD/IF 等请改用等价写法。`
  }
  if (/wrong number of arguments to function/.test(m))
    return '函数参数个数不对：核对函数签名（如 substr(字符串, 起始, 长度) 从 1 开始计数）。'
  if (/syntax error/.test(m)) {
    const near = /near "([^"]+)"/i.exec(err)?.[1]
    return near ? `语法错误，出错位置在 "${near}" 附近：检查逗号、引号、括号与关键字拼写。` : '语法错误：检查逗号、引号、括号与关键字拼写。'
  }
  if (/ambiguous column name/.test(m))
    return '列名在多张表中都存在产生歧义：给同名列加上「表别名.列名」。'
  if (/only accepts select|一条查询语句/.test(err)) return err
  return '执行报错：请对照错误信息检查 SQL。'
}
