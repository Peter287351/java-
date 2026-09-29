<script setup lang="ts">
import { computed } from 'vue'
import { getChapter, getModule, questionById } from '@/lib/content'
import { useProgressStore } from '@/stores/progress'
import { plainText } from '@/lib/utils'
import MarkdownView from '@/components/MarkdownView.vue'

const store = useProgressStore()

interface WrongEntry {
  qid: string
  moduleId: string
  moduleTitle: string
  chapterId: string
  chapterTitle: string
  preview: string
  scenarioPreview: string
  answers: string[]
  attempts: number
}

const grouped = computed(() => {
  const map = new Map<string, { title: string; emoji: string; items: WrongEntry[] }>()
  for (const qid of store.wrongIds) {
    const ref = questionById(qid)
    if (!ref) continue
    const m = getModule(ref.moduleId)
    const c = getChapter(ref.moduleId, ref.chapterId)
    if (!m || !c) continue
    const entry: WrongEntry = {
      qid,
      moduleId: m.meta.id,
      moduleTitle: m.meta.title,
      chapterId: c.meta.id,
      chapterTitle: c.meta.title,
      preview: plainText(ref.q.stem),
      scenarioPreview: ref.q.scenario ? plainText(ref.q.scenario, 60) : '',
      answers: ref.q.answers,
      attempts: store.stat(qid)?.attempts ?? 0,
    }
    if (!map.has(m.meta.id)) map.set(m.meta.id, { title: m.meta.title, emoji: m.meta.emoji, items: [] })
    map.get(m.meta.id)!.items.push(entry)
  }
  return [...map.values()]
})
</script>

<template>
  <h1 class="page-title">错题本</h1>
  <p class="page-sub muted">答错自动进本，重做连续答对 2 次自动移出。</p>

  <div v-if="!grouped.length" class="empty card">
    <div class="big">🎉</div>
    <p>错题本是空的，继续保持！</p>
    <router-link to="/path"><button class="btn btn-primary">去学习路径</button></router-link>
  </div>

  <template v-else>
    <div v-for="g in grouped" :key="g.title" class="card list-card">
      <h3>
        {{ g.emoji }} {{ g.title }}
        <span class="muted small">（{{ g.items.length }} 题）</span>
        <router-link :to="`/practice?module=${g.items[0].moduleId}&wrong=1`">
          <button class="btn" style="float: right">重刷本模块错题</button>
        </router-link>
      </h3>
      <div v-for="item in g.items" :key="item.qid" class="wrong-item">
        <span v-if="item.scenarioPreview" class="chip chip-blue">场景</span>
        {{ item.scenarioPreview }}
        <strong>{{ item.preview }}</strong>
        <div class="chapter-meta" style="margin-top: 6px">
          <router-link :to="`/chapter/${item.moduleId}/${item.chapterId}`" class="small">
            {{ item.chapterTitle }} →
          </router-link>
          <span class="muted small">已答 {{ item.attempts }} 次 · 正确答案 {{ item.answers.join('、') }}</span>
        </div>
        <details class="doubt-detail">
          <summary>展开解析</summary>
          <div style="margin-top: 10px">
            <MarkdownView :source="questionById(item.qid)?.q.explanation ?? ''" />
          </div>
        </details>
      </div>
    </div>

    <div class="question-actions" style="justify-content: center">
      <router-link to="/practice?wrong=1">
        <button class="btn btn-primary">重刷全部错题（{{ store.wrongIds.length }}）</button>
      </router-link>
    </div>
  </template>
</template>
