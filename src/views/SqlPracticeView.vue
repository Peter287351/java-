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
import { confetti } from '@/lib/motivation'

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

/* ---------- 选题 ---------- */
const selectedId = ref<string>(sqlExercises[0].id)
const selected = computed(() => exMap.get(selectedId.value)!)
const selectedDataset = computed(() => datasetMap.get(selected.value.datasetId)!)
const diffFilter = ref<0 | 1 | 2 | 3>(0)
const filtered = computed(() =>
  diffFilter.value === 0 ? sqlExercises : sqlExercises.filter((e) => e.difficulty === diffFilter.value),
)

function pick(id: string) {
  selectedId.value = id
}

watch(
  () => route.query.ex,
  (v) => {
    if (typeof v === 'string' && exMap.has(v)) {
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
  | { kind: 'pass'; compare: CompareResult; rowCount: number }
  | null
>(null)
const hintsShown = ref(0)
const answerRevealed = ref(false)

const statOf = computed(() => store.data.sqlStats[selected.value.id])

watch(selectedId, () => {
  editorText.value = ''
  result.value = null
  hintsShown.value = 0
  answerRevealed.value = statOf.value?.viewedAnswer ?? false
})

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
      result.value = { kind: 'syntax', message: explainSqlError(actual.error ?? ''), raw: actual.error ?? '' }
      store.recordSqlAttempt(selected.value.id, false, false)
      return
    }
    const cmp = compareResults(expected, actual, selected.value.orderMatters ?? false)
    if (cmp.pass) {
      const firstEver = store.recordSqlAttempt(selected.value.id, true, false)
      result.value = { kind: 'pass', compare: cmp, rowCount: actual.rows.length }
      answerRevealed.value = true
      if (firstEver) setTimeout(() => confetti(110), 250)
    } else {
      mistakeHint.value = findMistakeHint(editorText.value, selected.value.commonMistakes)
      store.recordSqlAttempt(selected.value.id, false, false)
      result.value = { kind: 'fail', compare: cmp, expected, actual }
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
        <button class="btn btn-primary" style="margin-left: auto" @click="pick(dailyEx.id)">
          {{ store.data.sqlStats[dailyEx.id]?.passed ? '再练一遍' : '去完成' }}
        </button>
      </div>
    </div>

    <div class="sql-layout">
      <!-- 左：题目列表 -->
      <aside class="sql-list card">
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
          :class="{ active: ex.id === selectedId }"
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
      </aside>

      <!-- 右：题目工作区 -->
      <section class="sql-work">
        <div v-spotlight class="card">
          <div class="question-head">
            <span class="chip chip-blue">{{ DIFF_LABEL[selected.difficulty] }}</span>
            <span v-for="t in selected.tags" :key="t" class="chip chip-tag">#{{ t }}</span>
            <span class="chip">{{ selectedDataset.name }}</span>
          </div>
          <h2 style="margin: 4px 0 10px; font-size: 19px">{{ selected.title }}</h2>
          <p style="margin: 0 0 12px; line-height: 1.8">{{ selected.stem }}</p>

          <details class="schema-details">
            <summary>📋 表结构（{{ tableNames.join('、') }}）与引擎说明</summary>
            <pre class="sql-pre">{{ selectedDataset.ddl }}</pre>
            <p class="muted small" style="margin: 8px 0 0">
              引擎说明：仅接受单条 SELECT / WITH 查询；内置 DATEDIFF(a, b) 返回相差天数；日期为 TEXT（YYYY-MM-DD）可用字符串/substr 比较；支持窗口函数、CTE 与递归 CTE。
            </p>
          </details>

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
          </div>

          <!-- 递进提示 -->
          <div v-if="hintsShown > 0" class="md-box" style="margin-top: 12px">
            <p class="explanation-title">提示</p>
            <ol style="margin: 6px 0; padding-left: 20px">
              <li v-for="i in hintsShown" :key="i" style="margin: 4px 0">{{ selected.hints[i - 1] }}</li>
            </ol>
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
            <p class="cheer" style="margin: 0 0 10px">经验 +{{ statOf && statOf.passed === 1 ? 20 : 6 }} XP，面试手写又稳一分 💪</p>
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

          <!-- 解析与参考答案 -->
          <details v-if="answerRevealed" class="doubt-detail" style="margin-top: 14px" open>
            <summary>参考答案与解析</summary>
            <pre class="sql-pre" style="margin-top: 10px">{{ selected.reference }}</pre>
            <p class="md-box" style="margin-top: 10px">{{ selected.explanation }}</p>
          </details>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
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

@media (max-width: 860px) {
  .sql-layout {
    grid-template-columns: 1fr;
  }

  .sql-compare {
    grid-template-columns: 1fr;
  }
}
</style>
