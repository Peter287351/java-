/* 手写 SQL 判分引擎：内嵌 SQLite（sql.js WASM）沙箱执行 + 结果集比对 */
import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { SqlDataset } from '@/types'

type SqlJsModule = Awaited<ReturnType<typeof initSqlJs>>
type Db = InstanceType<SqlJsModule['Database']>

let sqlPromise: Promise<SqlJsModule> | null = null

async function getSql(): Promise<SqlJsModule> {
  sqlPromise ??= initSqlJs({ locateFile: () => wasmUrl })
  return sqlPromise
}

export interface RunOutcome {
  ok: boolean
  /** 失败原因（引擎原始信息） */
  error?: string
  columns: string[]
  rows: string[][]
}

/** 把单元格统一成可比较的规范字符串 */
function normCell(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(6)))
  }
  if (typeof v === 'number' || typeof v === 'bigint') return String(v)
  if (v instanceof Uint8Array) return '<blob>'
  return String(v)
}

/** 校验用户输入：只允许单条 SELECT/WITH 查询，防止破坏性语句 */
export function guardUserSql(sql: string): string | null {
  const t = sql.trim()
  if (!t) return '请输入 SQL 后再运行'
  if (!/^(select|with)\b/i.test(t)) return '本练习只接受 SELECT / WITH 查询语句'
  const body = t.replace(/;\s*$/, '')
  if (body.includes(';')) return '只能提交一条查询语句（去掉多余的分号）'
  return null
}

/** 每次判分都新建独立内存库：互不污染，用户误写 DROP 也无影响 */
async function freshDb(dataset: SqlDataset): Promise<Db> {
  const SQL = await getSql()
  const db = new SQL.Database()
  db.create_function('DATEDIFF', (a: unknown, b: unknown) => {
    const da = Date.parse(String(a) + 'T00:00:00Z')
    const dbb = Date.parse(String(b) + 'T00:00:00Z')
    if (Number.isNaN(da) || Number.isNaN(dbb)) return null
    return Math.round((da - dbb) / 86400000)
  })
  db.run(dataset.ddl)
  return db
}

function execRows(db: Db, sql: string): RunOutcome {
  try {
    const res = db.exec(sql)
    if (!res.length) return { ok: true, columns: [], rows: [] }
    return {
      ok: true,
      columns: res[0].columns,
      rows: res[0].values.map((r: unknown[]) => r.map(normCell)),
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), columns: [], rows: [] }
  }
}

export async function runOnDataset(dataset: SqlDataset, sql: string): Promise<RunOutcome> {
  const guard = guardUserSql(sql)
  if (guard) return { ok: false, error: guard, columns: [], rows: [] }
  let db: Db | null = null
  try {
    db = await freshDb(dataset)
    return execRows(db, sql)
  } finally {
    db?.close()
  }
}

/* ---------- 结果比对与错误归因 ---------- */

export interface CompareResult {
  pass: boolean
  /** 通过时的备注（如列顺序不同） */
  note?: string
  /** 失败时的分类与说明 */
  category?: 'syntax' | 'row-count' | 'col-count' | 'value' | 'other'
  message?: string
  /** 第一个不一致的位置（1 基，按比对顺序） */
  diffRow?: number
  diffCol?: number
  expectedCell?: string
  actualCell?: string
}

export function compareResults(
  expected: RunOutcome,
  actual: RunOutcome,
  orderMatters: boolean,
): CompareResult {
  if (expected.columns.length !== actual.columns.length) {
    return {
      pass: false,
      category: 'col-count',
      message: `列数不符：期望 ${expected.columns.length} 列，你的查询返回 ${actual.columns.length} 列。检查 SELECT 的列清单是否与题目要求一致。`,
    }
  }
  if (expected.rows.length !== actual.rows.length) {
    const hint =
      actual.rows.length > expected.rows.length
        ? '你的结果偏多：常见原因是 JOIN 产生重复/笛卡尔积、缺少过滤条件，或该用 LEFT JOIN 的地方数据被放大。'
        : '你的结果偏少：常见原因是过滤条件过严、误用 DISTINCT、或漏掉了需要保留的行（如未下单客户/无部门员工）。'
    return {
      pass: false,
      category: 'row-count',
      message: `行数不符：期望 ${expected.rows.length} 行，你的查询返回 ${actual.rows.length} 行。${hint}`,
    }
  }
  const rowsEqual = (a: string[], b: string[]) => a.every((c, i) => c === b[i])

  if (orderMatters) {
    for (let i = 0; i < expected.rows.length; i++) {
      if (!rowsEqual(expected.rows[i], actual.rows[i])) {
        const col = expected.rows[i].findIndex((c, j) => c !== actual.rows[i][j])
        return {
          pass: false,
          category: 'value',
          message: `第 ${i + 1} 行数据不一致${col >= 0 ? `（第 ${col + 1} 列：期望 ${expected.rows[i][col]}，实际 ${actual.rows[i][col]}）` : ''}。题目要求按指定顺序输出，请检查 ORDER BY 与 SELECT 列的取值。`,
          diffRow: i + 1,
          diffCol: col + 1,
          expectedCell: col >= 0 ? expected.rows[i][col] : undefined,
          actualCell: col >= 0 ? actual.rows[i][col] : undefined,
        }
      }
    }
    return { pass: true }
  }

  const key = (r: string[]) => JSON.stringify(r)
  const sortRows = (rows: string[][]) => [...rows].sort((x, y) => key(x).localeCompare(key(y)))
  const e = sortRows(expected.rows)
  const a = sortRows(actual.rows)
  for (let i = 0; i < e.length; i++) {
    if (!rowsEqual(e[i], a[i])) {
      // 容错：整行仅列顺序不同（各单元格多重集一致）→ 视为通过并提示
      const sortedRow = (r: string[]) => [...r].sort((x, y) => x.localeCompare(y))
      const eSorted = sortRows(e.map(sortedRow)).map(key)
      const aSorted = sortRows(a.map(sortedRow)).map(key)
      if (JSON.stringify(eSorted) === JSON.stringify(aSorted)) {
        return { pass: true, note: '你的结果与参考答案数据一致，仅列的顺序不同（不影响判分）' }
      }
      const col = e[i].findIndex((c, j) => c !== a[i][j])
      return {
        pass: false,
        category: 'value',
        message: `数据不一致：第 ${i + 1} 个不匹配的行中，期望 ${e[i].join(' / ')}，实际 ${a[i].join(' / ')}。请检查聚合列、连接条件或过滤条件。`,
        diffRow: i + 1,
        diffCol: col + 1,
        expectedCell: col >= 0 ? e[i][col] : undefined,
        actualCell: col >= 0 ? a[i][col] : undefined,
      }
    }
  }
  return { pass: true }
}

/** 把 SQLite 报错翻译成"错在哪"的提示 */
export function explainSqlError(err: string): string {
  const m = err.toLowerCase()
  if (/no such table:\s*(\S+)/.test(m))
    return `表名写错或不存在（${/no such table:\s*(\S+)/i.exec(err)?.[1]}）。注意题目给定的表名大小写与拼写。`
  if (/no such column:\s*(\S+)/.test(m)) {
    const col = /no such column:\s*(\S+)/i.exec(err)?.[1] ?? ''
    return `列 "${col}" 不存在：检查列名拼写；跨表取列别忘了 JOIN 并给表起别名。`
  }
  if (/misuse of aggregate|aggregate functions are not allowed/.test(m))
    return '聚合函数（SUM/COUNT/MAX…）不能出现在 WHERE 里——对聚合结果的过滤要写进 HAVING，或包一层子查询。'
  if (/must appear in the group by|non-aggregate/.test(m))
    return 'SELECT 里出现了既不是聚合结果、也不在 GROUP BY 里的列——把该列加入 GROUP BY，或对它套聚合函数。'
  if (/syntax error/.test(m)) {
    const near = /near "([^"]+)"/i.exec(err)?.[1]
    return near ? `语法错误，出错位置在 "${near}" 附近：检查逗号、引号、括号与关键字拼写。` : '语法错误：检查逗号、引号、括号与关键字拼写。'
  }
  if (/ambiguous column name/.test(m))
    return '列名在多张表中都存在产生歧义：给同名列加上「表别名.列名」。'
  if (/only accepts select|一条查询语句/.test(err)) return err
  return '执行报错：请对照错误信息检查 SQL。'
}
