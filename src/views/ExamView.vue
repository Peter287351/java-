<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { modules, questionById, questionIndex, totalQuestionCount } from '@/lib/content'
import type { QuestionRef } from '@/lib/content'
import { buildExamRecord, pickExamQuestions } from '@/lib/exam'
import { useProgressStore } from '@/stores/progress'
import { formatDuration, setEquals } from '@/lib/utils'
import { confetti } from '@/lib/motivation'
import QuestionCard from '@/components/QuestionCard.vue'

const EXAM_LEN = 20
const EXAM_MINUTES = 25

const store = useProgressStore()
const now = ref(Date.now())
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
    const exam = store.data.activeExam
    if (exam && now.value >= exam.endsAt) submitExam(true)
  }, 1000)
})
onUnmounted(() => window.clearInterval(timer))

const lastResultId = ref<string | null>(null)
const lastResult = computed(() => {
  const exams = store.data.exams
  if (lastResultId.value) return exams.find((e) => e.id === lastResultId.value) ?? null
  return exams.length ? exams[exams.length - 1] : null
})

const phase = computed(() => (store.data.activeExam ? 'running' : lastResult.value ? 'result' : 'setup'))

/* ---------- setup ---------- */
const scope = ref<string>('all')
const scopeOptions = computed(() => [
  { id: 'all', label: `综合卷（全部模块，${totalQuestionCount} 题）` },
  ...modules.map((m) => ({
    id: m.meta.id,
    label: `${m.meta.emoji} ${m.meta.title}（${m.chapters.reduce((n, c) => n + c.questions.length, 0)} 题）`,
  })),
])

function startExam() {
  let pool: QuestionRef[] = [...questionIndex.values()]
  if (scope.value !== 'all') pool = pool.filter((r) => r.moduleId === scope.value)
  if (!pool.length) return
  const picked = pickExamQuestions(pool, Math.min(EXAM_LEN, pool.length))
  const label = scopeOptions.value.find((o) => o.id === scope.value)?.label ?? '综合卷'
  store.startExam({
    id: `exam-${Date.now()}`,
    scopeLabel: label.split('（')[0],
    questionIds: picked.map((p) => p.q.id),
    answers: {},
    index: 0,
    startedAt: now.value,
    endsAt: now.value + EXAM_MINUTES * 60 * 1000,
  })
  lastResultId.value = null
}

/* ---------- running ---------- */
const exam = computed(() => store.data.activeExam)
const remaining = computed(() =>
  exam.value ? Math.max(0, Math.floor((exam.value.endsAt - now.value) / 1000)) : 0,
)
const index = computed(() => exam.value?.index ?? 0)
const current = computed(() => {
  const id = exam.value?.questionIds[index.value]
  return id ? questionById(id) : undefined
})
const answeredCount = computed(
  () => Object.keys(exam.value?.answers ?? {}).filter((k) => exam.value!.answers[k]?.length).length,
)

function goTo(i: number) {
  if (exam.value) store.setExamIndex(i)
}

function onToggle(key: string) {
  if (!exam.value || !current.value) return
  const multi = current.value.q.type === 'multiple'
  const prev = exam.value.answers[current.value.q.id] ?? []
  const next = multi
    ? prev.includes(key)
      ? prev.filter((k) => k !== key)
      : [...prev, key]
    : [key]
  store.saveExamAnswer(current.value.q.id, next)
}

function submitExam(auto = false) {
  const e = exam.value
  if (!e) return
  const unanswered = e.questionIds.length - answeredCount.value
  if (!auto && unanswered > 0 && !window.confirm(`还有 ${unanswered} 题未作答，确认交卷？`)) return
  const record = buildExamRecord(
    e.scopeLabel,
    e.questionIds,
    e.answers,
    Math.round((Date.now() - e.startedAt) / 1000),
  )
  store.finishExam(record)
  lastResultId.value = record.id
  // 高分庆祝
  if (record.total > 0 && record.correct / record.total >= 0.8) {
    setTimeout(() => confetti(130), 300)
  }
}

/* ---------- result ---------- */
function examRemark(record: { correct: number; total: number }): string {
  const r = record.total ? record.correct / record.total : 0
  if (r >= 0.9) return '🏆 出类拔萃！这水平去面试横着走'
  if (r >= 0.8) return '🎉 达到实习达标线！稳住这个手感'
  if (r >= 0.6) return '💪 有底子了，把错题吃透就能跨过 80% 线'
  return '🌱 别急，回章节把知识卡重读一遍再战'
}
function pct(s: { correct: number; total: number }) {
  return s.total ? Math.round((s.correct / s.total) * 100) : 0
}
</script>

<template>
  <!-- 设置卷 -->
  <template v-if="phase === 'setup'">
    <h1 class="page-title">模拟考试</h1>
    <p class="page-sub muted">{{ EXAM_LEN }} 题 · {{ EXAM_MINUTES }} 分钟 · 按难度配比抽题 · 交卷后出考点报告（题库较小，题目可能与练习重复）</p>
    <div class="card" style="max-width: 560px">
      <h3>选择范围</h3>
      <div style="display: flex; flex-direction: column; gap: 10px; margin: 14px 0 20px">
        <label v-for="o in scopeOptions" :key="o.id" style="cursor: pointer">
          <input v-model="scope" type="radio" name="scope" :value="o.id" />
          <span style="margin-left: 8px">{{ o.label }}</span>
        </label>
      </div>
      <button class="btn btn-primary" @click="startExam">开始考试</button>
    </div>

    <div v-if="store.data.exams.length" class="card" style="max-width: 560px; margin-top: 16px">
      <h3>历史成绩</h3>
      <div v-for="e in [...store.data.exams].reverse().slice(0, 5)" :key="e.id" class="wrong-item">
        <strong>{{ e.correct }}/{{ e.total }}</strong>
        <span class="muted"> · {{ e.scopeLabel }} · 用时 {{ formatDuration(e.durationSec) }}</span>
      </div>
    </div>
  </template>

  <!-- 考试中 -->
  <template v-else-if="phase === 'running' && exam && current">
    <div class="exam-header">
      <div>
        <h1 class="page-title" style="font-size: 20px">{{ exam.scopeLabel }}</h1>
        <span class="muted small">已答 {{ answeredCount }}/{{ exam.questionIds.length }}</span>
      </div>
      <div class="timer" :class="{ urgent: remaining < 300 }">⏱ {{ formatDuration(remaining) }}</div>
    </div>

    <div class="palette">
      <button
        v-for="(qid, i) in exam.questionIds"
        :key="qid"
        :class="{ answered: (exam.answers[qid] ?? []).length > 0, current: i === index }"
        @click="goTo(i)"
      >
        {{ i + 1 }}
      </button>
    </div>

    <QuestionCard
      :question="current.q"
      :selected="exam.answers[current.q.id] ?? []"
      :submitted="false"
      exam-mode
      @toggle="onToggle"
    />

    <div class="exam-nav">
      <button class="btn" :disabled="index === 0" @click="goTo(index - 1)">← 上一题</button>
      <div style="display: flex; gap: 10px">
        <button v-if="index < exam.questionIds.length - 1" class="btn btn-primary" @click="goTo(index + 1)">下一题 →</button>
        <button class="btn btn-danger" @click="submitExam(false)">交卷</button>
      </div>
    </div>
  </template>

  <!-- 成绩 -->
  <template v-else-if="phase === 'result' && lastResult">
    <div class="card score-hero">
      <h2>考试结束</h2>
      <div class="score">{{ lastResult.correct }}<span class="muted" style="font-size: 24px">/{{ lastResult.total }}</span></div>
      <p class="muted">{{ lastResult.scopeLabel }} · 用时 {{ formatDuration(lastResult.durationSec) }} · 正确率 {{ Math.round((lastResult.correct / lastResult.total) * 100) }}%</p>
      <p class="cheer" style="font-size: 15px">{{ examRemark(lastResult) }}</p>
    </div>

    <div class="card" style="margin-top: 16px">
      <h3>考点报告</h3>
      <div class="tag-report">
        <div v-for="(s, tag) in lastResult.perTag" :key="tag" class="tag-row">
          <span class="tag-name muted">{{ tag }}</span>
          <div class="bar"><div class="bar-fill" :style="{ width: pct(s) + '%' }" /></div>
          <span class="muted small">{{ s.correct }}/{{ s.total }}</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <h3>错题回顾（{{ lastResult.total - lastResult.correct }} 题）</h3>
      <p v-if="lastResult.total === lastResult.correct" class="muted">全对，漂亮！</p>
      <template v-for="qid in lastResult.questionIds" :key="qid">
        <div v-if="!setEquals(lastResult.answers[qid] ?? [], questionById(qid)?.q.answers ?? [])" class="wrong-item">
          <QuestionCard
            v-if="questionById(qid)"
            :question="questionById(qid)!.q"
            :selected="lastResult.answers[qid] ?? []"
            submitted
          />
        </div>
      </template>
    </div>

    <div class="question-actions" style="justify-content: center; margin: 20px 0">
      <button class="btn btn-primary" @click="lastResultId = null">再来一卷</button>
      <router-link to="/wrong"><button class="btn">去错题本</button></router-link>
    </div>
  </template>
</template>
