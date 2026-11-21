<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useProgressStore } from '@/stores/progress'

const MINUTES = 10
const TOTAL = MINUTES * 60

const store = useProgressStore()
const remaining = ref(TOTAL)
const running = ref(false)
let timer: number | undefined

const mmss = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
const pct = computed(() => ((TOTAL - remaining.value) / TOTAL) * 100)

function start() {
  if (running.value) return
  running.value = true
  remaining.value = TOTAL
  timer = window.setInterval(() => {
    remaining.value--
    if (remaining.value <= 0) {
      stopTimer()
      store.completeFocus(MINUTES)
    }
  }, 1000)
}

function cancel() {
  stopTimer()
  if (remaining.value > 0 && remaining.value < TOTAL) {
    // 中途放弃：按剩余比例给安慰分（最多 5 XP），不打击积极性
    const doneMin = Math.round(((TOTAL - remaining.value) / TOTAL) * MINUTES)
    if (doneMin >= 3) store.completeFocus(doneMin)
  }
}

function stopTimer() {
  running.value = false
  clearInterval(timer)
  remaining.value = TOTAL
}

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div>
    <h3>🍅 专注模式（{{ MINUTES }} 分钟）</h3>
    <template v-if="!running">
      <p class="muted" style="margin: 6px 0 12px">
        小回合学习：{{ MINUTES }} 分钟只做一件事，完成奖励 +10 XP。手机放远点，我们开始？
      </p>
      <button class="btn btn-primary" @click="start">开始专注</button>
    </template>
    <template v-else>
      <p class="focus-clock" :class="{ done: remaining <= 30 }">{{ mmss }}</p>
      <div class="bar" style="margin: 6px 0 12px">
        <div class="bar-fill" :style="{ width: pct + '%' }" />
      </div>
      <button class="btn" @click="cancel">结束这次专注</button>
      <p class="muted small" style="margin: 6px 0 0">专注满 3 分钟就有奖励，别刷手机哦 👀</p>
    </template>
  </div>
</template>
