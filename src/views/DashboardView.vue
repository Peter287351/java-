<script setup lang="ts">
import type { Module } from '@/types'
import { READY_ACCURACY, STAGES } from '@/types'
import { computed } from 'vue'
import { modules, getModule, getChapter, totalQuestionCount } from '@/lib/content'
import { useProgressStore } from '@/stores/progress'
import { ACHIEVEMENTS, DAILY_GOAL } from '@/lib/motivation'
import ProgressRing from '@/components/ProgressRing.vue'

const store = useProgressStore()

function moduleStat(m: Module) {
  const qids = m.chapters.flatMap((c) => c.questions.map((q) => q.id))
  const s = store.groupStat(qids)
  return { ...s, m, ready: s.complete && s.accuracy >= READY_ACCURACY }
}

const moduleStats = computed(() => modules.map(moduleStat))
const readyCount = computed(() => moduleStats.value.filter((s) => s.ready).length)
const totalDone = computed(() => moduleStats.value.reduce((n, s) => n + s.done, 0))
const isNewUser = computed(() => totalDone.value === 0 && store.data.exams.length === 0)
const goalPct = computed(() => Math.min(1, store.todayCount / DAILY_GOAL))

const continueTask = computed(() => {
  if (store.data.lastVisit) {
    const m = getModule(store.data.lastVisit.moduleId)
    const c = getChapter(store.data.lastVisit.moduleId, store.data.lastVisit.chapterId)
    if (m && c)
      return { moduleId: m.meta.id, chapterId: c.meta.id, moduleTitle: m.meta.title, chapterTitle: c.meta.title }
  }
  for (const m of modules) {
    for (const c of m.chapters) {
      if (!store.groupStat(c.questions.map((q) => q.id)).complete)
        return { moduleId: m.meta.id, chapterId: c.meta.id, moduleTitle: m.meta.title, chapterTitle: c.meta.title }
    }
  }
  return null
})

const stageTitle = (s: 1 | 2 | 3 | 4) => STAGES.find((x) => x.stage === s)?.title ?? ''
</script>

<template>
  <div v-if="totalQuestionCount === 0" class="empty card">
    <div class="big">🏗️</div>
    <p>题库内容尚未生成完毕，请稍后再来。</p>
  </div>

  <template v-else>
    <!-- 品牌 Hero -->
    <section class="hero">
      <div>
        <h1>
          <span v-if="!isNewUser">欢迎回来，</span><span class="grad-text">离实习又近了一天</span>
        </h1>
        <p class="slogan">
          {{ isNewUser
            ? '免费的后端实习学习平台 · 知识卡先学后练 · 情景题实战演练'
            : '先学后练 · 错题回收 · 模考检验，保持节奏别停下' }}
        </p>
        <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap">
          <span class="chip chip-blue">8 大模块</span>
          <span class="chip chip-blue">39 个章节</span>
          <span class="chip chip-blue">{{ totalQuestionCount }} 道精讲题</span>
          <span class="chip chip-green">完全免费</span>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat-box"><strong>{{ store.streakDays }}</strong><span>连续打卡（天）</span></div>
        <div class="stat-box"><strong>{{ store.todayCount }}</strong><span>今日已答（题）</span></div>
        <div class="stat-box"><strong>{{ totalDone }}/{{ totalQuestionCount }}</strong><span>累计已掌握</span></div>
      </div>
    </section>

    <!-- 等级与每日目标 -->
    <div class="today-tasks">
      <div class="card fade-up">
        <h3>🎖️ 等级 Lv.{{ store.level.level }} · {{ store.level.title }}</h3>
        <div class="bar" style="margin: 10px 0 6px">
          <div class="bar-fill" :style="{ width: store.level.progress * 100 + '%' }" />
        </div>
        <p class="muted small" style="margin: 0">
          {{ store.data.xp }} XP
          <template v-if="store.level.next"> · 距下一级还需 {{ store.level.next - store.data.xp }} XP</template>
          <template v-else> · 已到顶，去帮助更多实习生吧</template>
        </p>
      </div>
      <div class="card fade-up">
        <h3>🎯 今日目标</h3>
        <div class="goal-row" style="margin-top: 8px">
          <ProgressRing :value="goalPct" :size="58" :stroke="7" />
          <div>
            <p style="margin: 0; font-weight: 600">{{ store.todayCount }} / {{ DAILY_GOAL }} 题</p>
            <p class="muted small" style="margin: 0">
              {{ goalPct >= 1 ? '今日目标达成，收获满满 🌈' : '每天 ' + DAILY_GOAL + ' 题，实习线稳步推进' }}
            </p>
          </div>
        </div>
      </div>
      <div class="card fade-up">
        <h3>📖 继续学习</h3>
        <p v-if="continueTask" class="muted" style="margin: 6px 0 12px">
          {{ continueTask.moduleTitle }} · {{ continueTask.chapterTitle }}
        </p>
        <p v-else class="muted" style="margin: 6px 0 12px">全部章节已学完，去模考或错题本巩固吧</p>
        <router-link v-if="continueTask" :to="`/chapter/${continueTask.moduleId}/${continueTask.chapterId}`">
          <button class="btn btn-primary">进入章节</button>
        </router-link>
      </div>
      <div class="card fade-up">
        <h3>📝 模拟考试</h3>
        <p class="muted" style="margin: 6px 0 12px">
          {{ store.wrongIds.length ? `另有 ${store.wrongIds.length} 道错题待回收` : '20 题 / 25 分钟，按考点出报告' }}
        </p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap">
          <router-link to="/exam"><button class="btn btn-primary">开始模考</button></router-link>
          <router-link v-if="store.wrongIds.length" to="/wrong"><button class="btn">错题复习</button></router-link>
        </div>
      </div>
    </div>

    <!-- 成就墙 -->
    <h2>成就</h2>
    <div class="achieve-strip card" style="margin-bottom: 26px">
      <div v-for="a in ACHIEVEMENTS" :key="a.id" class="achieve" :class="{ on: a.id in store.data.unlocked }"
        :title="a.desc">
        <span class="icon">{{ a.icon }}</span>
        <div>
          <div style="font-weight: 600">{{ a.name }}</div>
          <div class="small" style="opacity: 0.8">{{ a.desc }}</div>
        </div>
      </div>
    </div>

    <h2>模块进度 · 实习就绪 {{ readyCount }}/{{ modules.length }}</h2>
    <div class="module-grid">
      <div v-for="s in moduleStats" :key="s.m.meta.id" class="card module-tile">
        <div class="module-tile-head">
          <router-link :to="`/module/${s.m.meta.id}`" class="module-tile-title">
            <span class="module-emoji">{{ s.m.meta.emoji }}</span>
            <strong>{{ s.m.meta.title }}</strong>
          </router-link>
          <ProgressRing :value="s.total ? s.done / s.total : 0" :size="64" :stroke="7" />
        </div>
        <p class="muted small">
          {{ stageTitle(s.m.meta.stage) }} · {{ s.done }}/{{ s.total }} 已掌握 · 准确率 {{ Math.round(s.accuracy * 100) }}%
        </p>
        <span v-if="s.ready" class="chip chip-green">实习达标 ✓</span>
        <span v-else-if="s.done > 0" class="chip chip-blue">进行中</span>
        <span v-else class="chip">未开始</span>
      </div>
    </div>
  </template>
</template>
