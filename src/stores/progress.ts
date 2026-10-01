import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ActiveExam, ExamRecord, ProgressData, QuestionStat } from '@/types'
import { dateKey } from '@/lib/utils'
import { questionById } from '@/lib/content'
import { ACHIEVEMENTS, DAILY_GOAL, levelOf, xpForAnswer } from '@/lib/motivation'

const KEY = 'hds_progress_v1'

function defaultData(): ProgressData {
  return {
    version: 1,
    stats: {},
    doubts: {},
    exams: [],
    daily: {},
    lastVisit: null,
    activeExam: null,
    sqlStats: {},
    xp: 0,
    unlocked: {},
    bestCombo: 0,
    lastGoalCelebrate: '',
  }
}

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressData
      if (parsed && parsed.version === 1) return { ...defaultData(), ...parsed }
    }
  } catch {
    // 数据损坏时重置
  }
  return defaultData()
}

export interface ToastItem {
  key: number
  icon: string
  title: string
  desc: string
}

export const useProgressStore = defineStore('progress', () => {
  const data = reactive(load())
  watch(data, () => localStorage.setItem(KEY, JSON.stringify(data)), { deep: true })

  /* ---------- 激励通知 ---------- */
  const toasts = ref<ToastItem[]>([])
  let toastSeq = 1

  function pushToast(icon: string, title: string, desc: string) {
    const item: ToastItem = { key: toastSeq++, icon, title, desc }
    toasts.value.push(item)
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.key !== item.key)
    }, 4200)
  }

  function unlock(id: string) {
    if (id in data.unlocked) return
    const def = ACHIEVEMENTS.find((a) => a.id === id)
    if (!def) return
    data.unlocked[id] = Date.now()
    pushToast(def.icon, `成就解锁：${def.name}`, def.desc)
  }

  function addXp(n: number) {
    const before = levelOf(data.xp).level
    data.xp += n
    const after = levelOf(data.xp)
    if (after.level > before) pushToast('🎉', `升级！Lv.${after.level} ${after.title}`, '继续加油，实力在增长')
  }

  /* ---------- actions ---------- */

  function recordAnswer(qid: string, correct: boolean) {
    const prev: QuestionStat | undefined = data.stats[qid]
    const firstTime = !prev
    const streak = correct ? (prev?.streak ?? 0) + 1 : 0
    // 错题本：答错进本，连续答对 2 次自动移出
    const needsReview = correct ? (prev?.needsReview ?? false) && streak < 2 : true
    data.stats[qid] = {
      attempts: (prev?.attempts ?? 0) + 1,
      streak,
      everCorrect: (prev?.everCorrect ?? false) || correct,
      lastCorrect: correct,
      needsReview,
      lastAt: Date.now(),
    }
    const k = dateKey()
    data.daily[k] = (data.daily[k] ?? 0) + 1

    // 经验与成就
    const diff = questionById(qid)?.q.difficulty ?? 1
    addXp(xpForAnswer(correct, firstTime, diff))
    if (data.stats[qid].attempts === 1) unlock('first-answer')
    if (streak >= (data.bestCombo ?? 0)) data.bestCombo = streak
    if (streak >= 10) unlock('combo-10')
    const totalAttempts = Object.values(data.stats).reduce((n, s) => n + s.attempts, 0)
    if (totalAttempts >= 100) unlock('hundred')
    if (streakDays.value >= 3) unlock('streak-3')
    if (streakDays.value >= 7) unlock('streak-7')
  }

  /** 章节练习结束/进首页时检查的进度型成就 */
  function checkProgressAchievements(moduleQids: string[][], readyFlags: boolean[]) {
    if (moduleQids.some((ids) => store_groupComplete(ids))) unlock('chapter-clear')
    if (readyFlags.some(Boolean)) unlock('module-ready')
    // 每日目标达成（每天庆祝一次）
    const today = dateKey()
    if ((data.daily[today] ?? 0) >= DAILY_GOAL && data.lastGoalCelebrate !== today) {
      data.lastGoalCelebrate = today
      pushToast('🌈', '今日目标达成！', `已答 ${data.daily[today]} 题，今天很充实`)
    }
  }

  function store_groupComplete(ids: string[]): boolean {
    return ids.length > 0 && ids.every((id) => data.stats[id]?.everCorrect)
  }

  function markDoubt(qid: string) {
    data.doubts[qid] = Date.now()
  }

  function unmarkDoubt(qid: string) {
    delete data.doubts[qid]
  }

  function toggleDoubt(qid: string) {
    if (qid in data.doubts) unmarkDoubt(qid)
    else markDoubt(qid)
  }

  function setLastVisit(moduleId: string, chapterId: string) {
    data.lastVisit = { moduleId, chapterId }
  }

  /** 手写 SQL 练习：每次提交计 1 题到每日目标；首次通过 +20 XP，复过 +6，失败 +2 */
  function recordSqlAttempt(exId: string, passed: boolean, viewedAnswer: boolean): boolean {
    const s = data.sqlStats[exId] ?? { passed: 0, attempts: 0, viewedAnswer: false, lastAt: 0 }
    const firstEverPass = passed && s.passed === 0
    s.attempts++
    if (passed) s.passed++
    if (viewedAnswer) s.viewedAnswer = true
    s.lastAt = Date.now()
    data.sqlStats[exId] = s
    const k = dateKey()
    data.daily[k] = (data.daily[k] ?? 0) + 1
    addXp(passed ? (firstEverPass ? 20 : 6) : 2)
    if (streakDays.value >= 3) unlock('streak-3')
    if (streakDays.value >= 7) unlock('streak-7')
    const today = dateKey()
    if ((data.daily[today] ?? 0) >= DAILY_GOAL && data.lastGoalCelebrate !== today) {
      data.lastGoalCelebrate = today
      pushToast('🌈', '今日目标达成！', `已答 ${data.daily[today]} 题，今天很充实`)
    }
    return firstEverPass
  }

  const sqlPassedCount = computed(
    () => Object.values(data.sqlStats).filter((s) => s.passed > 0).length,
  )

  function startExam(active: ActiveExam) {
    data.activeExam = active
  }

  function saveExamAnswer(qid: string, keys: string[]) {
    if (data.activeExam) data.activeExam.answers[qid] = keys
  }

  function setExamIndex(index: number) {
    if (data.activeExam) data.activeExam.index = index
  }

  function finishExam(record: ExamRecord) {
    data.exams.push(record)
    data.activeExam = null
    addXp(record.correct * 5)
    if (record.total > 0 && record.correct / record.total >= 0.8) unlock('exam-80')
  }

  function clearActiveExam() {
    data.activeExam = null
  }

  function importData(json: string): string | null {
    try {
      const parsed = JSON.parse(json) as ProgressData
      if (!parsed || parsed.version !== 1 || typeof parsed.stats !== 'object')
        return '文件格式不符合进度备份要求'
      Object.assign(data, JSON.parse(JSON.stringify({ ...defaultData(), ...parsed })))
      return null
    } catch (e) {
      return '文件解析失败：' + (e instanceof Error ? e.message : String(e))
    }
  }

  function resetAll() {
    Object.assign(data, defaultData())
  }

  /* ---------- getters ---------- */

  function stat(qid: string): QuestionStat | undefined {
    return data.stats[qid]
  }

  const wrongIds = computed(() =>
    Object.entries(data.stats)
      .filter(([, s]) => s.needsReview)
      .map(([id]) => id),
  )

  const doubtedIds = computed(() => Object.keys(data.doubts))

  const todayCount = computed(() => data.daily[dateKey()] ?? 0)

  /** 连续打卡天数：今天未答题则从昨天起算（今天还没过完不判断签） */
  const streakDays = computed(() => {
    let n = 0
    const d = new Date()
    if (!data.daily[dateKey(d)]) d.setDate(d.getDate() - 1)
    while (data.daily[dateKey(d)]) {
      n++
      d.setDate(d.getDate() - 1)
    }
    return n
  })

  const level = computed(() => levelOf(data.xp))

  /** 一组题目（某章/某模块）的统计 */
  function groupStat(qids: string[]) {
    let done = 0
    let answered = 0
    let correctLast = 0
    for (const id of qids) {
      const s = data.stats[id]
      if (!s) continue
      answered++
      if (s.everCorrect) done++
      if (s.lastCorrect) correctLast++
    }
    return {
      total: qids.length,
      done,
      answered,
      accuracy: answered ? correctLast / answered : 0,
      complete: qids.length > 0 && done === qids.length,
    }
  }

  return {
    data,
    toasts,
    recordAnswer,
    recordSqlAttempt,
    sqlPassedCount,
    checkProgressAchievements,
    markDoubt,
    unmarkDoubt,
    toggleDoubt,
    setLastVisit,
    startExam,
    saveExamAnswer,
    setExamIndex,
    finishExam,
    clearActiveExam,
    importData,
    resetAll,
    stat,
    wrongIds,
    doubtedIds,
    todayCount,
    streakDays,
    level,
    groupStat,
  }
})
