<script setup lang="ts">
import { computed, ref } from 'vue'
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

const props = withDefaults(
  defineProps<{
    cacheKey: string
    /** 初始讲解的提示词内容（题目/章节讲义） */
    payload: { stem?: string; options?: { key: string; text: string }[]; answers?: string[]; explanation?: string; cardText?: string; title?: string }
    kind?: 'question' | 'chapter'
  }>(),
  { kind: 'question' },
)

const cfg = getAiConfig()
const open = ref(false)
const streaming = ref(false)
const answer = ref<string>(getCached(props.cacheKey) ?? '')
const error = ref('')
const followup = ref('')
const copied = ref(false)

let controller: AbortController | null = null
let messages: ChatMessage[] = []

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

async function generate(followupText?: string) {
  error.value = ''
  streaming.value = true
  controller = new AbortController()
  try {
    if (!messages.length) {
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: initialPrompt.value },
      ]
    } else if (followupText) {
      messages = [...messages, { role: 'user', content: followupText }]
    }
    if (!followupText) answer.value = ''
    const full = await chatStream(cfg!, messages, (d) => {
      answer.value += d
    }, controller.signal)
    messages = [...messages, { role: 'assistant', content: full }]
    if (!followupText) setCached(props.cacheKey, full)
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      error.value = e instanceof Error ? e.message : String(e)
    }
  } finally {
    streaming.value = false
    controller = null
  }
}

function regenerate() {
  messages = []
  answer.value = ''
  generate()
}

function sendFollowup() {
  const text = followup.value.trim()
  if (!text || streaming.value) return
  followup.value = ''
  answer.value += '\n\n—— 追问 ——\n'
  generate(text)
}

function stop() {
  controller?.abort()
}

function copyFallback() {
  navigator.clipboard?.writeText(fallbackQuestion.value).catch(() => {})
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="ai-tutor">
    <!-- 未展开：一个不吵人的入口 -->
    <button v-if="!open" class="btn ai-entry" @click="open = true">
      🤖 看不懂？让 AI 用人话讲给我听
    </button>

    <div v-else class="ai-panel card">
      <div class="ai-head">
        <strong>🤖 AI 助教</strong>
        <span class="muted small">类比先行 · 大白话 · 300 字内</span>
        <button class="btn ai-mini" @click="open = false">收起</button>
      </div>

      <!-- 已配置 -->
      <template v-if="cfg">
        <div v-if="!answer && !streaming" class="ai-start">
          <button class="btn btn-primary" @click="generate()">
            {{ getCached(cacheKey) ? '查看讲解' : '🤖 用人话讲给我听' }}
          </button>
          <span class="muted small">大约 10 秒，讲完存本地缓存，下次秒开</span>
        </div>

        <div v-if="answer" class="ai-output">{{ answer }}</div>
        <div v-if="streaming" class="ai-streaming">正在讲解<span class="dots">…</span></div>

        <div v-if="error" class="ai-error">{{ error }}</div>

        <div v-if="answer && !streaming" class="ai-follow">
          <input
            v-model="followup"
            type="text"
            placeholder="没懂？继续追问，比如「再举个更生活的例子」"
            @keydown.enter="sendFollowup"
          />
          <button class="btn btn-primary" :disabled="!followup.trim()" @click="sendFollowup">追问</button>
          <button class="btn" :disabled="streaming" @click="regenerate">换个角度再讲</button>
          <button v-if="streaming" class="btn btn-danger" @click="stop">停止</button>
        </div>
      </template>

      <!-- 未配置：降级引导 -->
      <template v-else>
        <p class="small" style="margin: 6px 0">
          配置一个 AI Key 后，这里会用<b>生活化类比 + 大白话</b>逐题讲解、还能无限追问，不用再跳出去查资料。
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
