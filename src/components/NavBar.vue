<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { formatClock, formatStudyTime } from '@/lib/utils'
import { isIdle, isStudying, sessionSeconds } from '@/lib/studyTimer'

const store = useProgressStore()
const links = [
  { to: '/', label: '首页' },
  { to: '/path', label: '学习路径' },
  { to: '/exam', label: '模拟考' },
  { to: '/wrong', label: '错题本' },
  { to: '/settings', label: '设置' },
]

const sessionClock = computed(() => formatClock(sessionSeconds.value))
const tip = computed(() => {
  if (isIdle.value) return '计时已暂停：2 分钟没有操作。动一下鼠标或滚动页面就继续。'
  if (!isStudying.value) return '计时已暂停：切回这个页面就继续。'
  return '本次进入网站到现在的学习时间（切走页面、发呆会自动暂停）'
})
const todayTip = computed(() => `今日累计 ${formatStudyTime(store.todayStudySeconds)} · 累计 ${formatStudyTime(store.totalStudySeconds)}`)
</script>

<template>
  <header class="navbar">
    <div class="navbar-inner container">
      <router-link to="/" class="brand">
        <span class="logo-dot">⚡</span>
        <span class="brand-text">后端修炼场</span>
      </router-link>
      <nav class="nav-links">
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="nav-link" active-class="active">
          {{ l.label }}
          <span v-if="l.to === '/wrong' && store.wrongIds.length" class="badge">{{ store.wrongIds.length }}</span>
        </router-link>
      </nav>
      <div class="nav-right">
        <div
          class="nav-clock"
          :class="{ paused: !isStudying }"
          :title="tip + ' · ' + todayTip"
        >
          <span class="clock-dot" :class="{ live: isStudying }" />
          <span class="clock-label">本次学习</span>
          <strong class="clock-value">{{ sessionClock }}</strong>
          <span class="clock-state">{{ isIdle ? '发呆暂停' : isStudying ? '计时中' : '已暂停' }}</span>
        </div>
        <div class="nav-xp" title="答题赚取经验，升级见证成长">
          <span class="lvl">Lv.{{ store.level.level }}</span>
          <span>{{ store.level.title }}</span>
        </div>
      </div>
    </div>
  </header>
</template>
