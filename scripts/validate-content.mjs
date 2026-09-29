// 题库内容校验：直接 import questions.ts（Node 24 原生 TS 类型剥离）做数据级校验
// 用法：node scripts/validate-content.mjs [--strict]
//   --strict：把"章节目录/文件缺失"也视为错误（内容齐了以后用）
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CONTENT_ROOT = fileURLToPath(new URL('../src/content/', import.meta.url))
const STRICT = process.argv.includes('--strict')

const errors = []
const warnings = []

function err(file, msg) {
  errors.push(`${file}: ${msg}`)
}
function warn(file, msg) {
  warnings.push(`${file}: ${msg}`)
}

function listDirs(dir) {
  return readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory())
}

/** 去掉 import 行后写入临时 ts 文件，利用 Node 24 类型剥离直接拿到 questions 数组 */
async function loadQuestions(tsPath) {
  const src = readFileSync(tsPath, 'utf-8').replace(/^import\s+type[^\n]*$/gm, '')
  const tmp = join(tmpdir(), `hds-validate-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`)
  writeFileSync(tmp, src, 'utf-8')
  try {
    const mod = await import(pathToFileURL(tmp).href)
    return { questions: mod.questions ?? null, src }
  } finally {
    rmSync(tmp, { force: true })
  }
}

const TYPE_SET = new Set(['single', 'multiple', 'scenario', 'code'])
const allIds = new Map()
let totalQuestions = 0
const perModule = []
let missingContent = false

const moduleDirs = listDirs(CONTENT_ROOT).sort()

for (const mid of moduleDirs) {
  const moduleDir = join(CONTENT_ROOT, mid)
  const manifestPath = join(moduleDir, 'module.json')
  if (!existsSync(manifestPath)) {
    err(manifestPath, '缺少 module.json')
    continue
  }
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  } catch (e) {
    err(manifestPath, `JSON 解析失败: ${e.message}`)
    continue
  }
  if (manifest.id !== mid) err(manifestPath, `module.json id(${manifest.id}) 与目录名(${mid})不一致`)
  if (!Array.isArray(manifest.chapters) || !manifest.chapters.length)
    err(manifestPath, 'chapters 为空')

  const chapterIds = (manifest.chapters ?? []).map((c) => c.id)
  const actualDirs = listDirs(moduleDir)
  for (const d of actualDirs)
    if (!chapterIds.includes(d)) err(join(moduleDir, d), '目录不在 module.json chapters 中')

  let mTotal = 0
  const mTypes = { single: 0, multiple: 0, scenario: 0, code: 0 }
  const mDiffs = { 1: 0, 2: 0, 3: 0 }

  for (const cid of chapterIds) {
    const chapterDir = join(moduleDir, cid)
    const cardsPath = join(chapterDir, 'cards.md')
    const qPath = join(chapterDir, 'questions.ts')
    if (!existsSync(chapterDir) || !existsSync(cardsPath) || !existsSync(qPath)) {
      missingContent = true
      warn(`${mid}/${cid}`, '章节内容未生成（cards.md / questions.ts 缺失）')
      continue
    }

    const cards = readFileSync(cardsPath, 'utf-8')
    if (!cards.includes('## ')) err(cardsPath, 'cards.md 中没有 ## 知识卡标题')

    let loaded
    try {
      loaded = await loadQuestions(qPath)
    } catch (e) {
      err(qPath, `questions.ts 无法解析（语法错误？）: ${e.message}`)
      continue
    }
    const { questions, src } = loaded
    if (!Array.isArray(questions) || !questions.length) {
      err(qPath, 'questions 数组为空或未导出')
      continue
    }
    if (src.includes('```')) err(qPath, 'questions.ts 中出现了 ``` 围栏（必须用 ~~~）')

    for (const q of questions) {
      const at = `${mid}/${cid}/${q.id ?? '(无id)'}`
      if (typeof q.id !== 'string' || !q.id) {
        err(qPath, '存在缺 id 的题目')
        continue
      }
      if (allIds.has(q.id)) err(qPath, `题目 id 重复: ${q.id}（也出现在 ${allIds.get(q.id)}）`)
      else allIds.set(q.id, qPath)
      const prefix = `${mid}-${cid}-`
      if (!q.id.startsWith(prefix) || !/^\d{3}$/.test(q.id.slice(prefix.length)))
        err(qPath, `id 不符合 ${prefix}NNN 格式: ${q.id}`)

      if (!TYPE_SET.has(q.type)) err(at, `未知题型: ${q.type}`)
      else mTypes[q.type]++
      if (![1, 2, 3].includes(q.difficulty)) err(at, `difficulty 必须为 1/2/3: ${q.difficulty}`)
      else mDiffs[q.difficulty]++

      if (!Array.isArray(q.tags) || !q.tags.length) err(at, 'tags 为空')
      if (!q.stem || !String(q.stem).trim()) err(at, 'stem 为空')
      if (!q.explanation || String(q.explanation).length < 20) err(at, 'explanation 过短或为空')
      if (String(q.stem).includes('```') || String(q.explanation ?? '').includes('```'))
        err(at, 'stem/explanation 中出现 ``` 围栏（必须用 ~~~）')

      if (q.type === 'scenario' && (!q.scenario || !String(q.scenario).trim()))
        err(at, 'scenario 题必须填写 scenario 字段')
      if (q.type !== 'scenario' && q.scenario) warn(at, '非 scenario 题却填了 scenario 字段')
      if (q.type === 'code' && !String(q.stem).includes('~~~')) err(at, 'code 题必须含 ~~~ 代码块')

      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) {
        err(at, `options 数量非法: ${q.options?.length}`)
        continue
      }
      const keys = q.options.map((o) => o.key)
      const legalKeys = 'ABCDEF'.split('').slice(0, q.options.length)
      keys.forEach((k, i) => {
        if (k !== legalKeys[i]) err(at, `option key 应依次为 ${legalKeys.join('')}: 发现 ${k}`)
      })
      for (const o of q.options)
        if (!o.text || !String(o.text).trim()) err(at, `选项 ${o.key} 文本为空`)

      if (!Array.isArray(q.answers) || q.answers.length === 0) err(at, 'answers 为空')
      for (const a of q.answers ?? [])
        if (!keys.includes(a)) err(at, `答案 key ${a} 不在选项中`)
      if (q.type === 'single' && q.answers.length !== 1) err(at, 'single 题答案必须恰好 1 个')
      if (q.type === 'multiple' && q.answers.length < 2) err(at, 'multiple 题答案必须 ≥2 个')

      mTotal++
    }
  }
  perModule.push({ mid, total: mTotal, types: mTypes, diffs: mDiffs })
  totalQuestions += mTotal
}

console.log('===== 题库校验结果 =====')
for (const m of perModule) {
  console.log(
    `${m.mid.padEnd(16)} 共 ${String(m.total).padStart(3)} 题  (单选 ${m.types.single} / 多选 ${m.types.multiple} / 情景 ${m.types.scenario} / 代码 ${m.types.code})  (难度 d1 ${m.diffs[1]} / d2 ${m.diffs[2]} / d3 ${m.diffs[3]})`,
  )
}
console.log(`总计: ${totalQuestions} 题`)

if (warnings.length) {
  console.log(`\n警告 ${warnings.length} 条:`)
  warnings.forEach((w) => console.log('  ⚠ ' + w))
}
if (errors.length) {
  console.log(`\n错误 ${errors.length} 条:`)
  errors.forEach((e) => console.log('  ✗ ' + e))
  process.exit(1)
}
if (missingContent && STRICT) {
  console.log('\n✗ 存在未生成的章节（--strict 模式）')
  process.exit(1)
}
console.log(missingContent ? '\n△ 结构校验通过（部分章节内容尚未生成）' : '\n✓ 校验通过')
