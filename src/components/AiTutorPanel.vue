<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import {
  buildChapterPrompt,
  buildQuestionPrompt,
  chatStream,
  getAiConfig,
  getCached,
  setCached,
  SYSTEM_PROMPT,
  type ChatMessage,
} from '@/lib/aiTutor'
import { plainText } from '@/lib/utils'
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

function scrollToEnd() {
  nextTick(() => logEnd.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
}

/** 把 AI 回答切成 文本 / mermaid 段落 */
function splitSegments(text: string): { type: 'text' | 'mermaid'; content: string }[] {
  const out: { type: 'text' | 'mermaid'; content: string }[] = []
  const re = /```mermaid\s*\n([\s\S]*?)```/g
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

async function generate(followupText?: string) {
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
    const full = await chatStream(cfg!, apiMessages, (d) => {
      chatLog.value[logIdx].text += d
      scrollToEnd()
    }, controller.signal)
    chatLog.value[logIdx].text = full
    apiMessages = [...apiMessages, { role: 'assistant', content: full }]
    if (!followupText) setCached(props.cacheKey, full)
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
  apiMessages = apiMessages.slice(0, 2) // system + 初始题目上下文
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

// 切换题目时重置面板
watch(
  () => props.cacheKey,
  () => {
    cfg = getAiConfig()
    apiMessages = []
    chatLog.value = getCached(props.cacheKey) ? [{ role: 'assistant', text: getCached(props.cacheKey)! }] : []
    followup.value = ''
    error.value = ''
  },
)
</script>

<template>
  <div class="ai-tutor">
    <button v-if="!open" class="btn ai-entry" @click="open = true">
      🤖 看不懂？让 AI 直接回答你的问题
    </button>

    <div v-else class="ai-panel card">
      <div class="ai-head">
        <strong>🤖 AI 助教</strong>
        <span class="muted small">直接问，答你所问 · 不复读不套话</span>
        <button class="btn ai-mini" @click="open = false">收起</button>
      </div>

      <template v-if="cfg">
        <div v-if="!chatLog.length && !streaming" class="ai-start">
          <button class="btn btn-primary" @click="generate()">
            {{ getCached(cacheKey) ? '查看讲解' : '🤖 讲解这道题' }}
          </button>
          <span class="muted small">讲完可以直接追问，比如「什么是 IO 多路复用」</span>
        </div>

        <div v-for="(msg, i) in chatLog" :key="i" class="ai-msg" :class="msg.role">
          <div v-if="msg.role === 'user'" class="ai-msg-user">🧑 你问：{{ msg.text }}</div>
          <div v-else class="ai-msg-assistant">
            <template v-for="(seg, j) in splitSegments(msg.text)" :key="j">
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
