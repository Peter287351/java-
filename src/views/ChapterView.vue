<script setup lang="ts">
import { computed, watch } from 'vue'
import { getChapter, getModule } from '@/lib/content'
import { useProgressStore } from '@/stores/progress'
import MarkdownView from '@/components/MarkdownView.vue'

const props = defineProps<{ moduleId: string; chapterId: string }>()
const store = useProgressStore()

const module = computed(() => getModule(props.moduleId))
const chapter = computed(() => getChapter(props.moduleId, props.chapterId))

const chapterIndex = computed(() =>
  module.value?.chapters.findIndex((c) => c.meta.id === props.chapterId) ?? -1,
)
const prevChapter = computed(() =>
  chapterIndex.value > 0 ? module.value!.chapters[chapterIndex.value - 1] : null,
)
const nextChapter = computed(() =>
  chapterIndex.value >= 0 && chapterIndex.value < module.value!.chapters.length - 1
    ? module.value!.chapters[chapterIndex.value + 1]
    : null,
)

const stat = computed(() => store.groupStat(chapter.value?.questions.map((q) => q.id) ?? []))

watch(
  () => [props.moduleId, props.chapterId] as const,
  ([m, c]) => store.setLastVisit(m, c),
  { immediate: true },
)
</script>

<template>
  <div v-if="!module || !chapter" class="empty card">章节不存在</div>

  <template v-else>
    <p class="breadcrumb">
      <router-link to="/path">学习路径</router-link> /
      <router-link :to="`/module/${module.meta.id}`">{{ module.meta.title }}</router-link>
      / {{ chapter.meta.title }}
    </p>
    <h1 class="page-title">{{ chapter.meta.title }}</h1>
    <p class="page-sub muted">
      {{ chapter.cards.length }} 张知识卡 · {{ chapter.questions.length }} 题 · 已掌握 {{ stat.done }}/{{ stat.total }}
    </p>

    <div v-for="card in chapter.cards" :key="card.title" class="knowledge-card card">
      <h3>{{ card.title }}</h3>
      <MarkdownView :source="card.body" />
    </div>

    <div v-if="!chapter.cards.length" class="empty card">本章知识卡缺失（内容生产中）</div>

    <div class="chapter-cta">
      <router-link :to="`/practice?module=${module.meta.id}&chapter=${chapter.meta.id}`">
        <button class="btn btn-primary">开始本章练习（{{ chapter.questions.length }} 题）</button>
      </router-link>
      <span class="muted small">题目已按 入门 → 进阶 → 实战 排序，循序渐进；错题自动进错题本</span>
    </div>

    <div class="chapter-nav">
      <router-link v-if="prevChapter" :to="`/chapter/${module.meta.id}/${prevChapter.meta.id}`">
        <button class="btn">← {{ prevChapter.meta.title }}</button>
      </router-link>
      <span v-else />
      <router-link v-if="nextChapter" :to="`/chapter/${module.meta.id}/${nextChapter.meta.id}`">
        <button class="btn">{{ nextChapter.meta.title }} →</button>
      </router-link>
    </div>
  </template>
</template>
