<script setup lang="ts">
import type { Module } from '@/types'
import { computed } from 'vue'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{ module: Module }>()
const store = useProgressStore()

const stat = computed(() => {
  const qids = props.module.chapters.flatMap((c) => c.questions.map((q) => q.id))
  return store.groupStat(qids)
})

const doneChapters = computed(
  () => props.module.chapters.filter((c) => statOfChapter(c).complete).length,
)

function statOfChapter(c: Module['chapters'][number]) {
  return store.groupStat(c.questions.map((q) => q.id))
}
</script>

<template>
  <router-link :to="`/module/${module.meta.id}`" class="module-card card">
    <div class="module-card-head">
      <span class="module-emoji">{{ module.meta.emoji }}</span>
      <div>
        <h3>{{ module.meta.title }}</h3>
        <p class="muted">{{ module.meta.chapters.length }} 章 · {{ stat.total }} 题</p>
      </div>
    </div>
    <p class="module-desc muted">{{ module.meta.description }}</p>
    <div class="progress-line">
      <div class="bar">
        <div class="bar-fill" :style="{ width: (stat.total ? stat.done / stat.total : 0) * 100 + '%' }" />
      </div>
      <span class="muted small">{{ stat.done }}/{{ stat.total }} 已掌握 · 准确率 {{ Math.round(stat.accuracy * 100) }}%</span>
    </div>
    <div class="module-foot">
      <span class="chip" :class="stat.complete ? 'chip-green' : 'chip-blue'">
        章节 {{ doneChapters }}/{{ module.meta.chapters.length }}
      </span>
      <span v-if="stat.complete && stat.accuracy >= 0.8" class="chip chip-green">实习达标 ✓</span>
    </div>
  </router-link>
</template>
