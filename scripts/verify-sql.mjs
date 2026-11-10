// SQL 模块回归测试（不依赖浏览器 / WASM 在浏览器里的加载方式）：
//   1. 输入校验 guardUserSql 的边界情况
//   2. 结果比对 compareResults 的分类与容错
//   3. 报错归因 explainSqlError（含真实 SQLite 引擎跑出来的原始报错）
//   4. 表结构解析 parseSchema / FROM-JOIN 解析 referencedTables
//   5. 题库结构、常见错误正则 commonMistakes
//   6. 全部题目参考答案在真实引擎上可执行且有数据
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../package.json', import.meta.url))
const initSqlJs = require('sql.js')

/** 借 Node 原生类型剥离直接加载项目里的 .ts 纯逻辑 */
async function loadTs(relPath, transform = (s) => s) {
  const src = transform(readFileSync(new URL(relPath, import.meta.url), 'utf8')).replace(
    /^import\s+type[^\n]*$/gm,
    '',
  )
  const tmp = join(tmpdir(), `hds-verify-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`)
  writeFileSync(tmp, src, 'utf-8')
  try {
    return await import(pathToFileURL(tmp).href)
  } finally {
    rmSync(tmp, { force: true })
  }
}

const diag = await loadTs('../src/lib/sqlDiagnosis.ts')
const datasets = (await loadTs('../src/content/sql/datasets.ts')).sqlDatasets
const exercises = (await loadTs('../src/content/sql/exercises.ts')).sqlExercises

// sqlRunner.ts 依赖 WASM，这里把两个浏览器专用 import 换成测试桩，只取纯函数
const runner = await loadTs('../src/lib/sqlRunner.ts', (s) =>
  s
    .replace(/^import initSqlJs.*$/gm, 'const initSqlJs = async () => { throw new Error("测试桩") }')
    .replace(/^import wasmUrl.*$/gm, 'const wasmUrl = ""')
    .replace(
      /^import \{ stripStringLiterals \}.*$/gm,
      `const stripStringLiterals = ${diag.stripStringLiterals.toString()}`,
    )
    .replace(/^export \{ explainSqlError \}.*$/gm, '')
    .replace(/^export type \{ SqlErrorContext \}.*$/gm, ''),
)

const { explainSqlError, stripStringLiterals, parseSchema, referencedTables } = diag
const { guardUserSql, compareResults, findMistakeHint } = runner
const datasetMap = new Map(datasets.map((d) => [d.id, d]))
const hr = datasetMap.get('hr')
const ops = datasetMap.get('ops')

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
function realError(dataset, sql) {
  const db = freshDb(dataset)
  let err = null
  try {
    db.exec(sql)
  } catch (e) {
    err = e.message
  }
  db.close()
  return err
}

let passed = 0
const failures = []
function check(name, cond, detail = '') {
  if (cond) {
    passed++
    console.log('  ✓ ' + name)
  } else {
    failures.push(`${name}${detail ? ' → ' + detail : ''}`)
    console.log('  ✗ ' + name + (detail ? ' → ' + detail : ''))
  }
}
function group(title) {
  console.log(`\n--- ${title} ---`)
}

/* ---------- 1. 输入校验 ---------- */
group('输入校验 guardUserSql')
check('空 SQL 被拦下', guardUserSql('   ') === '请输入 SQL 后再运行')
check('非 SELECT 被拦下', guardUserSql('DELETE FROM emp') === '本练习只接受 SELECT / WITH 查询语句')
check('多条语句被拦下', /一条查询语句/.test(guardUserSql('SELECT 1; SELECT 2') ?? ''))
check('字符串里的分号不误判', guardUserSql("SELECT name FROM emp WHERE name = 'a;b';") === null)
check('合法 SELECT 放行', guardUserSql('SELECT * FROM emp;') === null)
check('合法 WITH 放行', guardUserSql('WITH x AS (SELECT 1) SELECT * FROM x;') === null)

/* ---------- 2. 校验提示原样透传（曾被测错兜底吞掉） ---------- */
group('报错归因 explainSqlError · 校验提示')
for (const msg of [
  '请输入 SQL 后再运行',
  '本练习只接受 SELECT / WITH 查询语句',
  '只能提交一条查询语句（去掉多余的分号）',
]) {
  check(`原样返回：${msg.slice(0, 10)}`, explainSqlError(msg) === msg)
}

/* ---------- 3. 真实引擎报错归因 ---------- */
group('报错归因 explainSqlError · 真实 SQLite 报错')
const shotSql = 'SELECT name,salary FROM dept WHERE salary > 10000 ORDER BY salary DESC,name ASC;'
const shotErr = realError(hr, shotSql)
check('截图场景能取到原始报错', shotErr === 'no such column: salary', shotErr ?? '')
const shotMsg = explainSqlError(shotErr ?? '', { sql: shotSql, dataset: hr })
check('截图场景判为「表名用错」', shotMsg.includes('表名用错了') && shotMsg.includes('emp'), shotMsg)
check('截图场景不再说「列名拼错」', !shotMsg.includes('列 "salary" 不存在'), shotMsg)

const typoErr = realError(hr, 'SELECT * FROM emplyee')
const typoMsg = explainSqlError(typoErr ?? '', { sql: 'SELECT * FROM emplyee', dataset: hr })
check('表名拼错给出候选与可用表', typoMsg.includes('你是不是想写') && typoMsg.includes('本题可用表'), typoMsg)

const colErr = realError(hr, 'SELECT salry FROM emp')
const colMsg = explainSqlError(colErr ?? '', { sql: 'SELECT salry FROM emp', dataset: hr })
check('真·列名拼错判为列名问题', colMsg.includes('列名拼写') && !colMsg.includes('表名用错了'), colMsg)

const aliasErr = realError(hr, 'SELECT d.name FROM emp')
const aliasMsg = explainSqlError(aliasErr ?? '', { sql: 'SELECT d.name FROM emp', dataset: hr })
check('漏 JOIN 判为别名未定义', aliasMsg.includes('别名'), aliasMsg)

const opsSql = 'SELECT latency_ms FROM heartbeat'
const opsErr = realError(ops, opsSql)
const opsMsg = explainSqlError(opsErr ?? '', { sql: opsSql, dataset: ops })
check('ops 三表结构解析正确', opsMsg.includes('表名用错了') && opsMsg.includes('service_log'), opsMsg)

check(
  '无上下文时保持旧提示（向后兼容）',
  !explainSqlError('no such column: salary').includes('表名用错了'),
)
check('聚合误用提示 HAVING', explainSqlError('misuse of aggregate: SUM()').includes('HAVING'))
check('语法错误提示出错位置', explainSqlError('near "FORM": syntax error').includes('语法错误'))

/* ---------- 4. 表结构 / FROM 解析 ---------- */
group('表结构与 FROM 解析')
const hrSchema = parseSchema(hr.ddl)
check('hr 解析出 2 张表', hrSchema.size === 2)
check('emp 含 salary 列', (hrSchema.get('emp') ?? []).includes('salary'))
const opsSchema = parseSchema(ops.ddl)
check('ops 解析出 3 张表', opsSchema.size === 3)
check('service_log 含 trace_id 列', (opsSchema.get('service_log') ?? []).includes('trace_id'))
const tricky = parseSchema("CREATE TABLE m(id INTEGER, price DECIMAL(10,2), note TEXT DEFAULT 'a,b');")
check(
  '带括号列类型与字符串逗号不乱切',
  (tricky.get('m') ?? []).join(',') === 'id,price,note',
  (tricky.get('m') ?? []).join(','),
)
const commaRef = referencedTables('SELECT * FROM emp e, dept d WHERE e.dept_id = d.id', hrSchema)
check('逗号分隔多表都识别', commaRef.tables.has('emp') && commaRef.tables.has('dept'))
check('逗号分隔多表别名都识别', commaRef.aliases.has('e') && commaRef.aliases.has('d'))
const joinRef = referencedTables('SELECT * FROM emp e JOIN dept d ON e.dept_id = d.id', hrSchema)
check('JOIN 表与别名识别', joinRef.tables.has('dept') && joinRef.aliases.has('d'))
check(
  '字符串里的 from 不误判成表',
  !referencedTables("SELECT 'from dept' FROM emp", hrSchema).tables.has('dept'),
)
check('字符串字面量被抹掉', !stripStringLiterals("WHERE x = 'a;b'").includes(';'))

/* ---------- 5. 结果比对 ---------- */
group('结果比对 compareResults')
const ok = (columns, rows) => ({ ok: true, columns, rows })
const base = ok(['a', 'b'], [['1', '2'], ['3', '4']])
check('完全一致通过', compareResults(base, ok(['x', 'y'], [['1', '2'], ['3', '4']]), true).pass)
check(
  '列数不符 → col-count',
  compareResults(base, ok(['a'], [['1'], ['3']]), true).category === 'col-count',
)
check(
  '行数不符 → row-count',
  compareResults(base, ok(['a', 'b'], [['1', '2']]), true).category === 'row-count',
)
const reversed = ok(['a', 'b'], [['3', '4'], ['1', '2']])
check('要求有序时顺序错判失败', !compareResults(base, reversed, true).pass)
check('不要求有序时顺序错仍通过', compareResults(base, reversed, false).pass)
const swappedCols = compareResults(ok(['a', 'b'], [['1', '2']]), ok(['a', 'b'], [['2', '1']]), false)
check('仅列顺序不同容错通过并给备注', swappedCols.pass && Boolean(swappedCols.note))
check(
  '值不同 → value',
  compareResults(base, ok(['a', 'b'], [['1', '9'], ['3', '4']]), true).category === 'value',
)

/* ---------- 6. 题库结构与错因正则 ---------- */
group('题库结构与 commonMistakes')
check('题目 id 全局唯一', new Set(exercises.map((e) => e.id)).size === exercises.length)
check('每题 datasetId 都存在', exercises.every((e) => datasetMap.has(e.datasetId)))
check('每题都有题干 / 答案 / 提示', exercises.every((e) => e.stem && e.reference && e.hints.length > 0))
let badRegex = []
for (const ex of exercises) {
  for (const mk of ex.commonMistakes ?? []) {
    try {
      new RegExp(mk.pattern, 'i')
    } catch (e) {
      badRegex.push(`${ex.id}: ${e.message}`)
    }
  }
}
check('所有常见错误正则可编译', badRegex.length === 0, badRegex.join('; '))
const mistakeSamples = {
  'sql-026': 'SELECT level, COUNT(*) FROM service_log GROUP BY level',
  'sql-030': "SELECT d.service FROM deploy d JOIN service_log l ON l.service = d.service WHERE l.level = 'ERROR'",
  'sql-031': "SELECT host FROM heartbeat WHERE status <> 'OK'",
}
for (const [id, sample] of Object.entries(mistakeSamples)) {
  const ex = exercises.find((e) => e.id === id)
  check(`${id} 错误写法能命中提示`, Boolean(findMistakeHint(sample, ex?.commonMistakes)))
}
const ex030 = exercises.find((e) => e.id === 'sql-030')
check(
  'sql-030 正确写法不被误判',
  findMistakeHint(ex030.reference, ex030.commonMistakes) === null,
)

/* ---------- 7. 界面 / 文档与题库的一致性（防止加题后忘了同步） ---------- */
group('界面与文档一致性')
const opsTables = [...ops.ddl.matchAll(/CREATE TABLE (\w+)/g)].map((m) => m[1])
check('ops 表结构面板能列出 3 张表', opsTables.length === 3, opsTables.join(','))
const dashSrc = readFileSync(new URL('../src/views/DashboardView.vue', import.meta.url), 'utf8')
const moduleSrc = readFileSync(new URL('../src/views/ModuleView.vue', import.meta.url), 'utf8')
const readmeSrc = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
const indexSrc = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
check('首页题数动态取值且无写死的 /16', dashSrc.includes('sqlExercises.length') && !/\/16\b/.test(dashSrc))
check('模块页题数动态取值且无写死的 /16', moduleSrc.includes('sqlExercises.length') && !/\/16\b/.test(moduleSrc))
check(
  'README 的 SQL 题数与题库一致',
  readmeSrc.includes(`${exercises.length} 道手写 SQL`),
  `题库 ${exercises.length} 题`,
)
const essenceCount = /\b(\d+) 道精讲题/.exec(readmeSrc)?.[1]
check(
  '首页分享描述的精讲题数与 README 一致',
  Boolean(essenceCount) && indexSrc.includes(`${essenceCount} 道精讲题`),
  `README 写的精讲题数：${essenceCount ?? '未找到'}`,
)
check(
  '首页分享描述的 SQL 题数与题库一致',
  indexSrc.includes(`${exercises.length} 道手写 SQL`),
  `题库 ${exercises.length} 题`,
)

/* ---------- 8. 全部题目参考答案真实可执行 ---------- */
group('真实引擎执行全部题目')
const refFailures = []
for (const ex of exercises) {
  const db = freshDb(datasetMap.get(ex.datasetId))
  try {
    const res = db.exec(ex.reference)
    if (!res.length || !res[0].values.length) refFailures.push(`${ex.id}: 返回 0 行`)
  } catch (e) {
    refFailures.push(`${ex.id}: ${e.message}`)
  } finally {
    db.close()
  }
}
check(`全部 ${exercises.length} 题参考答案可执行且有数据`, refFailures.length === 0, refFailures.join('; '))

console.log(`\n===== SQL 模块回归测试：${passed} 项通过 / ${failures.length} 项失败 =====`)
if (failures.length) {
  failures.forEach((f) => console.log('  ✗ ' + f))
  process.exit(1)
}
console.log('✓ 全部通过')
