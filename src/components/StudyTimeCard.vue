<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { formatClock, formatStudyTime } from '@/lib/utils'
import { isIdle, isStudying, sessionSeconds } from '@/lib/studyTimer'

const store = useProgressStore()

const sessionClock = computed(() => formatClock(sessionSeconds.value))
const todayStudy = computed(() => formatStudyTime(store.todayStudySeconds))
const totalStudy = computed(() => formatStudyTime(store.totalStudySeconds))
/** 近 7 天柱状图：按本周最大值定高，全 0 时也有基线，不会除零 */
const studyDays = computed(() => {
  const days = store.recentStudyDays(7)
  const max = Math.max(60, ...days.map((d) => d.seconds))
  return days.map((d, i) => ({
    ...d,
    pct: Math.round((d.seconds / max) * 100),
    isToday: i === days.length - 1,
    timeLabel: d.seconds ? formatStudyTime(d.seconds) : '未学习',
  }))
})
const studyWeekTotal = computed(() =>
  formatStudyTime(store.recentStudyDays(7).reduce((n, d) => n + d.seconds, 0)),
)
</script>

<template>
  <section class="card study-time-card fade-up">
    <div class="study-time-head">
      <div>
        <h3 style="margin: 0">⏱ 学习时间</h3>
        <p class="muted small" style="margin: 4px 0 0">
          只统计页面在前台、你还在操作的时间；切走标签或发呆 2 分钟会自动暂停，
          {{ isIdle ? '现在就是暂停状态' : isStudying ? '现在正在计时' : '现在已暂停' }}。
          刷新页面本次会话会接着算，学习记录按天保存。
        </p>
      </div>
      <div class="study-session">
        <span class="study-live-dot" :class="{ live: isStudying }" />
        <span class="muted small">本次会话</span>
        <strong>{{ sessionClock }}</strong>
      </div>
    </div>

    <div class="study-time-body">
      <div class="study-numbers">
        <div><strong>{{ todayStudy }}</strong><span class="muted small">今日学习</span></div>
        <div><strong>{{ studyWeekTotal }}</strong><span class="muted small">近 7 天</span></div>
        <div><strong>{{ totalStudy }}</strong><span class="muted small">累计学习</span></div>
      </div>
      <div class="study-chart" role="img" aria-label="近 7 天每日学习时长">
        <div v-for="d in studyDays" :key="d.day" class="study-day" :title="`${d.day} · ${d.timeLabel}`">
          <div class="study-bar-track">
            <div
              class="study-bar"
              :class="{ today: d.isToday, empty: d.seconds === 0 }"
              :style="{ height: Math.max(3, d.pct) + '%' }"
            />
          </div>
          <span class="muted small">{{ d.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
