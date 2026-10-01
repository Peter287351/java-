// 手写 SQL 题库校验：
//  1. 每题参考答案在真实 SQLite 引擎中执行成功且返回数据
//  2. 备用解法（alts）与参考答案结果集完全一致（双重验证参考答案正确性）
//  3. 重复执行结果一致（确定性）
//  4. 打印每题完整结果供人工核对题意
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import initSqlJs from 'sql.js'

const errors = []

/** 去掉 import type 行后加载 TS 导出（Node 24 原生类型剥离） */
async function loadTs(relPath, exportName) {
  const src = readFileSync(new URL(relPath, import.meta.url), 'utf-8').replace(
    /^import\s+type[^\n]*$/gm,
    '',
  )
  const tmp = join(tmpdir(), `hds-sql-${Math.random().toString(36).slice(2)}.ts`)
  writeFileSync(tmp, src, 'utf-8')
  try {
    const mod = await import(pathToFileURL(tmp).href)
    return mod[exportName]
  } finally {
    rmSync(tmp, { force: true })
  }
}

const datasets = await loadTs('../src/content/sql/datasets.ts', 'sqlDatasets')
const exercises = await loadTs('../src/content/sql/exercises.ts', 'sqlExercises')
const datasetMap = new Map(datasets.map((d) => [d.id, d]))

const SQL = await initSqlJs()
function freshDb(dataset) {
  const db = new SQL.Database()
  db.create_function('DATEDIFF', (a, b) => {
    const da = Date.parse(String(a) + 'T00:00:00Z')
    const dbb = Date.parse(String(b) + 'T00:00:00Z')
    if (Number.isNaN(da) || Number.isNaN(dbb)) return null
    return Math.round((da - dbb) / 86400000)
  })
  db.run(dataset.ddl)
  return db
}

function normRows(res) {
  if (!res.length) return { columns: [], rows: [] }
  const cols = res[0].columns
  const rows = res[0].values.map((r) =>
    r.map((v) => {
      if (v === null || v === undefined) return 'NULL'
      if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(6)))
      return String(v)
    }),
  )
  return { columns: cols, rows }
}

function runSql(db, sql) {
  return normRows(db.exec(sql))
}

function sameResult(a, b, orderMatters) {
  if (a.rows.length !== b.rows.length) return false
  if (a.columns.length !== b.columns.length) return false
  const cmp = (x, y) => JSON.stringify(x) === JSON.stringify(y)
  if (orderMatters) return a.rows.every((r, i) => cmp(r, b.rows[i]))
  const sa = [...a.rows].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))
  const sb = [...b.rows].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))
  return sa.every((r, i) => cmp(r, sb[i]))
}

console.log(`===== 手写 SQL 题库校验（${exercises.length} 题）=====`)
for (const ex of exercises) {
  const ds = datasetMap.get(ex.datasetId)
  if (!ds) {
    errors.push(`${ex.id}: 数据集 ${ex.datasetId} 不存在`)
    continue
  }
  let ref
  try {
    const db = freshDb(ds)
    ref = runSql(db, ex.reference)
    db.close()
  } catch (e) {
    errors.push(`${ex.id}: 参考答案执行失败 → ${e.message}`)
    continue
  }
  if (!ref.rows.length) {
    errors.push(`${ex.id}: 参考答案返回 0 行（题目设计应保证有数据）`)
    continue
  }
  // 确定性：再跑一次
  try {
    const db2 = freshDb(ds)
    const ref2 = runSql(db2, ex.reference)
    db2.close()
    if (!sameResult(ref, ref2, ex.orderMatters)) errors.push(`${ex.id}: 两次执行结果不一致（非确定性）`)
  } catch (e) {
    errors.push(`${ex.id}: 二次执行失败 → ${e.message}`)
  }
  // 备用解法
  for (let i = 0; i < (ex.alts ?? []).length; i++) {
    try {
      const db3 = freshDb(ds)
      const alt = runSql(db3, ex.alts[i])
      db3.close()
      if (!sameResult(ref, alt, ex.orderMatters))
        errors.push(
          `${ex.id}: 备用解法#${i + 1} 与参考答案结果不一致\n  参考: ${JSON.stringify(ref.rows)}\n  备选: ${JSON.stringify(alt.rows)}`,
        )
    } catch (e) {
      errors.push(`${ex.id}: 备用解法#${i + 1} 执行失败 → ${e.message}`)
    }
  }
  console.log(`\n【${ex.id}】${ex.title}（${ds.name}，${ref.rows.length} 行 × ${ref.columns.length} 列）`)
  console.log(`  列: ${ref.columns.join(' | ')}`)
  for (const r of ref.rows) console.log(`  ${r.join(' | ')}`)
}

console.log(`\n===== 校验完成 =====`)
if (errors.length) {
  console.log(`错误 ${errors.length} 条:`)
  errors.forEach((e) => console.log('  ✗ ' + e))
  process.exit(1)
}
console.log(`✓ 全部 ${exercises.length} 题参考答案执行成功，备用解法全部与参考答案一致`)
