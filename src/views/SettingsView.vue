<script setup lang="ts">
import { computed, ref } from 'vue'
import { getChapter, getModule, questionById, modules, totalQuestionCount } from '@/lib/content'
import { useProgressStore } from '@/stores/progress'
import { plainText } from '@/lib/utils'
import MarkdownView from '@/components/MarkdownView.vue'

const store = useProgressStore()
const fileInput = ref<HTMLInputElement>()
const message = ref('')

const answeredCount = computed(() => Object.keys(store.data.stats).length)
const examCount = computed(() => store.data.exams.length)

function exportData() {
  const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `houduan-progress-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.value = '已导出进度文件'
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const err = store.importData(await file.text())
  message.value = err ? `导入失败：${err}` : '导入成功，进度已覆盖'
  input.value = ''
}

function resetAll() {
  if (window.confirm('确定清空全部学习进度、错题与考试记录吗？此操作不可恢复。')) {
    store.resetAll()
    message.value = '已清空全部数据'
  }
}

const doubts = computed(() =>
  store.doubtedIds
    .map((qid) => {
      const r = questionById(qid)
      if (!r) return null
      const m = getModule(r.moduleId)
      const c = getChapter(r.moduleId, r.chapterId)
      return {
        qid,
        moduleTitle: m?.meta.title ?? '',
        chapterTitle: c?.meta.title ?? '',
        preview: plainText(r.q.stem),
        explanation: r.q.explanation,
      }
    })
    .filter(Boolean) as { qid: string; moduleTitle: string; chapterTitle: string; preview: string; explanation: string }[],
)
</script>

<template>
  <h1 class="page-title">设置</h1>

  <div class="card settings-block">
    <h3>数据概览</h3>
    <p class="muted small">
      共 {{ modules.length }} 个模块 / {{ totalQuestionCount }} 题 ·
      已作答 {{ answeredCount }} 题 · 模考 {{ examCount }} 次 · 存疑 {{ store.doubtedIds.length }} 题
      <br />进度保存在浏览器 localStorage，换浏览器/清缓存前请先导出。
    </p>
    <p v-if="message" class="small" style="color: var(--green)">{{ message }}</p>
  </div>

  <div class="card settings-block">
    <h3>导出 / 导入进度</h3>
    <div class="question-actions">
      <button class="btn btn-primary" @click="exportData">导出进度 JSON</button>
      <button class="btn" @click="fileInput?.click()">从文件导入</button>
      <input ref="fileInput" type="file" accept="application/json" style="display: none" @change="onImport" />
    </div>
  </div>

  <div class="card settings-block" v-if="doubts.length">
    <h3>存疑题目（{{ doubts.length }}）</h3>
    <p class="muted small">做题时标记"存疑"的题目会汇总在这里，方便复盘纠偏。</p>
    <div v-for="d in doubts" :key="d.qid" class="wrong-item">
      <span class="muted small">{{ d.moduleTitle }} · {{ d.chapterTitle }}</span>
      <p style="margin: 4px 0">{{ d.preview }}</p>
      <details class="doubt-detail">
        <summary>展开解析</summary>
        <div style="margin-top: 10px">
          <MarkdownView :source="d.explanation" />
        </div>
      </details>
      <button class="btn" style="margin-top: 8px" @click="store.unmarkDoubt(d.qid)">取消存疑</button>
    </div>
  </div>

  <div class="card settings-block">
    <h3>危险操作</h3>
    <button class="btn btn-danger" @click="resetAll">清空全部学习数据</button>
  </div>
</template>
