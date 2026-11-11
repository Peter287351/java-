import { ref } from 'vue'
import { dateKey } from './utils'

/**
 * 有效学习时长计时器。
 *
 * 规则（避免「挂机刷时长」）：
 * - 只有页面可见、窗口有焦点、且最近 2 分钟内有鼠标/键盘/滚动/触摸操作，才算在学习；
 * - 切到别的标签、最小化、长时间发呆，计时暂停；
 * - 每 15 秒批量结算一次到进度数据（按当天日期分桶，跨零点自动拆到两天）；
 * - 页面隐藏 / 关闭时立刻结算，尽量不丢时间；
 * - 「本次会话」存在 sessionStorage：刷新页面能接着算，关掉标签页才重新开头。
 */

/** 本次会话累计的有效学习秒数（响应式，顶部计时直接读它） */
export const sessionSeconds = ref(0)
/** 当前是否正在计时 */
export const isStudying = ref(false)
/** 是否因为长时间没有操作而暂停 */
export const isIdle = ref(false)

const IDLE_MS = 2 * 60 * 1000
const FLUSH_MS = 15_000
const SESSION_KEY = 'hds_study_session_v1'

type FlushFn = (entries: [string, number][]) => void

let started = false
let onFlush: FlushFn | null = null
let tickTimer: number | undefined
let flushTimer: number | undefined
let lastTickAt = 0
let lastActiveAt = 0
let lastSessionWriteAt = 0
let visible = true
let focused = true
/** 未结算的秒数，按日期分桶 */
let pending = new Map<string, number>()

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

function readSession(): number {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return 0
    const v = JSON.parse(raw) as { seconds?: unknown }
    return Number.isFinite(v.seconds) && (v.seconds as number) > 0
      ? Math.floor(v.seconds as number)
      : 0
  } catch {
    return 0
  }
}

function writeSession(force = false) {
  const now = Date.now()
  if (!force && now - lastSessionWriteAt < 10_000) return
  lastSessionWriteAt = now
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ seconds: sessionSeconds.value }))
  } catch {
    // 隐私模式 / 存储被禁用时，仅内存计时，不影响使用
  }
}

function flush() {
  if (!onFlush || pending.size === 0) return
  const entries = [...pending.entries()]
  pending = new Map()
  onFlush(entries)
}

function onActivity() {
  lastActiveAt = Date.now()
}

function onVisibility() {
  visible = document.visibilityState === 'visible'
  if (!visible) {
    // 切走时把已累计的时间立刻落盘，且不要把后台时间算进来
    flush()
    writeSession(true)
    isStudying.value = false
  } else {
    lastActiveAt = Date.now()
    lastTickAt = Date.now()
  }
}

function onFocus() {
  focused = true
  lastActiveAt = Date.now()
  lastTickAt = Date.now()
}

function onBlur() {
  focused = false
  flush()
  writeSession(true)
  isStudying.value = false
}

function onPageHide() {
  flush()
  writeSession(true)
}

function tick() {
  const now = Date.now()
  const elapsed = Math.min(5, Math.max(0, Math.round((now - lastTickAt) / 1000)))
  lastTickAt = now

  const idle = now - lastActiveAt > IDLE_MS
  isIdle.value = visible && focused && idle
  const active = visible && focused && !idle && elapsed > 0

  if (!active) {
    isStudying.value = false
    return
  }

  isStudying.value = true
  sessionSeconds.value += elapsed
  const day = dateKey(new Date(now))
  pending.set(day, (pending.get(day) ?? 0) + elapsed)
  writeSession()
}

/**
 * 在应用根组件挂载时调用一次。传入的 flush 回调负责把秒数写进进度数据。
 * 重复调用是安全的（幂等），路由切换不会重复起计时器。
 */
export function startStudyTimer(flushFn: FlushFn): () => void {
  if (started) return stopStudyTimer
  started = true
  onFlush = flushFn

  sessionSeconds.value = readSession()
  visible = typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  // 不初始读 hasFocus()：嵌入预览面板 / iframe 时它常返回 false，会让计时一直不启动。
  // 只在真正收到 blur 事件时才认为失焦，focus 事件再恢复。
  focused = true
  lastActiveAt = Date.now()
  lastTickAt = Date.now()
  lastSessionWriteAt = 0
  writeSession(true)

  for (const ev of ACTIVITY_EVENTS) {
    window.addEventListener(ev, onActivity, { passive: true, capture: true })
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('focus', onFocus)
  window.addEventListener('blur', onBlur)
  window.addEventListener('pagehide', onPageHide)

  tickTimer = window.setInterval(tick, 1000)
  flushTimer = window.setInterval(flush, FLUSH_MS)
  return stopStudyTimer
}

/** 清空全部数据时调用：本次会话从 0 重新开始，历史记录由 store 负责清掉 */
export function resetStudySession() {
  sessionSeconds.value = 0
  pending = new Map()
  lastActiveAt = Date.now()
  lastTickAt = Date.now()
  writeSession(true)
}

export function stopStudyTimer() {
  if (!started) return
  started = false
  flush()
  writeSession(true)
  onFlush = null
  for (const ev of ACTIVITY_EVENTS) {
    window.removeEventListener(ev, onActivity, { capture: true })
  }
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('focus', onFocus)
  window.removeEventListener('blur', onBlur)
  window.removeEventListener('pagehide', onPageHide)
  if (tickTimer !== undefined) window.clearInterval(tickTimer)
  if (flushTimer !== undefined) window.clearInterval(flushTimer)
  tickTimer = undefined
  flushTimer = undefined
  isStudying.value = false
}
