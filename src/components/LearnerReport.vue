<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuestionRef } from '@/lib/content'
import { buildLearnerReport } from '@/lib/learnerProfile'

const props = defineProps<{
  wrong: QuestionRef[]
  total: number
  /** qid → 该题当时实际选的选项，用于让 AI 追问定位错因 */
  pickedByQid?: Record<string, string[]>
}>()

const report = computed(() =>
  buildLearnerReport(props.wrong, props.total, props.pickedByQid ?? {}),
)
const copied = ref<number | 'all' | null>(null)

async function copyText(text: string, which: number | 'all') {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = which
  setTimeout(() => (copied.value = null), 2200)
}
</script>

<template>
  <div class="card report-card fade-up">
    <h3>📊 本次学习画像</h3>
    <p class="report-summary">{{ report.summary }}</p>

    <template v-if="report.suggestions.length">
      <p class="report-sub">给你的建议：</p>
      <ol class="report-tips">
        <li v-for="(s, i) in report.suggestions" :key="i">
          <router-link v-if="s.link" :to="s.link" class="tip-link">{{ s.text }} →</router-link>
          <span v-else>{{ s.text }}</span>
        </li>
      </ol>
    </template>

    <template v-if="report.aiQuestions.length">
      <div class="ai-block">
        <p class="report-sub">🤖 拿去问 AI 就懂（已带上题目、选项和你的作答，直接复制粘贴）：</p>
        <div v-for="(q, i) in report.aiQuestions" :key="i" class="ai-question">
          <p>{{ q }}</p>
          <button class="btn ai-copy" @click="copyText(q, i)">
            {{ copied === i ? '已复制 ✓' : '复制' }}
          </button>
        </div>
        <div class="ai-actions">
          <button class="btn btn-primary" @click="copyText(report.aiQuestions.join('\n\n'), 'all')">
            {{ copied === 'all' ? '已复制全部 ✓' : '复制全部问题' }}
          </button>
          <a class="btn" href="https://www.kimi.com/" target="_blank" rel="noopener">打开 Kimi ↗</a>
          <a class="btn" href="https://chat.deepseek.com/" target="_blank" rel="noopener">打开 DeepSeek ↗</a>
        </div>
        <p class="muted small" style="margin: 8px 0 0">
          建议流程：复制问题 → 粘贴给 AI → 按它的步骤回答、让它出变式题练手 → 回来重做错题检验。
          面试官那条会一题一题问，别一次把答案全要过来，才测得出真实水平。
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.report-card {
  margin-top: 16px;
  border-color: rgba(124, 140, 255, 0.4);
  background:
    radial-gradient(360px 140px at 90% 0%, rgba(124, 140, 255, 0.12), transparent 65%),
    var(--surface);
}

.report-card h3 {
  margin: 0 0 8px;
}

.report-summary {
  margin: 0 0 12px;
  line-height: 1.8;
}

.report-sub {
  font-weight: 700;
  color: #b7c1ff;
  margin: 10px 0 6px;
}

.report-tips {
  margin: 0 0 8px;
  padding-left: 20px;
}

.report-tips li {
  margin: 5px 0;
  line-height: 1.7;
}

.tip-link {
  color: var(--primary);
}

.ai-block {
  border-top: 1px dashed var(--border-strong);
  margin-top: 12px;
  padding-top: 10px;
}

.ai-question {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
}

.ai-question p {
  flex: 1;
  margin: 0;
  font-size: 13.5px;
  line-height: 1.7;
  /* 提示词是多行结构（题干/选项/作答分列），保留换行才好读 */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  /* 单条提示词较长，框内滚动，避免整页被撑开；复制按钮复制的始终是全文 */
  max-height: 210px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(124, 140, 255, 0.5) transparent;
}

.ai-copy {
  flex-shrink: 0;
  padding: 4px 12px;
  font-size: 12px;
}

.ai-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}
</style>
