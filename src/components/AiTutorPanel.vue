<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import {
  buildChapterPrompt,
  buildQuestionPrompt,
  chatStream,
  deleteAiRecord,
  getAiConfig,
  getCached,
  recordsForGroup,
  saveAiRecord,
  setCached,
  SYSTEM_PROMPT,
  type AiRecord,
  type ChatMessage,
} from '@/lib/aiTutor'
import { formatDateTime, plainText } from '@/lib/utils'
import MermaidBlock from './MermaidBlock.vue'

const props = withDefaults(
  defineProps<{
    cacheKey: string
    payload: {
      stem?: string
      options?: { key: string; text: string }[]
      answers?: string[]
      explanation?: string
      cardText?: string
      title?: string
    }
    kind?: 'question' | 'chapter'
    /** 历史记录聚合键：同一题的讲背景/讲答案两阶段共用（默认用 cacheKey） */
    groupKey?: string
  }>(),
  { kind: 'question' },
)

let cfg = getAiConfig()
const open = ref(false)
const streaming = ref(false)
const error = ref('')
const followup = ref('')
const copied = ref(false)
/** 对话记录：assistant 为主气泡，用户追问为右侧小气泡 */
const chatLog = ref<{ role: 'user' | 'assistant'; text: string }[]>([])
const logEnd = ref<HTMLElement | null>(null)
/** 历史记录 */
const recordsOpen = ref(false)
const currentRecordId = ref<string | null>(null)
const recordVersion = ref(0) // 触发记录列表刷新

let controller: AbortController | null = null
let apiMessages: ChatMessage[] = []

const initialPrompt = computed(() =>
  props.kind === 'chapter'
    ? buildChapterPrompt(props.payload.title ?? '这一章', props.payload.cardText ?? '')
    : buildQuestionPrompt({
        stem: props.payload.stem ?? '',
        options: props.payload.options,
        answers: props.payload.answers,
        explanation: props.payload.explanation,
      }),
)

const fallbackQuestion = computed(() => {
  if (props.kind === 'chapter')
    return `我是后端初学者，请用生活化类比给我讲讲「${props.payload.title ?? ''}」这一章的核心概念，并举一个真实工作场景。`
  return buildQuestionPrompt({
    stem: plainText(props.payload.stem ?? '', 200),
    answers: props.payload.answers,
    explanation: props.payload.explanation ? plainText(props.payload.explanation, 150) : undefined,
  })
})

const cacheKey = computed(() => props.cacheKey)
/** 历史按题目聚合：同一题两个阶段（讲背景/讲答案）的对话互可见 */
const groupKey = computed(() => props.groupKey ?? props.cacheKey)

const keyRecords = computed(() => {
  void recordVersion.value
  return recordsForGroup(groupKey.value)
})

function scrollToEnd() {
  nextTick(() => logEnd.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
}

/** 把 AI 回答切成 文本 / mermaid 段落；allowUnclosed 容忍 AI 忘写闭合围栏（仅对已完成的消息启用） */
function splitSegments(
  text: string,
  allowUnclosed = false,
): { type: 'text' | 'mermaid'; content: string }[] {
  const out: { type: 'text' | 'mermaid'; content: string }[] = []
  const closer = allowUnclosed ? '(?:```|$)' : '```'
  const re = new RegExp('```mermaid\\s*\\n([\\s\\S]*?)' + closer, 'g')
  let last = 0
  for (const m of text.matchAll(re)) {
    const before = text.slice(last, m.index).replace(/\*\*/g, '').trim()
    if (before) out.push({ type: 'text', content: before })
    out.push({ type: 'mermaid', content: m[1] })
    last = m.index + m[0].length
  }
  const tail = text.slice(last).replace(/\*\*/g, '').trim()
  if (tail) out.push({ type: 'text', content: tail })
  return out.length ? out : [{ type: 'text', content: text.replace(/\*\*/g, '') }]
}

/** 正在流式的最后一条消息不启用未闭合容错（避免边流边重渲染图表） */
function allowUnclosedMsg(i: number): boolean {
  return !(streaming.value && i === chatLog.value.length - 1)
}

/** 恢复一条历史记录到对话区（可继续追问） */
function restoreRecord(rec: AiRecord) {
  apiMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...rec.messages.map((m) => ({ ...m }))]
  currentRecordId.value = rec.id
  chatLog.value = rec.messages
    .filter((m, i) => !(i === 0 && m.role === 'user')) // 首条 user 是题目上下文，不重复展示
    .map((m) => ({ role: m.role as 'user' | 'assistant', text: m.content }))
  recordsOpen.value = false
  error.value = ''
  scrollToEnd()
}

/** 把当前对话存进历史（自动：初始讲解建新记录，追问续写原记录） */
function persistCurrent() {
  const msgs = apiMessages.filter((m) => m.role !== 'system')
  if (!msgs.length) return
  const rec: AiRecord = {
    id: currentRecordId.value ?? `${cacheKey.value}:${Date.now()}`,
    cacheKey: cacheKey.value,
    date: Date.now(),
    messages: msgs,
  }
  currentRecordId.value = rec.id
  saveAiRecord(rec)
  recordVersion.value++
}

async function generate(followupText?: string) {
  if (!cfg) return
  error.value = ''
  streaming.value = true
  controller = new AbortController()
  try {
    if (!apiMessages.length) {
      apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: initialPrompt.value },
      ]
    } else if (followupText) {
      apiMessages = [...apiMessages, { role: 'user', content: followupText }]
    }
    if (!followupText) chatLog.value = []
    chatLog.value.push({ role: 'assistant', text: '' })
    const logIdx = chatLog.value.length - 1
    const full = await chatStream(cfg, apiMessages, (d) => {
      chatLog.value[logIdx].text += d
      scrollToEnd()
    }, controller.signal)
    chatLog.value[logIdx].text = full
    apiMessages = [...apiMessages, { role: 'assistant', content: full }]
    if (!followupText) setCached(cacheKey.value, full)
    persistCurrent()
    scrollToEnd()
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      error.value = e instanceof Error ? e.message : String(e)
      if (chatLog.value.length && chatLog.value[chatLog.value.length - 1].role === 'assistant' && !chatLog.value[chatLog.value.length - 1].text) {
        chatLog.value.pop()
      }
    }
  } finally {
    streaming.value = false
    controller = null
  }
}

function ask(text: string) {
  const t = text.trim()
  if (!t || streaming.value) return
  chatLog.value.push({ role: 'user', text: t })
  scrollToEnd()
  generate(t)
}

function regenerate() {
  apiMessages = apiMessages.slice(0, 2)
  chatLog.value = []
  generate()
}

function stop() {
  controller?.abort()
}

function copyFallback() {
  navigator.clipboard?.writeText(fallbackQuestion.value).catch(() => {})
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function removeRecord(id: string) {
  if (!window.confirm('删除这条历史记录？')) return
  deleteAiRecord(id)
  if (currentRecordId.value === id) currentRecordId.value = null
  recordVersion.value++
}

function recordPreview(rec: AiRecord): string {
  const first = rec.messages.find((m) => m.role === 'assistant')
  return first ? plainText(first.content, 70) : '(空)'
}

// 切换题目时：优先恢复最近一条历史记录（含追问），否则退回缓存
watch(
  () => props.cacheKey,
  () => {
    cfg = getAiConfig()
    apiMessages = []
    currentRecordId.value = null
    recordsOpen.value = false
    error.value = ''
    followup.value = ''
    const latest = recordsForGroup(groupKey.value)[0]
    if (latest) {
      restoreRecord(latest)
      return
    }
    chatLog.value = getCached(props.cacheKey) ? [{ role: 'assistant', text: getCached(props.cacheKey)! }] : []
  },
)

function openPanel() {
  open.value = true
  if (!chatLog.value.length) {
    const latest = recordsForGroup(groupKey.value)[0]
    if (latest) restoreRecord(latest)
    else if (getCached(cacheKey.value)) {
      chatLog.value = [{ role: 'assistant', text: getCached(cacheKey.value)! }]
      currentRecordId.value = null
    }
  }
}
</script>

<template>
  <div class="ai-tutor">
    <button v-if="!open" class="btn ai-entry" @click="openPanel">
      🤖 看不懂？让 AI 直接回答你的问题
      <span v-if="keyRecords.length" class="ai-entry-badge">🕘 {{ keyRecords.length }}</span>
    </button>

    <div v-else class="ai-panel card">
      <div class="ai-head">
        <strong>🤖 AI 助教</strong>
        <span class="muted small">直接问，答你所问 · 对话自动保存</span>
        <span class="ai-head-actions">
          <button class="btn ai-mini" :class="recordsOpen ? 'btn-primary ai-mini' : ''" @click="recordsOpen = !recordsOpen">
            🕘 记录（{{ keyRecords.length }}）
          </button>
          <button class="btn ai-mini" @click="open = false">收起</button>
        </span>
      </div>

      <!-- 已配置：记录列表 + 对话区 -->
      <template v-if="cfg">
      <!-- 历史记录列表 -->
      <div v-if="recordsOpen" class="ai-records">
        <p v-if="!keyRecords.length" class="muted small" style="margin: 4px 0">这道题还没有历史记录。</p>
        <div v-for="rec in keyRecords" :key="rec.id" class="ai-record">
          <div class="ai-record-main" @click="restoreRecord(rec)">
            <p class="ai-record-preview">{{ recordPreview(rec) }}</p>
            <p class="muted small" style="margin: 0">{{ formatDateTime(rec.date) }} · {{ rec.messages.length - 1 }} 条消息 · 点击恢复对话</p>
          </div>
          <button class="btn ai-mini btn-danger" @click.stop="removeRecord(rec.id)">删除</button>
        </div>
        <p v-if="keyRecords.length" class="muted small" style="margin: 6px 0 0">
          恢复后可以基于旧对话继续追问；对话随浏览器保存，最多保留 100 条。
        </p>
      </div>

      <!-- 对话区 -->
      <template v-else>
        <div v-if="!chatLog.length && !streaming" class="ai-start">
          <button class="btn btn-primary" @click="generate()">
            {{ getCached(cacheKey) ? '查看讲解' : '🤖 讲解这道题' }}
          </button>
          <span class="muted small">讲完可以直接追问，比如「什么是 IO 多路复用」</span>
        </div>

        <div v-for="(msg, i) in chatLog" :key="i" class="ai-msg" :class="msg.role">
          <div v-if="msg.role === 'user'" class="ai-msg-user">🧑 你问：{{ msg.text }}</div>
          <div v-else class="ai-msg-assistant">
            <template v-for="(seg, j) in splitSegments(msg.text, allowUnclosedMsg(i))" :key="j">
              <div v-if="seg.type === 'text'" class="ai-text">{{ seg.content }}</div>
              <MermaidBlock v-else :code="seg.content" />
            </template>
          </div>
        </div>
        <div v-if="streaming && chatLog.length && !chatLog[chatLog.length - 1].text" class="ai-streaming">
          正在回答<span class="dots">…</span>
        </div>

        <div v-if="error" class="ai-error">{{ error }}</div>

        <div class="ai-follow">
          <input
            v-model="followup"
            type="text"
            placeholder="直接输入你的问题，比如「什么是 IO 多路复用」"
            @keydown.enter="ask(followup)"
          />
          <button class="btn btn-primary" :disabled="!followup.trim() || streaming" @click="ask(followup)">提问</button>
          <button v-if="chatLog.length" class="btn" :disabled="streaming" @click="regenerate">重新讲解</button>
          <button v-if="streaming" class="btn btn-danger" @click="stop">停止</button>
        </div>
      </template>
      </template>

      <!-- 未配置：降级引导 -->
      <template v-else>
        <p class="small" style="margin: 6px 0">
          配置一个 AI Key 后，这里会<b>直接回答你提的问题</b>（类比先行、大白话、可追问、可画图），不用再跳出去查资料。
        </p>
        <div class="ai-actions">
          <router-link to="/settings"><button class="btn btn-primary">去设置页配置（1 分钟）</button></router-link>
          <button class="btn" @click="copyFallback">{{ copied ? '已复制 ✓' : '复制问题' }}</button>
          <a class="btn" href="https://www.kimi.com/" target="_blank" rel="noopener">打开 Kimi ↗</a>
        </div>
        <p class="ai-fallback-q">{{ fallbackQuestion }}</p>
      </template>
    </div>
  </div>
</template>
