<script setup lang="ts">
import { computed } from 'vue'
import { getModule } from '@/lib/content'
import { useProgressStore } from '@/stores/progress'
import { READY_ACCURACY } from '@/types'

const props = defineProps<{ moduleId: string }>()
const store = useProgressStore()

const module = computed(() => getModule(props.moduleId))

function statOf(qids: string[]) {
  return store.groupStat(qids)
}
</script>

<template>
  <div v-if="!module" class="empty card">模块不存在</div>

  <template v-else>
    <p class="breadcrumb"><router-link to="/path">学习路径</router-link> / {{ module.meta.title }}</p>
    <h1 class="page-title">{{ module.meta.emoji }} {{ module.meta.title }}</h1>
    <p class="page-sub muted">{{ module.meta.description }}</p>

    <div class="chapter-row" v-for="(c, i) in module.chapters" :key="c.meta.id">
      <span class="chapter-num">{{ i + 1 }}</span>
      <div class="chapter-info">
        <h3>{{ c.meta.title }}</h3>
        <div class="chapter-meta">
          <span class="muted small">{{ c.questions.length }} 题 · {{ c.cards.length }} 张知识卡</span>
          <div class="bar" style="max-width: 220px">
            <div
              class="bar-fill"
              :style="{
                width: (statOf(c.questions.map((q) => q.id)).total
                  ? statOf(c.questions.map((q) => q.id)).done / statOf(c.questions.map((q) => q.id)).total
                  : 0) * 100 + '%',
              }"
            />
          </div>
          <span class="muted small">{{ statOf(c.questions.map((q) => q.id)).done }}/{{ c.questions.length }}</span>
        </div>
      </div>
      <span v-if="statOf(c.questions.map((q) => q.id)).complete" class="chip chip-green">已掌握 ✓</span>
      <router-link :to="`/chapter/${module.meta.id}/${c.meta.id}`">
        <button class="btn btn-primary">学习</button>
      </router-link>
    </div>

    <p class="muted small" style="margin-top: 16px">
      全部章节掌握且最近正确率 ≥ {{ Math.round(READY_ACCURACY * 100) }}% 即达到本模块实习达标线。
    </p>
  </template>
</template>
