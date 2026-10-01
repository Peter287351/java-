<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { totalQuestionCount } from '@/lib/content'

const store = useProgressStore()

const hidden = ref(localStorage.getItem('hds_mascot_hidden') === '1')
const bubble = ref('')
const bouncing = ref(false)
let rotateTimer: number | undefined
let bounceTimer: number | undefined

const idleLines = [
  '每天 10 题，实习稳稳的～ ☕',
  '遇到错题别怕，我陪你复盘！📝',
  '连续打卡会变强哦，别断签 🔥',
  '写 SQL 手酸了就喝口水再战～',
  '知识点卡要先读再做题，效率翻倍 ✨',
  '模考 25 分钟，模拟真实面试手感！',
  '我很轻的，纯 CSS 画的，不费电 ⚡',
]

const dynamicLine = computed(() => {
  const done = store.data.stats ? Object.values(store.data.stats).filter((s) => s.everCorrect).length : 0
  const wrong = store.wrongIds.length
  const today = store.todayCount
  if (wrong > 0) return `错题本还有 ${wrong} 题等你回收，答对 2 次就能移出～`
  if (today >= 10) return `今日已答 ${today} 题，目标达成！我为你骄傲 🌈`
  if (done > 0) return `已经掌握 ${done}/${totalQuestionCount} 题啦，继续保持！`
  return '点开学习路径，从 Java 基础开始吧！🚀'
})

function show(text: string) {
  bubble.value = text
}

function rotate() {
  show(dynamicLine.value)
}

function onClick() {
  bouncing.value = true
  clearTimeout(bounceTimer)
  bounceTimer = window.setTimeout(() => (bouncing.value = false), 550)
  const pool = [
    ...idleLines,
    '戳我干嘛，快去学习！（骄傲脸）',
    '我会一直在右下角陪着你的 ⚡',
    `现在是 Lv.${store.level.level} ${store.level.title}，变强看得见！`,
  ]
  show(pool[Math.floor(Math.random() * pool.length)])
}

function toggleHide() {
  hidden.value = true
  localStorage.setItem('hds_mascot_hidden', '1')
}

function restore() {
  hidden.value = false
  localStorage.setItem('hds_mascot_hidden', '0')
}

// 成就/目标通知时联动播报
watch(
  () => store.toasts.length,
  (n, old) => {
    if (n > (old ?? 0) && store.toasts.length) {
      const t = store.toasts[store.toasts.length - 1]
      show(`${t.icon} ${t.title.replace('成就解锁：', '解锁成就 ')}`)
    }
  },
)

onMounted(() => {
  rotate()
  rotateTimer = window.setInterval(() => {
    // 一半概率给动态数据，一半给闲聊
    show(Math.random() < 0.5 ? dynamicLine.value : idleLines[Math.floor(Math.random() * idleLines.length)])
  }, 8000)
})

onUnmounted(() => {
  clearInterval(rotateTimer)
  clearTimeout(bounceTimer)
})
</script>

<template>
  <div v-if="!hidden" class="mascot">
    <div v-if="bubble" class="mascot-bubble" v-html="bubble" />
    <div class="mascot-body" :class="{ hi: bouncing }" @click="onClick">
      <button class="mascot-close" title="收起（可随时找回）" @click.stop="toggleHide">×</button>
      <svg width="150" height="180" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mHair" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#8a93ff" />
            <stop offset="0.6" stop-color="#6a72e8" />
            <stop offset="1" stop-color="#545cd6" />
          </linearGradient>
          <linearGradient id="mHairTail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7a83f5" />
            <stop offset="0.75" stop-color="#6a72e8" />
            <stop offset="1" stop-color="#38d9f5" />
          </linearGradient>
          <linearGradient id="mHoodie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7c8cff" />
            <stop offset="1" stop-color="#4d5bd0" />
          </linearGradient>
          <radialGradient id="mEye" cx="0.4" cy="0.3" r="1">
            <stop offset="0" stop-color="#7de9ff" />
            <stop offset="0.55" stop-color="#4f6ef2" />
            <stop offset="1" stop-color="#2b35b8" />
          </radialGradient>
        </defs>

        <!-- 双马尾 -->
        <g class="mascot-tail-l">
          <path d="M34 92 C 14 118, 16 160, 30 186 C 40 172, 44 140, 44 112 Z" fill="url(#mHairTail)" />
          <ellipse cx="30" cy="180" rx="7" ry="10" fill="#38d9f5" opacity="0.85" />
        </g>
        <g class="mascot-tail-r">
          <path d="M166 92 C 186 118, 184 160, 170 186 C 160 172, 156 140, 156 112 Z" fill="url(#mHairTail)" />
          <ellipse cx="170" cy="180" rx="7" ry="10" fill="#38d9f5" opacity="0.85" />
        </g>

        <!-- 头发后层 -->
        <ellipse cx="100" cy="82" rx="52" ry="50" fill="url(#mHair)" />

        <!-- 腿 -->
        <g fill="url(#mHoodie)">
          <rect x="84" y="196" width="12" height="26" rx="6" transform="rotate(4 90 196)" />
          <rect x="104" y="196" width="12" height="26" rx="6" transform="rotate(-4 110 196)" />
        </g>
        <ellipse cx="87" cy="224" rx="9" ry="6" fill="#2b35b8" />
        <ellipse cx="112" cy="222" rx="9" ry="6" fill="#2b35b8" />

        <!-- 身体（卫衣） -->
        <path d="M100 118 C 76 122, 64 140, 62 178 C 62 196, 76 204, 100 204 C 124 204, 138 196, 138 178 C 136 140, 124 122, 100 118 Z" fill="url(#mHoodie)" />
        <path d="M88 120 L100 138 L112 120" stroke="#3a46b5" stroke-width="3" fill="none" stroke-linecap="round" />
        <line x1="100" y1="140" x2="100" y2="200" stroke="#3a46b5" stroke-width="2" opacity="0.7" />
        <!-- 胸前 ⚡ -->
        <path d="M104 150 L94 168 L101 168 L97 182 L109 163 L102 163 Z" fill="#38d9f5" />

        <!-- 手臂 + 笔记本 -->
        <path d="M66 148 C 60 160, 62 172, 72 178 L 80 170 C 72 164, 71 156, 74 148 Z" fill="#6a72e8" />
        <path d="M134 148 C 140 160, 138 172, 128 178 L 120 170 C 128 164, 129 156, 126 148 Z" fill="#6a72e8" />
        <g transform="rotate(-4 100 176)">
          <rect x="70" y="160" width="60" height="34" rx="6" fill="#0f172a" stroke="#38d9f5" stroke-width="2" />
          <text x="100" y="184" text-anchor="middle" font-size="19" font-weight="bold" fill="#38d9f5" font-family="monospace">Z_</text>
        </g>

        <!-- 脸 -->
        <ellipse cx="100" cy="84" rx="45" ry="41" fill="#ffe3d2" />
        <!-- 刘海 -->
        <path d="M56 78 C 52 40, 78 30, 100 30 C 122 30, 148 40, 144 78 C 138 66, 132 62, 126 70 C 120 58, 110 56, 104 64 C 96 54, 84 56, 80 68 C 72 60, 62 64, 56 78 Z" fill="url(#mHair)" />
        <!-- 侧发 -->
        <path d="M56 76 C 54 92, 56 102, 60 110 C 64 100, 64 88, 62 76 Z" fill="url(#mHair)" />
        <path d="M144 76 C 146 92, 144 102, 140 110 C 136 100, 136 88, 138 76 Z" fill="url(#mHair)" />
        <!-- 呆毛 -->
        <path d="M100 30 C 96 18, 104 12, 114 16 C 106 16, 102 22, 100 30 Z" fill="#38d9f5" />
        <!-- ⚡发夹 -->
        <g transform="translate(126 52) rotate(14)">
          <path d="M4 0 L-2 10 L2 10 L0 18 L8 7 L4 7 Z" fill="#ffd166" stroke="#eab308" stroke-width="0.8" />
        </g>

        <!-- 眼睛（可眨） -->
        <g class="mascot-eyes">
          <ellipse cx="84" cy="94" rx="8.5" ry="11" fill="white" />
          <ellipse cx="116" cy="94" rx="8.5" ry="11" fill="white" />
          <ellipse cx="84" cy="95" rx="6.5" ry="9" fill="url(#mEye)" />
          <ellipse cx="116" cy="95" rx="6.5" ry="9" fill="url(#mEye)" />
          <ellipse cx="84" cy="97" rx="2.8" ry="4.2" fill="#141a3d" />
          <ellipse cx="116" cy="97" rx="2.8" ry="4.2" fill="#141a3d" />
          <circle cx="81.5" cy="90" r="2" fill="white" />
          <circle cx="113.5" cy="90" r="2" fill="white" />
          <circle cx="86.5" cy="99.5" r="1" fill="white" opacity="0.85" />
          <circle cx="118.5" cy="99.5" r="1" fill="white" opacity="0.85" />
          <path d="M75 84 Q 84 79, 93 84" stroke="#2a2f4a" stroke-width="2.4" fill="none" stroke-linecap="round" />
          <path d="M107 84 Q 116 79, 125 84" stroke="#2a2f4a" stroke-width="2.4" fill="none" stroke-linecap="round" />
        </g>

        <!-- 腮红 & 嘴 -->
        <ellipse cx="72" cy="106" rx="7" ry="3.8" fill="#ff9d9d" opacity="0.55" />
        <ellipse cx="128" cy="106" rx="7" ry="3.8" fill="#ff9d9d" opacity="0.55" />
        <path d="M95 112 Q 100 117, 105 112" stroke="#d16d79" stroke-width="2.4" fill="none" stroke-linecap="round" />
      </svg>
    </div>
  </div>

  <button v-else class="mascot-mini" title="召唤 Zcode 娘" @click="restore">⚡</button>
</template>
