import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ActiveExam, ExamRecord, PracticeSession, ProgressData, QuestionStat } from '@/types'
import { dateKey } from '@/lib/utils'
import { questionById } from '@/lib/content'
import { ACHIEVEMENTS, DAILY_GOAL, levelOf, xpForAnswer } from '@/lib/motivation'

const KEY = 'hds_progress_v1'

function defaultData(): ProgressData {
  return {
    version: 1,
    stats: {},
    doubts: {},
    optionMarks: {},
    exams: [],
    daily: {},
    studySeconds: {},
    lastVisit: null,
    activeExam: null,
    practiceSessions: {},
    sqlStats: {},
    sqlFocused: {},
    focusCount: 0,
    xp: 0,
    unlocked: {},
    bestCombo: 0,
    lastGoalCelebrate: '',
  }
}

/** 兼容旧备份里没有的字段，并兜住损坏的练习会话 / 学习时长 / 重点标记数据 */
function normalize(raw: ProgressData): ProgressData {
  const merged = { ...defaultData(), ...raw }
  const sessions = merged.practiceSessions
  if (!sessions || typeof sessions !== 'object' || Array.isArray(sessions)) {
    merged.practiceSessions = {}
  }
  // 旧备份没有 studySeconds；手改坏的 JSON 也可能给个数组/负数/NaN
  const study = merged.studySeconds
  if (!study || typeof study !== 'object' || Array.isArray(study)) {
    merged.studySeconds = {}
  } else {
    const clean: Record<string, number> = {}
    for (const [k, v] of Object.entries(study)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(v) && v > 0) clean[k] = Math.floor(v)
    }
    merged.studySeconds = clean
  }
  // 旧备份没有 sqlFocused；手改坏的 JSON 也可能给数组 / 字符串 / 负数，统一清洗成合法时间戳
  const focused = merged.sqlFocused
  if (!focused || typeof focused !== 'object' || Array.isArray(focused)) {
    merged.sqlFocused = {}
  } else {
    const clean: Record<string, number> = {}
    for (const [k, v] of Object.entries(focused)) {
      if (typeof k === 'string' && typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        clean[k] = Math.floor(v)
      }
    }
    merged.sqlFocused = clean
  }
  // 选项级标记：key 形如 "题目id::选项key"，value 为时间戳。旧备份没有该字段；
  // 手改坏的 JSON 可能给数组/字符串，统一清洗成 key 含 "::" 且 value 为合法时间戳
  const marks = merged.optionMarks
  if (!marks || typeof marks !== 'object' || Array.isArray(marks)) {
    merged.optionMarks = {}
  } else {
    const clean: Record<string, number> = {}
    for (const [k, v] of Object.entries(marks)) {
      if (typeof k === 'string' && k.includes('::') && typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        clean[k] = Math.floor(v)
      }
    }
    merged.optionMarks = clean
  }
  return merged
}

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressData
      if (parsed && parsed.version === 1) return normalize(parsed)
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

/**
 * 写盘保护：把磁盘上已有的「已掌握」标记合并进本次要写的数据。
 * 多标签页各持有一份内存副本，旧标签在写学习时长时会把自己过期的 stats 整份写回，
 * 把新标签刚答对的题冲成未掌握。everCorrect 一旦为 true 就不允许被旧数据改回 false。
 * 主动清空 / 导入备份时不走这个合并（那是用户明确的覆盖意图）。
 */
function withPreservedMastery(next: ProgressData): ProgressData {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return next
  }
  if (!raw) return next
  let prev: ProgressData
  try {
    prev = JSON.parse(raw) as ProgressData
  } catch {
    return next
  }
  if (!prev || prev.version !== 1 || !prev.stats || typeof prev.stats !== 'object') return next
  let stats = next.stats
  let changed = false
  for (const [qid, s] of Object.entries(prev.stats)) {
    if (!s?.everCorrect) continue
    const cur = stats[qid]
    if (cur?.everCorrect) continue
    if (!changed) {
      stats = { ...stats }
      changed = true
    }
    // 保留本次的其他字段（作答次数、错题本状态等），只把 everCorrect 补回 true
    stats[qid] = cur
      ? { ...cur, everCorrect: true }
      : {
          attempts: 0,
          streak: 0,
          everCorrect: true,
          lastCorrect: true,
          needsReview: false,
          lastAt: 0,
        }
  }
  return changed ? { ...next, stats } : next
}

export const useProgressStore = defineStore('progress', () => {
  const data = reactive(load())
  // 主动清空 / 导入备份时跳过上面的合并，否则旧数据会被"复活"
  let skipPreserve = false
  watch(
    data,
    () => {
      const payload = skipPreserve ? data : withPreservedMastery(data)
      skipPreserve = false
      try {
        localStorage.setItem(KEY, JSON.stringify(payload))
      } catch {
        // 隐私模式或容量不足：本次不落盘，不影响内存中的进度
      }
    },
    { deep: true },
  )

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

  /** 选项级标记的复合键：题目 id + 选项 key，避免不同题目同选项互相覆盖 */
  function optionMarkKey(qid: string, optKey: string): string {
    return `${qid}::${optKey}`
  }

  /** 导入坏数据 / 手改 localStorage 后，也保证选项标记容器是个可写对象 */
  function ensureOptionMarks(): Record<string, number> {
    const m = data.optionMarks
    if (!m || typeof m !== 'object' || Array.isArray(m)) data.optionMarks = {}
    return data.optionMarks
  }

  function isOptionMarked(qid: string, optKey: string): boolean {
    const m = data.optionMarks
    return !!m && typeof m === 'object' && !Array.isArray(m) && optionMarkKey(qid, optKey) in m
  }

  /** 选项级标记：点一下标记、再点一下取消；时间戳可用于排序 */
  function toggleOptionMark(qid: string, optKey: string) {
    const marks = ensureOptionMarks()
    const key = optionMarkKey(qid, optKey)
    if (key in marks) delete marks[key]
    else marks[key] = Date.now()
  }

  /** 某题被标记的选项 key 列表（供 QuestionCard 回显星标状态） */
  function markedOptionsOf(qid: string): string[] {
    const m = data.optionMarks
    if (!m || typeof m !== 'object' || Array.isArray(m)) return []
    const prefix = `${qid}::`
    return Object.keys(m)
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length))
  }

  /** 已标记选项总数（设置页数据概览） */
  const optionMarkCount = computed(() => Object.keys(data.optionMarks ?? {}).length)

  /** 导入坏数据 / 手改 localStorage 后，也保证重点标记容器是个可写对象 */
  function ensureSqlFocused(): Record<string, number> {
    const f = data.sqlFocused
    if (!f || typeof f !== 'object' || Array.isArray(f)) data.sqlFocused = {}
    return data.sqlFocused
  }

  /** 手写 SQL 重点标记：点一下标记、再点一下取消；时间戳用于重点题清单排序 */
  function toggleSqlFocus(exId: string) {
    const focused = ensureSqlFocused()
    if (exId in focused) delete focused[exId]
    else focused[exId] = Date.now()
  }

  function unmarkSqlFocus(exId: string) {
    delete ensureSqlFocused()[exId]
  }

  function setLastVisit(moduleId: string, chapterId: string) {
    data.lastVisit = { moduleId, chapterId }
  }

  /** 专注模式完成一次（分钟数只用于文案）：奖励固定 +10 XP */
  function completeFocus(minutes: number) {
    data.focusCount = (data.focusCount ?? 0) + 1
    addXp(10)
    pushToast('🍅', `专注 ${minutes} 分钟完成！`, `第 ${data.focusCount} 次专注 · 奖励 +10 XP，起来喝口水吧`)
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

  /**
   * 保存一次成功的 SQL 解法（仅在通过时调用）。
   * 按 SQL 文本去重：同一段写法只记一条（刷新其通过时间）；不同写法累加。
   * @param match ref=与参考答案一致 / alt=命中官方备选 / own=用户自创独特写法
   */
  function saveSqlSolution(exId: string, sql: string, match: 'ref' | 'alt' | 'own') {
    const s = data.sqlStats[exId] ?? { passed: 0, attempts: 0, viewedAnswer: false, lastAt: 0 }
    s.lastSolution = sql
    const list = s.solutions ?? (s.solutions = [])
    const trimmed = sql.trim()
    const existing = list.find((r) => r.sql.trim() === trimmed)
    if (existing) {
      // 同一写法再次通过：更新分类与时间，不新增条目
      existing.match = match
      existing.at = Date.now()
    } else {
      list.push({ sql, at: Date.now(), match })
    }
    // 最多保留最近 12 条不同写法，避免本地存储无限膨胀
    if (list.length > 12) {
      list.sort((a, b) => b.at - a.at)
      list.length = 12
    }
    data.sqlStats[exId] = s
  }

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

  /** 保存/更新一轮进行中的练习；只保留最近 24 个范围，避免本地存储无限膨胀 */
  function savePracticeSession(session: PracticeSession) {
    if (
      !data.practiceSessions ||
      typeof data.practiceSessions !== 'object' ||
      Array.isArray(data.practiceSessions)
    ) {
      data.practiceSessions = {}
    }
    data.practiceSessions[session.scopeKey] = session
    // 只按 key 做数量裁剪，顺便容忍旧数据里损坏的单条会话
    const all = Object.keys(data.practiceSessions)
      .map((key) => ({ key, at: Number(data.practiceSessions[key]?.lastAt) || 0 }))
      .sort((a, b) => b.at - a.at)
    for (const { key } of all.slice(24)) delete data.practiceSessions[key]
  }

  /**
   * 批量结算有效学习秒数。entry 形如 ['2026-11-11', 15]。
   * 由计时器每隔一段时间调用一次，避免每 1 秒就写一次 localStorage。
   */
  function addStudySeconds(entries: [string, number][]) {
    if (!data.studySeconds || typeof data.studySeconds !== 'object' || Array.isArray(data.studySeconds)) {
      data.studySeconds = {}
    }
    for (const [day, sec] of entries) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(sec) || sec <= 0) continue
      data.studySeconds[day] = (data.studySeconds[day] ?? 0) + Math.floor(sec)
    }
  }

  function importData(json: string): string | null {
    try {
      const parsed = JSON.parse(json) as ProgressData
      if (!parsed || parsed.version !== 1 || typeof parsed.stats !== 'object')
        return '文件格式不符合进度备份要求'
      skipPreserve = true
      Object.assign(data, JSON.parse(JSON.stringify(normalize(parsed))))
      return null
    } catch (e) {
      return '文件解析失败：' + (e instanceof Error ? e.message : String(e))
    }
  }

  function resetAll() {
    skipPreserve = true
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

  /** 重点标记的 SQL 题 id，按标记时间从新到旧 */
  const focusedSqlIds = computed(() => {
    const f = data.sqlFocused
    if (!f || typeof f !== 'object' || Array.isArray(f)) return []
    return Object.keys(f).sort((a, b) => (Number(f[b]) || 0) - (Number(f[a]) || 0))
  })

  function isSqlFocused(exId: string): boolean {
    const f = data.sqlFocused
    return !!f && typeof f === 'object' && !Array.isArray(f) && exId in f
  }

  const todayCount = computed(() => data.daily[dateKey()] ?? 0)

  /* ---------- 学习时长 ---------- */
  const todayStudySeconds = computed(() => data.studySeconds[dateKey()] ?? 0)
  const totalStudySeconds = computed(() =>
    Object.values(data.studySeconds).reduce((n, v) => n + (Number(v) || 0), 0),
  )
  /** 最近 n 天（含今天）的每日秒数，供首页柱状图使用 */
  function recentStudyDays(n = 7): { day: string; label: string; seconds: number }[] {
    const out: { day: string; label: string; seconds: number }[] = []
    const d = new Date()
    const week = ['日', '一', '二', '三', '四', '五', '六']
    for (let i = n - 1; i >= 0; i--) {
      const cur = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i)
      const key = dateKey(cur)
      out.push({
        day: key,
        label: i === 0 ? '今天' : `周${week[cur.getDay()]}`,
        seconds: data.studySeconds[key] ?? 0,
      })
    }
    return out
  }

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
    saveSqlSolution,
    sqlPassedCount,
    checkProgressAchievements,
    markDoubt,
    unmarkDoubt,
    toggleDoubt,
    isOptionMarked,
    toggleOptionMark,
    markedOptionsOf,
    optionMarkCount,
    toggleSqlFocus,
    unmarkSqlFocus,
    isSqlFocused,
    completeFocus,
    setLastVisit,
    startExam,
    saveExamAnswer,
    setExamIndex,
    finishExam,
    clearActiveExam,
    savePracticeSession,
    addStudySeconds,
    importData,
    resetAll,
    stat,
    wrongIds,
    doubtedIds,
    focusedSqlIds,
    todayCount,
    todayStudySeconds,
    totalStudySeconds,
    recentStudyDays,
    streakDays,
    level,
    groupStat,
  }
})
