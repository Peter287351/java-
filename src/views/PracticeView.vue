<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { questionById, questionIndex, getChapter, getModule, modules as allModules } from '@/lib/content'
import type { QuestionRef } from '@/lib/content'
import { useProgressStore } from '@/stores/progress'
import type { PracticeAnswerRecord, PracticeSession } from '@/types'
import { setEquals, shuffle } from '@/lib/utils'
import { randomCheer, confetti } from '@/lib/motivation'
import QuestionCard from '@/components/QuestionCard.vue'
import LearnerReport from '@/components/LearnerReport.vue'

/** 本轮某题的作答快照：回看时原样展示，不会再计分 */
type AnswerRecord = PracticeAnswerRecord

const route = useRoute()
const store = useProgressStore()
/** 当前练习范围的标识：不同章节/模块各自的进度互不覆盖 */
const scopeKey = ref('')

const ids = ref<string[]>([])
const idx = ref(0)
/** 每题当前的选择（含还没提交的草稿），来回翻题时不会丢 */
const drafts = ref<string[][]>([])
const records = ref<(AnswerRecord | null)[]>([])
const finished = ref(false)
/** 本轮小结是否已展示过：从小结回来时不再重复放彩带、重复检查成就 */
const summaryShown = ref(false)
/** 最近一次提交的是哪一题：用来区分「刚答完」和「翻回旧题回看」 */
const lastSubmittedIdx = ref(-1)
const combo = ref(0)
const bestCombo = ref(0)
/** 本轮实际拿到的经验值：逐次累加，跨页面也不会算错 */
const sessionXpEarned = ref(0)

function scopeLabel() {
  const q = route.query
  if (q.wrong === '1') {
    const m = q.module ? getModule(String(q.module)) : null
    return m ? `${m.meta.title} · 错题重做` : '全部错题重做'
  }
  if (q.chapter) {
    const c = getChapter(String(q.module), String(q.chapter))
    const m = getModule(String(q.module))
    return m && c ? `${m.meta.title} · ${c.meta.title}` : '章节练习'
  }
  if (q.module) {
    const m = getModule(String(q.module))
    return m ? `${m.meta.title} · 全模块练习` : '自由刷题'
  }
  return '自由刷题'
}

/** 用路由参数拼出稳定的范围标识（与参数顺序无关） */
function currentScopeKey() {
  const q = route.query
  const part = Object.keys(q)
    .sort()
    .map((k) => `${k}=${String(q[k] ?? '')}`)
    .join('&')
  return part || 'all'
}

/** 会话必须和题库对得上才恢复：题库改了、题目删了就重新开一轮 */
function validSession(s: PracticeSession | undefined): s is PracticeSession {
  if (!s || s.scopeKey !== scopeKey.value) return false
  if (!Array.isArray(s.ids) || !s.ids.length) return false
  if (s.ids.some((id) => !questionById(id))) return false
  if (!Array.isArray(s.records) || s.records.length !== s.ids.length) return false
  if (!Array.isArray(s.drafts) || s.drafts.length !== s.ids.length) return false
  if (!Number.isInteger(s.idx) || s.idx < 0 || s.idx >= s.ids.length) return false
  return true
}

function restore(s: PracticeSession) {
  ids.value = [...s.ids]
  idx.value = s.idx
  drafts.value = s.drafts.map((d) => (Array.isArray(d) ? [...d] : []))
  records.value = s.records.map((r) =>
    r
      ? {
          selected: Array.isArray(r.selected) ? [...r.selected] : [],
          correct: !!r.correct,
          cheer: String(r.cheer ?? ''),
        }
      : null,
  )
  finished.value = !!s.finished
  summaryShown.value = !!s.summaryShown
  lastSubmittedIdx.value = Number.isInteger(s.lastSubmittedIdx) ? s.lastSubmittedIdx : -1
  combo.value = Number(s.combo) || 0
  bestCombo.value = Number(s.bestCombo) || 0
  sessionXpEarned.value = Number(s.sessionXpEarned) || 0
}

/** 整轮练习写进进度数据，随 localStorage / 导出导入一起保存 */
function persist() {
  if (!scopeKey.value || !ids.value.length) return
  store.savePracticeSession({
    scopeKey: scopeKey.value,
    ids: [...ids.value],
    idx: idx.value,
    drafts: drafts.value.map((d) => [...d]),
    records: records.value.map((r) => (r ? { ...r, selected: [...r.selected] } : null)),
    finished: finished.value,
    summaryShown: summaryShown.value,
    lastSubmittedIdx: lastSubmittedIdx.value,
    combo: combo.value,
    bestCombo: bestCombo.value,
    sessionXpEarned: sessionXpEarned.value,
    lastAt: Date.now(),
  })
}

/** fresh=true 用于「再来一轮」：不恢复旧会话，直接开新的一轮 */
function build(fresh = false) {
  scopeKey.value = currentScopeKey()
  const saved = fresh ? undefined : store.data.practiceSessions?.[scopeKey.value]
  if (validSession(saved)) {
    restore(saved)
    return
  }
  const q = route.query
  let refs: QuestionRef[] = [...questionIndex.values()]
  if (q.module) refs = refs.filter((r) => r.moduleId === String(q.module))
  if (q.chapter) refs = refs.filter((r) => r.chapterId === String(q.chapter))
  if (q.diff) refs = refs.filter((r) => r.q.difficulty === Number(q.diff))
  if (q.type) refs = refs.filter((r) => r.q.type === String(q.type))
  if (q.tag) refs = refs.filter((r) => r.q.tags.includes(String(q.tag)))
  if (q.wrong === '1') refs = refs.filter((r) => store.stat(r.q.id)?.needsReview)
  if (q.wrong === '1') refs = shuffle(refs)
  ids.value = refs.map((r) => r.q.id)
  idx.value = 0
  drafts.value = ids.value.map(() => [])
  records.value = ids.value.map(() => null)
  finished.value = false
  summaryShown.value = false
  lastSubmittedIdx.value = -1
  combo.value = 0
  bestCombo.value = 0
  sessionXpEarned.value = 0
  persist()
}

const current = computed(() => {
  const id = ids.value[idx.value]
  return id ? questionById(id) : undefined
})

/** 当前显示题目的选择：未提交时是草稿，已提交时是历史答案（只读） */
const selected = computed(() => drafts.value[idx.value] ?? [])

/** 当前显示题目的作答记录：有记录 = 已提交（只读回看），无记录 = 待作答 */
const record = computed(() => records.value[idx.value] ?? null)
const submitted = computed(() => record.value !== null)
const results = computed(() =>
  records.value.filter((r): r is AnswerRecord => r !== null).map((r) => r.correct),
)
const cheer = computed(() => record.value?.cheer ?? '')
/** 历史做过的题：本轮还没做时在答题卡上给个蓝框，不再是「一片空白」 */
const historyIds = computed(() => new Set(Object.keys(store.data.stats)))

function onToggle(key: string) {
  if (submitted.value || !current.value) return
  const prev = selected.value
  const multi = current.value.q.type === 'multiple'
  const next = multi
    ? prev.includes(key)
      ? prev.filter((k) => k !== key)
      : [...prev, key]
    : [key]
  drafts.value[idx.value] = next
}

function onSubmit() {
  if (submitted.value || !current.value || selected.value.length === 0) return
  const ok = setEquals(selected.value, current.value.q.answers)
  // 计分只在这里发生一次；回看历史题不会走到这里
  const xpBeforeAnswer = store.data.xp
  store.recordAnswer(current.value.q.id, ok)
  sessionXpEarned.value += Math.max(0, store.data.xp - xpBeforeAnswer)
  records.value[idx.value] = {
    selected: [...selected.value],
    correct: ok,
    cheer: randomCheer(ok),
  }
  lastSubmittedIdx.value = idx.value
  if (ok) {
    combo.value++
    bestCombo.value = Math.max(bestCombo.value, combo.value)
  } else {
    combo.value = 0
  }
  store.setLastVisit(current.value.moduleId, current.value.chapterId)
}

/** 切到第 i 题：已作答的还原历史答案（只读），未作答的保留自己的草稿 */
function showAt(i: number) {
  if (i < 0 || i >= ids.value.length) return
  idx.value = i
  const r = records.value[i]
  if (r) drafts.value[i] = [...r.selected]
}

function goPrev() {
  showAt(idx.value - 1)
}

/** 题号可任意跳转：已答的只读回看，未答的继续作答，草稿都保留 */
function goToRecord(i: number) {
  showAt(i)
}

const allAnswered = computed(() => results.value.length === ids.value.length)

function onNext() {
  // 按题号顺序往后翻，方便逐题回看记录
  if (idx.value < ids.value.length - 1) {
    showAt(idx.value + 1)
    return
  }
  // 翻到最后一题时，先把没做的题补完，避免跳着做时提前进小结
  const pending = ids.value.findIndex((_, i) => records.value[i] === null)
  if (pending !== -1) {
    showAt(pending)
    return
  }
  // 全部做完：小结已看过就直接返回，不再重复触发彩带与成就检查
  if (summaryShown.value) {
    finished.value = true
    return
  }
  finishSession()
}

const isReviewing = computed(
  () => submitted.value && (summaryShown.value || idx.value !== lastSubmittedIdx.value),
)
const nextLabel = computed(() => {
  if (idx.value < ids.value.length - 1) return '下一题 →'
  if (!allAnswered.value) return '去做未答的题 →'
  return summaryShown.value ? '返回小结 ↑' : '查看小结 →'
})

function finishSession() {
  finished.value = true
  summaryShown.value = true
  // 全对彩带庆祝
  if (results.value.length > 0 && results.value.every(Boolean)) {
    setTimeout(() => confetti(110), 250)
  }
  // 进度型成就（章节掌握 / 模块达标 / 每日目标）
  const groups: string[][] = []
  const scopeModules = route.query.module
    ? allModules.filter((m) => m.meta.id === String(route.query.module))
    : allModules
  for (const m of scopeModules) for (const c of m.chapters) groups.push(c.questions.map((x) => x.id))
  store.checkProgressAchievements(
    groups,
    groups.map((qids) => {
      const s = store.groupStat(qids)
      return s.complete && s.accuracy >= 0.8
    }),
  )
}

function onToggleDoubt() {
  if (current.value) store.toggleDoubt(current.value.q.id)
}

/** 小结页入口：整轮做完后再逐题回看（全部只读） */
function reviewRound() {
  if (!results.value.length) return
  finished.value = false
  showAt(0)
}

const sessionXp = computed(() => sessionXpEarned.value)
const wrongThisRound = computed(() => ids.value.filter((_, i) => records.value[i]?.correct === false))
const wrongRefs = computed(() =>
  wrongThisRound.value
    .map((id) => questionById(id))
    .filter((r): r is QuestionRef => !!r),
)
/** 本轮每题当时实际选了什么，传给学习画像，AI 追问才能指出「你多选/漏选了哪个」 */
const pickedByQid = computed(() => {
  const map: Record<string, string[]> = {}
  ids.value.forEach((qid, i) => {
    const r = records.value[i]
    if (r) map[qid] = [...r.selected]
  })
  return map
})

function retryWrong() {
  ids.value = [...wrongThisRound.value]
  idx.value = 0
  drafts.value = ids.value.map(() => [])
  records.value = ids.value.map(() => null)
  finished.value = false
  summaryShown.value = false
  lastSubmittedIdx.value = -1
}

function restart() {
  build(true)
}

function onKeydown(e: KeyboardEvent) {
  if (finished.value || !current.value) return
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.key === 'ArrowLeft' && submitted.value) {
    e.preventDefault()
    goPrev()
    return
  }
  if (e.key === 'ArrowRight' && submitted.value) {
    e.preventDefault()
    onNext()
    return
  }
  if (e.key === 'Enter') {
    if (submitted.value) onNext()
    else if (selected.value.length) onSubmit()
    return
  }
  const n = Number(e.key)
  if (!submitted.value && n >= 1 && n <= current.value.q.options.length) {
    onToggle(current.value.q.options[n - 1].key)
  }
}

/** 答题状态一变就落盘；换页面、刷新、关标签页时再强制保存一次 */
watch(
  [ids, idx, drafts, records, finished, summaryShown, lastSubmittedIdx, combo, bestCombo, sessionXpEarned],
  () => persist(),
  { deep: true },
)
function onPageHide() {
  persist()
}

watch(() => route.fullPath, () => build())
onMounted(() => {
  build()
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pagehide', onPageHide)
})
onUnmounted(() => {
  persist()
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', onPageHide)
})
</script>

<template>
  <div v-if="!ids.length" class="empty card">
    <div class="big">🗂️</div>
    <p>当前筛选下没有题目（错题重做模式下可能都已回收）。</p>
    <router-link to="/path"><button class="btn btn-primary">去学习路径</button></router-link>
  </div>

  <template v-else-if="!finished && current">
    <div class="exam-header">
      <div>
        <h1 class="page-title" style="font-size: 20px">{{ scopeLabel() }}</h1>
        <span class="muted small">第 {{ idx + 1 }} / {{ ids.length }} 题 · 快捷键：数字键选项 · 回车提交 · ← → 翻页</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px">
        <span v-if="combo >= 2" class="combo-chip">🔥 连对 {{ combo }}</span>
        <div class="bar" style="width: 180px">
          <div class="bar-fill" :style="{ width: (results.length / ids.length) * 100 + '%' }" />
        </div>
      </div>
    </div>

    <div class="record-strip">
      <div class="record-strip-head">
        <strong>本轮答题卡</strong>
        <span class="muted small">
          已答 {{ results.length }} / {{ ids.length }} 题 · 点任意题号直接做那题，进度自动保存，换页面/刷新回来接着做；
          当前题绿实心 / 选过答案绿框 / 答对淡绿 / 答错红 / 蓝框是以前做过 / 灰色没做过
        </span>
      </div>
      <div class="palette">
        <button
          v-for="(qid, i) in ids"
          :key="qid"
          type="button"
          :class="{
            ok: records[i]?.correct === true,
            bad: records[i]?.correct === false,
            picked: !records[i] && (drafts[i]?.length ?? 0) > 0,
            pending: !records[i] && !(drafts[i]?.length ?? 0),
            history: !records[i] && historyIds.has(qid),
            current: i === idx,
          }"
          :title="
            records[i]
              ? `第 ${i + 1} 题：${records[i]?.correct ? '答对' : '答错'}（点开回看）`
              : (drafts[i]?.length ?? 0)
                ? `第 ${i + 1} 题：已选答案，还没提交`
                : historyIds.has(qid)
                  ? `第 ${i + 1} 题：以前做过，本轮还没做（点开作答）`
                  : `第 ${i + 1} 题：还没做（点开作答）`
          "
          @click="goToRecord(i)"
        >
          {{ i + 1 }}
        </button>
      </div>
    </div>

    <div v-if="isReviewing" class="review-tip">
      正在回看第 {{ idx + 1 }} 题的作答记录 · 只读，不会重复加分，也不会改动错题本
    </div>

    <QuestionCard
      :question="current.q"
      :selected="selected"
      :submitted="submitted"
      :doubted="current.q.id in store.data.doubts"
      @toggle="onToggle"
      @submit="onSubmit"
      @toggle-doubt="onToggleDoubt"
    />

    <div v-if="submitted" class="exam-nav">
      <div class="nav-left">
        <button class="btn" :disabled="idx === 0" @click="goPrev">← 上一题</button>
        <span class="cheer" :class="{ sad: record?.correct === false }">{{ cheer }}</span>
      </div>
      <button class="btn btn-primary" @click="onNext">{{ nextLabel }}</button>
    </div>
  </template>

  <div v-else class="card score-hero">
    <h2>本次练习小结</h2>
    <div class="score">{{ results.filter(Boolean).length }}<span class="muted" style="font-size: 24px">/{{ results.length }}</span></div>
    <p class="muted">
      正确率 {{ Math.round((results.filter(Boolean).length / Math.max(1, results.length)) * 100) }}% ·
      最高连对 {{ bestCombo }} · 本次 +{{ sessionXp }} XP
    </p>
    <div class="question-actions" style="justify-content: center">
      <button v-if="results.length" class="btn" @click="reviewRound">回看本轮作答（{{ results.length }} 题）</button>
      <button v-if="wrongThisRound.length" class="btn btn-warn" @click="retryWrong">
        重刷本次错题（{{ wrongThisRound.length }}）
      </button>
      <button class="btn" @click="restart">再来一轮</button>
      <router-link to="/path"><button class="btn">返回路径</button></router-link>
    </div>
  </div>

  <LearnerReport
    v-if="finished"
    :wrong="wrongRefs"
    :total="results.length"
    :picked-by-qid="pickedByQid"
  />
</template>
