<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { questionById, questionIndex, getChapter, getModule, modules as allModules } from '@/lib/content'
import type { QuestionRef } from '@/lib/content'
import { useProgressStore } from '@/stores/progress'
import { setEquals, shuffle } from '@/lib/utils'
import { randomCheer, confetti } from '@/lib/motivation'
import QuestionCard from '@/components/QuestionCard.vue'

const route = useRoute()
const store = useProgressStore()

const ids = ref<string[]>([])
const idx = ref(0)
const selected = ref<string[]>([])
const submitted = ref(false)
const results = ref<boolean[]>([])
const finished = ref(false)
const combo = ref(0)
const bestCombo = ref(0)
const cheer = ref('')
const xpBefore = ref(0)

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

function build() {
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
  selected.value = []
  submitted.value = false
  results.value = []
  finished.value = false
  combo.value = 0
  bestCombo.value = 0
  cheer.value = ''
  xpBefore.value = store.data.xp
}

const current = computed(() => {
  const id = ids.value[idx.value]
  return id ? questionById(id) : undefined
})

function onToggle(key: string) {
  if (submitted.value || !current.value) return
  const multi = current.value.q.type === 'multiple'
  if (multi) {
    selected.value = selected.value.includes(key)
      ? selected.value.filter((k) => k !== key)
      : [...selected.value, key]
  } else {
    selected.value = [key]
  }
}

function onSubmit() {
  if (submitted.value || !current.value || selected.value.length === 0) return
  const ok = setEquals(selected.value, current.value.q.answers)
  store.recordAnswer(current.value.q.id, ok)
  results.value.push(ok)
  submitted.value = true
  cheer.value = randomCheer(ok)
  if (ok) {
    combo.value++
    bestCombo.value = Math.max(bestCombo.value, combo.value)
  } else {
    combo.value = 0
  }
  store.setLastVisit(current.value.moduleId, current.value.chapterId)
}

function onNext() {
  if (idx.value < ids.value.length - 1) {
    idx.value++
    selected.value = []
    submitted.value = false
    cheer.value = ''
  } else {
    finishSession()
  }
}

function finishSession() {
  finished.value = true
  cheer.value = ''
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

const sessionXp = computed(() => Math.max(0, store.data.xp - xpBefore.value))
const wrongThisRound = computed(() => ids.value.filter((_, i) => !results.value[i]))

function retryWrong() {
  ids.value = [...wrongThisRound.value]
  idx.value = 0
  selected.value = []
  submitted.value = false
  results.value = []
  finished.value = false
}

function restart() {
  build()
}

function onKeydown(e: KeyboardEvent) {
  if (finished.value || !current.value) return
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

watch(() => route.fullPath, build)
onMounted(() => {
  build()
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
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
        <span class="muted small">第 {{ idx + 1 }} / {{ ids.length }} 题 · 快捷键：数字键选项 · 回车提交</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px">
        <span v-if="combo >= 2" class="combo-chip">🔥 连对 {{ combo }}</span>
        <div class="bar" style="width: 180px">
          <div class="bar-fill" :style="{ width: ((idx + (submitted ? 1 : 0)) / ids.length) * 100 + '%' }" />
        </div>
      </div>
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
      <span class="cheer" :class="{ sad: !results[results.length - 1] }">{{ cheer }}</span>
      <button class="btn btn-primary" @click="onNext">
        {{ idx === ids.length - 1 ? '查看小结 →' : '下一题 →' }}
      </button>
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
      <button v-if="wrongThisRound.length" class="btn btn-warn" @click="retryWrong">
        重刷本次错题（{{ wrongThisRound.length }}）
      </button>
      <button class="btn" @click="restart">再来一轮</button>
      <router-link to="/path"><button class="btn">返回路径</button></router-link>
    </div>
  </div>
</template>
