<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { CompareResult, RunOutcome } from '@/lib/sqlRunner'
import {
  compareResults,
  explainSqlError,
  findMistakeHint,
  runOnDataset,
} from '@/lib/sqlRunner'
import { sqlDatasets } from '@/content/sql/datasets'
import { sqlExercises } from '@/content/sql/exercises'
import { useProgressStore } from '@/stores/progress'
import type { SqlSolutionMatch } from '@/types'
import { confetti } from '@/lib/motivation'
import { buildSqlBlueprint } from '@/lib/sqlBlueprint'
import { parseDataset } from '@/lib/schemaView'
import {
  SQL_STAGES,
  UNLOCK_RATIO,
  buildFinalExam,
  overallStat,
  questionsOfStage,
  questionsOfTag,
  stageStat,
  stageUnlocked,
  tagStats,
} from '@/lib/sqlTraining'

const route = useRoute()
const store = useProgressStore()

const datasetMap = new Map(sqlDatasets.map((d) => [d.id, d]))
const exMap = new Map(sqlExercises.map((e) => [e.id, e]))

/* ---------- 每日一题：按本地日期确定性轮转 ---------- */
const dailyEx = computed(() => {
  const dayStr = new Date().toISOString().slice(0, 10)
  const dayIndex = Math.floor(Date.parse(dayStr + 'T00:00:00Z') / 86400000)
  return sqlExercises[dayIndex % sqlExercises.length]
})

/* ---------- 选题 ----------
 * selectedId 是「自由练习」下选中的题；训练队列启动时由队列接管，
 * 统一用 activeId 读取，保证编辑器、统计、解法记录都跟着当前题走。 */
const selectedId = ref<string>(sqlExercises[0].id)

interface TrainingQueue {
  ids: string[]
  index: number
  label: string
  kind: 'stage' | 'tag' | 'final'
  /** 综合训练：每题「首次运行检查」是否通过，后续重试不覆盖 */
  firstTry?: Record<string, boolean>
}
const queue = ref<TrainingQueue | null>(null)

type PracticeMode = 'free' | 'path' | 'final'
const mode = ref<PracticeMode>('free')

const activeId = computed(() =>
  queue.value ? queue.value.ids[queue.value.index] : selectedId.value,
)
const selected = computed(() => exMap.get(activeId.value)!)
const selectedDataset = computed(() => datasetMap.get(selected.value.datasetId)!)

/** 可视化表结构：把 DDL 解析成「表名 → 列 + 数据行」 */
const SAMPLE_ROWS = 6
const parsedTables = computed(() => {
  const list = parseDataset(selectedDataset.value.ddl)
  return new Map(list.map((t) => [t.name, t]))
})
/** 查某张表某列的「中文注释」，找不到则返回空串 */
function columnCn(tableName: string, colName: string): string {
  return (
    selectedDataset.value.tables.find((t) => t.name === tableName)?.columns.find(
      (c) => c.name === colName,
    )?.cn ?? ''
  )
}
const diffFilter = ref<0 | 1 | 2 | 3>(0)
const filtered = computed(() =>
  diffFilter.value === 0 ? sqlExercises : sqlExercises.filter((e) => e.difficulty === diffFilter.value),
)

/* ---------- 标签闯关 / 综合训练 ---------- */
const expandedStage = ref<string | null>(null)
const finalSeed = ref(new Date().toISOString().slice(0, 10))
const trainingFinished = ref(false)

const stageList = computed(() =>
  SQL_STAGES.map((stage, i) => ({
    stage,
    stat: stageStat(stage, store.data.sqlStats),
    unlocked: stageUnlocked(i, store.data.sqlStats),
    questions: questionsOfStage(stage),
    tags: tagStats(stage, store.data.sqlStats),
  })),
)
const overall = computed(() => overallStat(store.data.sqlStats))
const finalExam = computed(() => buildFinalExam(finalSeed.value))
const unlockHint = computed(() => {
  const pending = stageList.value.filter((s) => s.stat.pct < UNLOCK_RATIO)
  if (!pending.length) return ''
  return `还差 ${pending.length} 关达到 ${Math.round(UNLOCK_RATIO * 100)}%：${pending
    .map((s) => `${s.stage.no}${s.stage.title}（${s.stat.passed}/${s.stat.total}）`)
    .join('、')}`
})

function startQueue(ids: string[], label: string, kind: TrainingQueue['kind']) {
  if (!ids.length) return
  trainingFinished.value = false
  queue.value = {
    ids,
    index: 0,
    label,
    kind,
    ...(kind === 'final' ? { firstTry: {} } : {}),
  }
  selectedId.value = ids[0]
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function startStage(stageId: string) {
  const item = stageList.value.find((s) => s.stage.id === stageId)
  if (!item || !item.unlocked) return
  startQueue(item.questions.map((q) => q.id), `${item.stage.no} ${item.stage.title}`, 'stage')
}

function startTag(tag: string) {
  const list = questionsOfTag(tag)
  if (!list.length) return
  mode.value = 'path'
  startQueue(list.map((q) => q.id), `标签 · ${tag}`, 'tag')
}

function startFinal() {
  if (!overall.value.finalUnlocked) return
  mode.value = 'final'
  startQueue(finalExam.value.map((q) => q.id), '综合训练 · 结业卷', 'final')
}

function reshuffleFinal() {
  finalSeed.value = String(Date.now())
  startFinal()
}

function exitTraining() {
  queue.value = null
  trainingFinished.value = false
}

function goToQueue(i: number) {
  if (!queue.value || i < 0 || i >= queue.value.ids.length) return
  queue.value.index = i
  selectedId.value = queue.value.ids[i]
  trainingFinished.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function nextInQueue() {
  if (!queue.value) return
  if (queue.value.index < queue.value.ids.length - 1) goToQueue(queue.value.index + 1)
  else trainingFinished.value = true
}

/** 综合训练记录每题「首次运行检查」的结果，重试不覆盖 */
function recordFirstTry(ok: boolean) {
  const q = queue.value
  if (!q || q.kind !== 'final' || !q.firstTry) return
  const id = q.ids[q.index]
  if (!(id in q.firstTry)) q.firstTry[id] = ok
}

const finalScore = computed(() => {
  const first = queue.value?.firstTry ?? {}
  const onePass = Object.values(first).filter(Boolean).length
  return { onePass, total: queue.value?.ids.length ?? 0, answered: Object.keys(first).length }
})

function pick(id: string) {
  // 点单题 = 退出训练队列，但保留当前模式：
  // 在闯关模式点本关题目时，左侧仍应是关卡列表，不该突然跳回自由练习
  exitTraining()
  selectedId.value = id
}

function pickDaily() {
  mode.value = 'free'
  pick(dailyEx.value.id)
}

watch(
  () => route.query.ex,
  (v) => {
    if (typeof v === 'string' && exMap.has(v)) {
      exitTraining()
      mode.value = 'free'
      selectedId.value = v
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
  { immediate: true },
)

/* ---------- 编辑器与判分 ---------- */
const editorText = ref('')
const engineReady = ref(false)
const engineError = ref('')
const checking = ref(false)
const mistakeHint = ref<string | null>(null)
const result = ref<
  | { kind: 'syntax'; message: string; raw: string }
  | { kind: 'fail'; compare: CompareResult; expected: RunOutcome; actual: RunOutcome }
  | { kind: 'pass'; compare: CompareResult; rowCount: number; actual: RunOutcome; match: SqlSolutionMatch }
  | null
>(null)
const hintsShown = ref(0)
const answerRevealed = ref(false)

/* ---------- 书写布局：宽屏自动并排，也可手动切换并记住偏好 ---------- */
const SQL_LAYOUT_KEY = 'hds_sql_layout'
type SqlLayoutPref = 'auto' | 'split' | 'stack'

function readLayoutPref(): SqlLayoutPref {
  try {
    const v = localStorage.getItem(SQL_LAYOUT_KEY)
    return v === 'split' || v === 'stack' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

const layoutPref = ref<SqlLayoutPref>(readLayoutPref())
const wideEnough = ref(typeof window === 'undefined' ? true : window.innerWidth >= 1024)
const isSplit = computed(() =>
  layoutPref.value === 'auto' ? wideEnough.value : layoutPref.value === 'split',
)

function toggleSqlLayout() {
  const next: SqlLayoutPref = isSplit.value ? 'stack' : 'split'
  layoutPref.value = next
  try {
    localStorage.setItem(SQL_LAYOUT_KEY, next)
  } catch {
    // 隐私模式下写不进去，至少保证本次会话内切换有效
  }
}

onMounted(() => {
  const mq = window.matchMedia('(min-width: 1024px)')
  wideEnough.value = mq.matches
  mq.addEventListener('change', (e) => {
    wideEnough.value = e.matches
  })
})

const statOf = computed(() => store.data.sqlStats[selected.value.id])

/* ---------- 四步拆解：固定口诀 + 本题信号，默认不剧透答案 ---------- */
const blueprint = computed(() => buildSqlBlueprint(selected.value))
const blueprintOpen = ref(false)
const skeletonCopied = ref(false)

watch(activeId, () => {
  editorText.value = ''
  result.value = null
  mistakeHint.value = null
  hintsShown.value = 0
  blueprintOpen.value = false
  skeletonCopied.value = false
  answerRevealed.value = statOf.value?.viewedAnswer ?? false
})

async function copySkeleton() {
  // 只复制到剪贴板：占位符不是合法 SQL，塞进编辑器会让判分直接报错
  const text = '-- 四步骨架：照着填，写完删掉注释再运行\n' + blueprint.value.skeleton + '\n'
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  skeletonCopied.value = true
  setTimeout(() => (skeletonCopied.value = false), 2200)
}

onMounted(async () => {
  // 预热引擎：提前加载 WASM 并跑通最小查询
  try {
    await runOnDataset(datasetMap.get('hr')!, 'SELECT 1')
    engineReady.value = true
  } catch (e) {
    engineError.value = e instanceof Error ? e.message : String(e)
  }
})

function onEditorKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const ta = e.target as HTMLTextAreaElement
    const { selectionStart: s, selectionEnd: en } = ta
    editorText.value = editorText.value.slice(0, s) + '  ' + editorText.value.slice(en)
    requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2))
  } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    runCheck()
  }
}

const tableNames = computed(() =>
  [...selectedDataset.value.ddl.matchAll(/CREATE TABLE (\w+)/g)].map((m) => m[1]),
)

/* ---------- 判定用户写法与参考答案的关系 ----------
 * 归一化：压缩空白、去尾部分号、转小写，再逐字比较。
 * 这样能忽略纯格式/缩进差异，只关心「是不是同一段逻辑写法」。 */
function normSql(s: string): string {
  return s.replace(/\s+/g, ' ').trim().replace(/;+\s*$/, '').toLowerCase()
}

function classifySql(userSql: string, ref: string, alts: string[] | undefined): SqlSolutionMatch {
  const u = normSql(userSql)
  if (normSql(ref) === u) return 'ref'
  if ((alts ?? []).some((a) => normSql(a) === u)) return 'alt'
  return 'own'
}

/** 成功解法分类 → 展示文案与配色 */
function matchMeta(m: SqlSolutionMatch): { label: string; cls: string } {
  if (m === 'ref') return { label: '与参考答案一致', cls: 'chip-blue' }
  if (m === 'alt') return { label: '官方备选解法', cls: 'chip-green' }
  return { label: '🌟 独特解法', cls: 'chip-own' }
}

/** 本题已记录的成功解法（按时间倒序），驱动「我的成功解法」卡片 */
const ownSolutions = computed(() => {
  const list = store.data.sqlStats[activeId.value]?.solutions
  return list ? [...list].sort((a, b) => b.at - a.at) : []
})

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function runCheck() {
  if (checking.value) return
  checking.value = true
  result.value = null
  mistakeHint.value = null
  try {
    // 参考答案与用户 SQL 各自在全新的内存库上执行，互不影响
    const expected = await runOnDataset(selectedDataset.value, selected.value.reference)
    const actual = await runOnDataset(selectedDataset.value, editorText.value)
    if (!actual.ok) {
      result.value = {
        kind: 'syntax',
        // 带上用户 SQL 与本题表结构，才能区分「表名选错」和「列名拼错」
        message: explainSqlError(actual.error ?? '', {
          sql: editorText.value,
          dataset: selectedDataset.value,
        }),
        raw: actual.error ?? '',
      }
      store.recordSqlAttempt(selected.value.id, false, false)
      recordFirstTry(false)
      return
    }
    const cmp = compareResults(expected, actual, selected.value.orderMatters ?? false)
    if (cmp.pass) {
      const firstEver = store.recordSqlAttempt(selected.value.id, true, false)
      const match = classifySql(editorText.value, selected.value.reference, selected.value.alts)
      store.saveSqlSolution(selected.value.id, editorText.value, match)
      result.value = { kind: 'pass', compare: cmp, rowCount: actual.rows.length, actual, match }
      answerRevealed.value = true
      recordFirstTry(true)
      if (firstEver) setTimeout(() => confetti(110), 250)
    } else {
      mistakeHint.value = findMistakeHint(editorText.value, selected.value.commonMistakes)
      store.recordSqlAttempt(selected.value.id, false, false)
      result.value = { kind: 'fail', compare: cmp, expected, actual }
      recordFirstTry(false)
    }
  } catch (e) {
    result.value = {
      kind: 'syntax',
      message: '引擎异常：' + (e instanceof Error ? e.message : String(e)),
      raw: '',
    }
  } finally {
    checking.value = false
  }
}

function resetEditor() {
  editorText.value = ''
  result.value = null
}

function showHint() {
  hintsShown.value = Math.min(hintsShown.value + 1, selected.value.hints.length)
}

function revealAnswer() {
  if (!answerRevealed.value && !window.confirm('确定查看参考答案吗？看过答案将标记本题（仍可继续练习）。')) return
  answerRevealed.value = true
  if (!statOf.value?.viewedAnswer) store.recordSqlAttempt(selected.value.id, false, true)
}

function diffClass(rowIdx: number, cmp: CompareResult): string {
  if (cmp.category && cmp.diffRow === rowIdx + 1) return 'diff-row'
  return ''
}

const statusChip = (id: string) => {
  const s = store.data.sqlStats[id]
  if (!s) return { cls: '', text: '' }
  if (s.passed > 0) return { cls: 'chip-green', text: `✓ 通过${s.passed > 1 ? ` ×${s.passed}` : ''}` }
  if (s.attempts > 0) return { cls: 'chip-blue', text: `已尝试 ${s.attempts}` }
  return { cls: '', text: '' }
}

const DIFF_LABEL: Record<number, string> = { 1: '入门', 2: '进阶', 3: '实战' }
</script>

<template>
  <div class="sql-page">
    <div class="exam-header">
      <div>
        <h1 class="page-title">✍️ 手写 SQL 修炼场</h1>
        <p class="page-sub muted small">
          内嵌 SQLite 沙箱真实执行你的 SQL，与参考答案按结果集比对判分 · 每天一道必练，覆盖面试高频手写题
        </p>
      </div>
      <span class="chip" :class="engineReady ? 'chip-green' : ''">
        {{ engineReady ? '引擎就绪' : engineError ? '引擎加载失败' : '引擎加载中…' }}
      </span>
    </div>

    <!-- 每日必练 -->
    <div class="card daily-banner fade-up" style="margin-bottom: 18px">
      <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap">
        <span class="daily-flame">📅 每日必练</span>
        <strong>{{ dailyEx.title }}</strong>
        <span class="chip">{{ DIFF_LABEL[dailyEx.difficulty] }}</span>
        <span class="chip" :class="statusChip(dailyEx.id).cls || 'chip-blue'">
          {{ statusChip(dailyEx.id).text || '今日待完成' }}
        </span>
        <button class="btn btn-primary" style="margin-left: auto" @click="pickDaily()">
          {{ store.data.sqlStats[dailyEx.id]?.passed ? '再练一遍' : '去完成' }}
        </button>
      </div>
    </div>

    <!-- 三种练习方式：自由练 / 按标签循序渐进 / 全部通关后的综合训练 -->
    <div class="mode-tabs card">
      <button class="mode-tab" :class="{ on: mode === 'free' }" @click="mode = 'free'; exitTraining()">
        📋 自由练习
      </button>
      <button class="mode-tab" :class="{ on: mode === 'path' }" @click="mode = 'path'; exitTraining()">
        🎯 标签闯关
      </button>
      <button class="mode-tab" :class="{ on: mode === 'final' }" @click="mode = 'final'; exitTraining()">
        🏁 综合训练
        <span v-if="!overall.finalUnlocked" class="mode-lock">🔒</span>
      </button>
      <span class="muted small mode-progress">
        已通过 {{ overall.passed }}/{{ overall.total }} 题 · 达标 {{ overall.masteredStages }}/{{ SQL_STAGES.length }} 关 ·
        标签 {{ overall.coveredTags }}/{{ overall.totalTags }}
      </span>
    </div>

    <div class="sql-layout">
      <!-- 左：随模式切换 -->
      <aside class="sql-list card">
        <!-- 训练进行中：队列进度 + 任意题号跳转 -->
        <template v-if="queue">
          <div class="queue-head">
            <strong>{{ queue.label }}</strong>
            <button class="btn" style="padding: 3px 10px; font-size: 12px" @click="exitTraining()">退出训练</button>
          </div>
          <p class="muted small" style="margin: 0 0 8px">
            第 {{ queue.index + 1 }}/{{ queue.ids.length }} 题 · 按顺序练，也可点题号跳转
          </p>
          <div class="queue-grid">
            <button
              v-for="(qid, i) in queue.ids"
              :key="qid"
              class="queue-num"
              :class="{
                on: i === queue.index,
                ok: store.data.sqlStats[qid]?.passed > 0,
                bad: queue.kind === 'final' && queue.firstTry?.[qid] === false,
              }"
              :title="exMap.get(qid)?.title"
              @click="goToQueue(i)"
            >
              {{ i + 1 }}
            </button>
          </div>
          <p v-if="queue.kind === 'final'" class="muted small" style="margin: 10px 0 0">
            结业卷按「首次运行检查」记成绩，写错后改对仍记一次未通过，练的是一次写对的能力。
          </p>
        </template>

        <!-- 自由练习：难度筛选 + 全部题目（保持原有行为） -->
        <template v-else-if="mode === 'free'">
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px">
            <button
              v-for="f in ([0, 1, 2, 3] as const)"
              :key="f"
              class="btn"
              :class="diffFilter === f ? 'btn-primary' : ''"
              style="padding: 4px 12px; font-size: 12px"
              @click="diffFilter = f"
            >
              {{ f === 0 ? '全部' : DIFF_LABEL[f] }}
            </button>
          </div>
          <div class="muted small" style="margin-bottom: 8px">已通过 {{ store.sqlPassedCount }}/{{ sqlExercises.length }}</div>
          <button
            v-for="ex in filtered"
            :key="ex.id"
            class="sql-item"
            :class="{ active: ex.id === activeId }"
            @click="pick(ex.id)"
          >
            <span class="sql-item-title">
              <span v-if="ex.id === dailyEx.id" title="今日必练">📅</span>
              {{ ex.title }}
            </span>
            <span class="sql-item-meta">
              <span class="chip" style="padding: 0 8px">{{ DIFF_LABEL[ex.difficulty] }}</span>
              <span class="chip" :class="statusChip(ex.id).cls" style="padding: 0 8px">
                {{ statusChip(ex.id).text || '　' }}
              </span>
            </span>
          </button>
        </template>

        <!-- 标签闯关：6 个循序渐进的技能关卡 -->
        <template v-else-if="mode === 'path'">
          <p class="muted small" style="margin: 0 0 10px">
            按 ①→⑥ 顺序练，每关通过 {{ Math.round(UNLOCK_RATIO * 100) }}% 解锁下一关；
            点单个标签可以只练这一类题。
          </p>
          <div v-for="item in stageList" :key="item.stage.id" class="stage-card" :class="{ locked: !item.unlocked }">
            <button class="stage-head" @click="expandedStage = expandedStage === item.stage.id ? null : item.stage.id">
              <span class="stage-emoji">{{ item.unlocked ? item.stage.emoji : '🔒' }}</span>
              <span class="stage-title">
                <strong>{{ item.stage.no }} {{ item.stage.title }}</strong>
                <span class="muted small">{{ item.stat.passed }}/{{ item.stat.total }} 题通过</span>
              </span>
              <span class="stage-pct" :class="{ done: item.stat.mastered }">
                {{ Math.round(item.stat.pct * 100) }}%
              </span>
            </button>
            <div class="stage-bar"><div :style="{ width: item.stat.pct * 100 + '%' }" /></div>
            <div v-if="expandedStage === item.stage.id" class="stage-body">
              <p class="muted small" style="margin: 0 0 6px">{{ item.stage.desc }}</p>
              <p class="stage-focus">🎯 {{ item.stage.focus }}</p>
              <p class="muted small" style="margin: 8px 0 4px">本关标签（点击只练该标签）：</p>
              <div class="tag-chips">
                <button
                  v-for="t in item.tags"
                  :key="t.tag"
                  class="tag-chip"
                  :class="{ done: t.passed === t.total }"
                  @click="startTag(t.tag)"
                >
                  #{{ t.tag }} <span>{{ t.passed }}/{{ t.total }}</span>
                </button>
              </div>
              <div class="stage-questions">
                <button
                  v-for="(q, i) in item.questions"
                  :key="q.id"
                  class="stage-q"
                  @click="pick(q.id)"
                >
                  <span>{{ i + 1 }}. {{ q.title }}</span>
                  <span class="chip" :class="statusChip(q.id).cls" style="padding: 0 7px">{{ statusChip(q.id).text || '未做' }}</span>
                </button>
              </div>
              <button
                class="btn btn-primary"
                style="width: 100%; margin-top: 8px"
                :disabled="!item.unlocked"
                @click="startStage(item.stage.id)"
              >
                {{ item.unlocked ? '开始本关训练（按难度顺序）→' : '先完成上一关的 80%' }}
              </button>
            </div>
          </div>
        </template>

        <!-- 综合训练：全部关卡达标后解锁 -->
        <template v-else>
          <div class="final-card" :class="{ unlocked: overall.finalUnlocked }">
            <p style="font-size: 30px; margin: 0">{{ overall.finalUnlocked ? '🏁' : '🔒' }}</p>
            <h3 style="margin: 6px 0">综合训练 · 结业卷</h3>
            <p class="muted small">
              {{ overall.finalUnlocked
                ? '10 道题按难度分层、跨技能混合抽题，模拟面试时「不知道考哪个知识点」的状态。'
                : '把 6 个技能关都练到 80% 就能解锁，先逐个标签打牢基础。' }}
            </p>
            <p v-if="!overall.finalUnlocked" class="final-hint">{{ unlockHint }}</p>
            <div class="stage-bar" style="margin: 10px 0">
              <div :style="{ width: (overall.masteredStages / SQL_STAGES.length) * 100 + '%' }" />
            </div>
            <p class="muted small">关卡达标 {{ overall.masteredStages }}/{{ SQL_STAGES.length }} · 题库通过 {{ overall.passed }}/{{ overall.total }}</p>
            <p class="muted small" style="margin-top: 10px">
              标签覆盖 {{ overall.coveredTags }}/{{ overall.totalTags }}
              <span v-if="overall.missingTags.length">· 下面这些还没练过，点一下单独练：</span>
              <span v-else>· 所有标签都练过一轮了 🎉</span>
            </p>
            <div v-if="overall.missingTags.length" class="tag-chips" style="justify-content: center; margin-top: 6px">
              <button
                v-for="t in overall.missingTags"
                :key="t"
                class="tag-chip"
                @click="startTag(t)"
              >
                #{{ t }} 去练 →
              </button>
            </div>
            <button class="btn btn-primary" style="width: 100%; margin-top: 10px" :disabled="!overall.finalUnlocked" @click="startFinal()">
              {{ overall.finalUnlocked ? '开始综合训练 →' : '尚未解锁' }}
            </button>
            <button v-if="overall.finalUnlocked" class="btn" style="width: 100%; margin-top: 6px" @click="reshuffleFinal()">
              🔄 换一套题
            </button>
          </div>
        </template>
      </aside>

      <!-- 右：题目工作区 -->
      <section class="sql-work">
        <!-- 训练进度条：只在队列模式出现，明确「练到哪了」 -->
        <div v-if="queue" class="card training-bar">
          <div class="training-bar-head">
            <strong>🎯 {{ queue.label }}</strong>
            <span class="muted small">第 {{ queue.index + 1 }} / {{ queue.ids.length }} 题</span>
          </div>
          <div class="stage-bar"><div :style="{ width: ((queue.index + 1) / queue.ids.length) * 100 + '%' }" /></div>
          <p class="muted small" style="margin: 8px 0 0">
            {{ selected.title }} · {{ DIFF_LABEL[selected.difficulty] }}
            <span v-if="queue.kind === 'final'"> · 一次写对 {{ finalScore.onePass }}/{{ finalScore.answered }}</span>
          </p>
        </div>

        <!-- 结业小结 -->
        <div v-if="queue && trainingFinished" class="card final-result">
          <h3 style="margin: 0 0 6px">🏁 本轮训练完成</h3>
          <p v-if="queue.kind === 'final'" style="margin: 0 0 6px">
            一次写对 <strong>{{ finalScore.onePass }}</strong> / {{ finalScore.total }} 题
            <span class="muted small">（共作答 {{ finalScore.answered }} 题，按首次运行检查计）</span>
          </p>
          <p v-else style="margin: 0 0 6px">
            已完成「{{ queue.label }}」全部 {{ queue.ids.length }} 题，通过
            <strong>{{ queue.ids.filter((id) => store.data.sqlStats[id]?.passed > 0).length }}</strong> 题。
          </p>
          <p v-if="queue.kind === 'final' && finalScore.onePass < finalScore.total" class="muted small">
            没一次写对的题已留在错题记录里，回「标签闯关」找到对应标签再练一轮，比直接重刷整套更有效。
          </p>
          <div class="question-actions" style="margin-top: 10px">
            <button class="btn" @click="goToQueue(0)">从头再练</button>
            <button class="btn" @click="exitTraining()">退出训练</button>
            <button v-if="queue.kind === 'final'" class="btn btn-primary" @click="reshuffleFinal()">换一套综合卷 →</button>
            <button v-else class="btn btn-primary" @click="mode = 'path'; exitTraining()">返回关卡列表 →</button>
          </div>
        </div>

        <div v-spotlight class="card sql-split" :class="{ 'is-split': isSplit }">
          <!-- 宽屏时左右并排：左栏看题与表结构，右栏写 SQL，两栏各自独立滚动 -->
          <div class="sql-pane sql-pane-question">
          <div class="question-head">
            <span class="chip chip-blue">{{ DIFF_LABEL[selected.difficulty] }}</span>
            <span v-for="t in selected.tags" :key="t" class="chip chip-tag">#{{ t }}</span>
            <span class="chip">{{ selectedDataset.name }}</span>
          </div>
          <h2 style="margin: 4px 0 10px; font-size: 19px">{{ selected.title }}</h2>
          <p style="margin: 0 0 12px; line-height: 1.8">{{ selected.stem }}</p>

          <!-- 四步拆解已移到右下角（编辑器下方）：左栏只留题干 + 表结构，看表不用再往下翻 -->

          <details class="schema-details" open>
            <summary>📋 表结构（{{ tableNames.join('、') }}）与引擎说明</summary>

            <!-- 可视化表结构：每张表一张带中文注释的表 -->
            <div
              v-for="t in selectedDataset.tables"
              :key="t.name"
              class="schema-table-block"
            >
              <p class="schema-table-title">
                {{ t.cn }} <span class="muted">（{{ t.name }} 表）</span>
              </p>
              <div class="schema-table-scroll">
                <table class="schema-table">
                  <thead>
                    <tr>
                      <th
                        v-for="col in parsedTables.get(t.name)?.columns ?? []"
                        :key="col"
                      >
                        <span class="col-en">{{ col }}</span>
                        <span class="col-cn">{{ columnCn(t.name, col) }}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, ri) in (parsedTables.get(t.name)?.rows ?? []).slice(
                        0,
                        SAMPLE_ROWS,
                      )"
                      :key="ri"
                    >
                      <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="muted small" style="margin: 4px 0 0">
                仅展示前 {{ SAMPLE_ROWS }} 行示例，完整数据见下方原始 SQL。
              </p>
            </div>

            <!-- 表关系说明 -->
            <div v-if="selectedDataset.relations?.length" class="schema-relations">
              <p class="schema-rel-title">🔗 表与表的关系</p>
              <ul>
                <li v-for="(r, i) in selectedDataset.relations" :key="i">{{ r }}</li>
              </ul>
            </div>

            <p class="muted small" style="margin: 10px 0 0">
              引擎说明：仅接受单条 SELECT / WITH 查询；内置 DATEDIFF(a, b) 返回相差天数；日期/时间为 TEXT（YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS）可用字符串/substr 比较；支持窗口函数、CTE 与递归 CTE。
            </p>

            <!-- 原始 DDL 折叠保留，供想看底层定义的人查阅 -->
            <details class="schema-raw">
              <summary>原始建表 / 插数据 SQL（DDL）</summary>
              <pre class="sql-pre">{{ selectedDataset.ddl }}</pre>
            </details>
          </details>
          </div>

          <div class="sql-pane sql-pane-editor">
          <textarea
            v-model="editorText"
            class="sql-editor"
            rows="9"
            spellcheck="false"
            placeholder="-- 在这里手写你的 SQL（Tab 缩进，Ctrl+Enter 运行）"
            @keydown="onEditorKeydown"
          ></textarea>

          <div class="question-actions">
            <button class="btn btn-primary" :disabled="checking || !engineReady" @click="runCheck">
              {{ checking ? '判分中…' : '▶ 运行检查（Ctrl+Enter）' }}
            </button>
            <button class="btn" @click="resetEditor">清空</button>
            <button class="btn" :disabled="hintsShown >= selected.hints.length" @click="showHint">
              💡 提示（{{ hintsShown }}/{{ selected.hints.length }}）
            </button>
            <button class="btn" :class="answerRevealed ? '' : 'btn-warn'" @click="revealAnswer">
              {{ answerRevealed ? '答案已展开 ↓' : '查看参考答案' }}
            </button>
            <button class="btn" :title="isSplit ? '切回上下排列' : '改成左右并排，边看题边写'" @click="toggleSqlLayout">
              {{ isSplit ? '⇕ 上下排列' : '⇔ 并排书写' }}
            </button>
          </div>

          <!-- 递进提示 -->
          <div v-if="hintsShown > 0" class="md-box" style="margin-top: 12px">
            <p class="explanation-title">提示</p>
            <ol style="margin: 6px 0; padding-left: 20px">
              <li v-for="i in hintsShown" :key="i" style="margin: 4px 0">{{ selected.hints[i - 1] }}</li>
            </ol>
          </div>

          <!-- 四步拆解：移到右下角，不占用题干与表结构的位置；内容与交互保持不变 -->
          <div class="sql-blueprint sql-blueprint-bottom">
            <div class="bp-head">
              <strong>🧠 四步拆解 · 先自己想，再看提示</strong>
              <span class="muted small">口诀固定不变，每题都过一遍，慢慢就成肌肉记忆</span>
            </div>
            <div class="bp-grid">
              <div
                v-for="s in blueprint.steps"
                :key="s.key"
                class="bp-step"
                :class="{ mutedStep: !s.used }"
              >
                <div class="bp-step-top">
                  <span class="bp-no">{{ s.no }}</span>
                  <strong>{{ s.title }}</strong>
                  <span v-if="!s.used" class="chip" style="padding: 0 7px; font-size: 11px">本题不用</span>
                </div>
                <p class="bp-mnemonic">{{ s.mnemonic }}</p>
                <p v-if="blueprintOpen" class="bp-guide">{{ s.guide }}</p>
                <p v-if="blueprintOpen && s.used" class="bp-signal">🎯 本题：{{ s.signal }}</p>
              </div>
            </div>
            <div class="bp-actions">
              <button class="btn" style="padding: 4px 12px; font-size: 12px" @click="blueprintOpen = !blueprintOpen">
                {{ blueprintOpen ? '收起思路提示 ↑' : '展开写法指导与本题信号 ↓' }}
              </button>
              <button class="btn" style="padding: 4px 12px; font-size: 12px" @click="copySkeleton">
                {{ skeletonCopied ? '骨架已复制 ✓' : '复制空白 SQL 骨架' }}
              </button>
            </div>
            <p v-if="blueprintOpen" class="bp-note muted small">
              提示只讲「往哪想」，不告诉你具体表名、字段和条件值；写完用下面 4 个问题自查：
            </p>
            <ol v-if="blueprintOpen" class="bp-checklist">
              <li v-for="(c, i) in blueprint.checklist" :key="i">{{ c }}</li>
            </ol>
          </div>
          </div>
        </div>

        <!-- 判分结果 -->
        <div v-if="result" class="card fade-up" style="margin-top: 14px">
          <!-- 语法错误 -->
          <template v-if="result.kind === 'syntax'">
            <p style="color: var(--red); font-weight: 700; margin: 0 0 8px">❌ SQL 执行报错</p>
            <p class="md-box" style="margin: 0 0 8px">{{ result.message }}</p>
            <pre v-if="result.raw" class="sql-pre" style="opacity: 0.75">{{ result.raw }}</pre>
          </template>

          <!-- 通过 -->
          <template v-else-if="result.kind === 'pass'">
            <p style="color: var(--green); font-weight: 700; margin: 0 0 6px">
              ✅ 通过！结果与参考答案完全一致（{{ result.rowCount }} 行）
            </p>
            <p v-if="result.compare.note" class="chip chip-blue" style="margin-bottom: 8px">{{ result.compare.note }}</p>
            <p v-if="result.match === 'own'" class="chip chip-own" style="margin-bottom: 8px">
              🌟 独特解法：你没照搬参考答案也写对了！
            </p>
            <p v-else-if="result.match === 'alt'" class="chip chip-green" style="margin-bottom: 8px">
              ✨ 你用官方备选解法写对了
            </p>
            <p class="muted small" style="text-align: center; margin: 4px 0 6px">你的查询结果（前 8 行）</p>
            <table class="sql-table">
              <thead>
                <tr><th v-for="c in result.actual.columns" :key="c">{{ c }}</th></tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in result.actual.rows.slice(0, 8)" :key="i">
                  <td v-for="(c, j) in r" :key="j">{{ c }}</td>
                </tr>
              </tbody>
            </table>
            <p class="cheer" style="margin: 12px 0 0">经验 +{{ statOf && statOf.passed === 1 ? 20 : 6 }} XP，面试手写又稳一分 💪</p>
            <button
              v-if="queue"
              class="btn btn-primary"
              style="margin-top: 10px"
              @click="nextInQueue()"
            >
              {{ queue.index < queue.ids.length - 1 ? '下一题 →' : '完成本轮训练 →' }}
            </button>
          </template>

          <!-- 结果不符 -->
          <template v-else>
            <p style="color: var(--red); font-weight: 700; margin: 0 0 8px">❌ 结果不正确</p>
            <div v-if="mistakeHint" class="md-box" style="border-left: 3px solid var(--warn); margin-bottom: 10px">
              <p class="explanation-title" style="color: var(--warn)">🎯 错因定位</p>
              <p style="margin: 0">{{ mistakeHint }}</p>
            </div>
            <p class="md-box" style="margin: 0 0 12px">{{ result.compare.message }}</p>
            <div class="sql-compare">
              <div>
                <p class="muted small" style="text-align: center; margin: 0 0 6px">期望结果（前 8 行）</p>
                <table class="sql-table">
                  <thead>
                    <tr><th v-for="c in result.expected.columns" :key="c">{{ c }}</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, i) in result.expected.rows.slice(0, 8)" :key="i" :class="diffClass(i, result.compare)">
                      <td v-for="(c, j) in r" :key="j">{{ c }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <p class="muted small" style="text-align: center; margin: 0 0 6px">你的结果（前 8 行）</p>
                <table class="sql-table">
                  <thead>
                    <tr><th v-for="c in result.actual.columns" :key="c">{{ c }}</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, i) in result.actual.rows.slice(0, 8)" :key="i" :class="diffClass(i, result.compare)">
                      <td v-for="(c, j) in r" :key="j">{{ c }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p class="muted small" style="margin: 10px 0 0">
              依据错误提示修改 SQL 后重新运行；实在没思路就点「提示」，逐步解锁解题思路。
            </p>
          </template>
        </div>

        <!-- 参考答案与解析：与是否运行过 SQL 无关，点开即显示 -->
        <div v-if="answerRevealed" class="card fade-up" style="margin-top: 14px">
          <details class="doubt-detail" open>
            <summary>参考答案与解析</summary>
            <pre class="sql-pre" style="margin-top: 10px">{{ selected.reference }}</pre>
            <p class="md-box" style="margin-top: 10px">{{ selected.explanation }}</p>
          </details>
        </div>

        <!-- 我的成功解法：记录所有通过写法，突出「不按答案也能写对」的独特解法 -->
        <div v-if="ownSolutions.length" class="card fade-up" style="margin-top: 14px">
          <div class="sol-head">
            <strong>🏆 我的成功解法</strong>
            <span class="muted small">本题已用 {{ ownSolutions.length }} 种写法通过</span>
          </div>
          <div v-for="(sol, i) in ownSolutions" :key="i" class="sol-item">
            <div class="sol-meta">
              <span class="chip" :class="matchMeta(sol.match).cls">{{ matchMeta(sol.match).label }}</span>
              <span class="muted small">{{ formatTime(sol.at) }}</span>
            </div>
            <pre class="sql-pre">{{ sol.sql }}</pre>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 模式切换 */
.mode-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  margin-bottom: 16px;
}

.mode-tab {
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--muted);
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-tab:hover {
  color: var(--text);
  border-color: var(--primary);
}

.mode-tab.on {
  color: #fff;
  border-color: rgba(124, 140, 255, 0.55);
  background: linear-gradient(120deg, rgba(124, 140, 255, 0.3), rgba(56, 217, 245, 0.18));
}

.mode-lock {
  font-size: 11px;
  margin-left: 3px;
}

.mode-progress {
  margin-left: auto;
}

/* 训练队列 */
.queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.queue-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.queue-num {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--muted);
  font-size: 12.5px;
  cursor: pointer;
}

.queue-num.ok {
  border-color: rgba(52, 211, 153, 0.5);
  color: var(--green);
}

.queue-num.bad {
  border-color: rgba(251, 113, 133, 0.5);
  color: var(--red);
}

.queue-num.on {
  background: var(--primary);
  border-color: var(--primary);
  color: #0b1020;
  font-weight: 700;
}

/* 关卡卡片 */
.stage-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 11px;
  margin-bottom: 9px;
  background: var(--surface-strong);
}

.stage-card.locked {
  opacity: 0.62;
}

.stage-head {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  color: var(--text);
  cursor: pointer;
  padding: 0;
}

.stage-emoji {
  font-size: 19px;
}

.stage-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13.5px;
}

.stage-pct {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.stage-pct.done {
  color: var(--green);
  font-weight: 700;
}

.stage-bar {
  height: 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-top: 8px;
}

.stage-bar > div {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--primary), #38d9f5);
  transition: width 0.3s;
}

.stage-body {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
}

.stage-focus {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: #b7c1ff;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-chip {
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  font-size: 11.5px;
  cursor: pointer;
}

.tag-chip:hover {
  border-color: var(--primary);
  color: var(--text);
}

.tag-chip.done {
  border-color: rgba(52, 211, 153, 0.5);
  color: var(--green);
}

.tag-chip span {
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
}

.stage-questions {
  margin-top: 10px;
  max-height: 210px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.stage-q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  padding: 6px 7px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text);
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
}

.stage-q:hover {
  background: var(--surface);
}

/* 综合训练入口 */
.final-card {
  text-align: center;
  border: 1px dashed var(--border-strong);
  border-radius: 12px;
  padding: 18px 14px;
  background: var(--surface-strong);
}

.final-card.unlocked {
  border-color: rgba(52, 211, 153, 0.5);
  background:
    radial-gradient(260px 140px at 50% 0%, rgba(52, 211, 153, 0.1), transparent 70%),
    var(--surface-strong);
}

.final-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: #ffd166;
  text-align: left;
}

.training-bar {
  margin-bottom: 14px;
  border-color: rgba(124, 140, 255, 0.4);
  background:
    radial-gradient(320px 120px at 95% 0%, rgba(124, 140, 255, 0.1), transparent 65%),
    var(--surface);
}

.training-bar-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.final-result {
  margin-bottom: 14px;
  border-color: rgba(52, 211, 153, 0.45);
}

@media (max-width: 720px) {
  .mode-tabs {
    gap: 6px;
  }
  .mode-progress {
    width: 100%;
    margin-left: 0;
  }
  .mode-tab {
    padding: 6px 11px;
    font-size: 12.5px;
  }
}

.daily-banner {
  border-color: rgba(251, 191, 36, 0.35);
  background:
    radial-gradient(300px 120px at 90% 0%, rgba(251, 191, 36, 0.1), transparent 60%),
    var(--surface);
}

.daily-flame {
  font-weight: 700;
  color: #ffd166;
}

.sql-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 14px;
  align-items: start;
}

/* 宽屏时把「题目 + 表结构」与「编辑器」拆成左右两栏：
   左栏内部滚动看表，右栏始终可见，写 SQL 不用再上下反复滑 */
.sql-split {
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
}

.sql-pane {
  min-width: 0;
}

/* is-split 由脚本按窗口宽度自动切换，也可点按钮手动强制开启 / 关闭 */
.sql-split.is-split {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.sql-split.is-split .sql-pane {
  max-height: calc(100vh - 170px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}

.sql-split.is-split .sql-pane-editor {
  border-left: 1px solid var(--border);
  padding-left: 18px;
}

.sql-split.is-split .sql-pane-editor .sql-editor {
  margin-top: 0;
}

.sql-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  margin-bottom: 8px;
  /* 左侧题目栏固定：不随整页滚动而滚走，题目多时在栏内独立滚动 */
  position: sticky;
  top: 90px;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
}

.sql-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.15s;
}

.sql-item:hover {
  border-color: var(--primary);
}

.sql-item.active {
  border-color: var(--primary);
  background: linear-gradient(120deg, rgba(124, 140, 255, 0.14), rgba(56, 217, 245, 0.08));
}

.sql-item-title {
  font-size: 14px;
  font-weight: 600;
}

.sql-item-meta {
  display: flex;
  gap: 6px;
}

.sql-editor {
  width: 100%;
  margin-top: 12px;
  background: #0a101f;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  color: #dbe4ff;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13.5px;
  line-height: 1.7;
  padding: 14px;
  resize: vertical;
  outline: none;
}

.sql-editor:focus {
  border-color: var(--primary);
  box-shadow: var(--glow);
}

.sql-pre {
  background: #0a101f;
  border: 1px solid var(--border);
  border-radius: 10px;
  color: #c8d3f5;
  padding: 12px 14px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.6;
  font-family: 'JetBrains Mono', Consolas, monospace;
  margin: 10px 0 0;
  white-space: pre-wrap;
}

.schema-details summary {
  font-size: 13px;
}

/* 可视化表结构 */
.schema-table-block {
  margin: 12px 0;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.schema-table-title {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 8px;
}
.schema-table-scroll {
  overflow-x: auto;
}
.schema-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
}
.schema-table th,
.schema-table td {
  border: 1px solid var(--border);
  padding: 5px 9px;
  text-align: left;
  white-space: nowrap;
}
.schema-table thead th {
  background: rgba(124, 140, 255, 0.14);
}
.schema-table .col-en {
  display: block;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-weight: 700;
  color: var(--text);
}
.schema-table .col-cn {
  display: block;
  font-weight: 400;
  opacity: 0.62;
  font-size: 11px;
  margin-top: 2px;
}
.schema-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.025);
}
.schema-relations {
  margin: 12px 0 4px;
  padding: 10px 12px;
  border: 1px solid rgba(80, 200, 160, 0.32);
  border-radius: 10px;
  background: rgba(80, 200, 160, 0.06);
}
.schema-rel-title {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 6px;
}
.schema-relations ul {
  margin: 0;
  padding-left: 18px;
}
.schema-relations li {
  font-size: 12.5px;
  line-height: 1.75;
  margin: 3px 0;
}
.schema-raw {
  margin-top: 10px;
}
.schema-raw summary {
  font-size: 12.5px;
  cursor: pointer;
}

/* 四步拆解提醒 */
.sql-blueprint {
  border: 1px solid rgba(124, 140, 255, 0.32);
  border-radius: 12px;
  padding: 12px 14px;
  margin: 12px 0 14px;
  background:
    radial-gradient(320px 120px at 95% 0%, rgba(124, 140, 255, 0.09), transparent 65%),
    var(--surface);
}

/* 移到右下角（编辑器下方）后，与上方按钮 / 提示拉开距离，视觉上独立成一块 */
.sql-blueprint-bottom {
  margin-top: 18px;
}

.bp-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.bp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
}

.bp-step {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--surface-strong);
}

.bp-step.mutedStep {
  opacity: 0.55;
}

.bp-step-top {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
}

.bp-no {
  color: var(--primary);
  font-weight: 800;
  font-size: 15px;
}

.bp-mnemonic {
  margin: 7px 0 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--text);
}

.bp-guide {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--muted);
}

.bp-signal {
  margin: 7px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: #b7c1ff;
}

.bp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.bp-note {
  margin: 10px 0 4px;
}

.bp-checklist {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--muted);
}

@media (max-width: 640px) {
  .bp-grid {
    grid-template-columns: 1fr;
  }
}

.sql-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.sql-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.sql-table th,
.sql-table td {
  border: 1px solid var(--border);
  padding: 5px 9px;
  text-align: left;
  white-space: nowrap;
}

.sql-table th {
  background: var(--surface-strong);
  color: var(--muted);
  font-weight: 600;
}

.sql-table tr.diff-row td {
  background: var(--red-soft);
  color: var(--red);
}

/* 独特解法徽章：紫粉渐变，与普通/备选明显区分 */
.chip-own {
  background: linear-gradient(120deg, rgba(167, 139, 250, 0.22), rgba(236, 72, 153, 0.18));
  border-color: rgba(167, 139, 250, 0.55);
  color: #c4b5fd;
}

.sol-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.sol-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: var(--surface-strong);
}

.sol-item:last-child {
  margin-bottom: 0;
}

.sol-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

@media (max-width: 860px) {
  .sql-layout {
    grid-template-columns: 1fr;
  }

  /* 单列时不再固定，恢复随页面正常排列 */
  .sql-list {
    position: static;
    max-height: none;
    overflow: visible;
  }

  .sql-compare {
    grid-template-columns: 1fr;
  }
}
</style>
