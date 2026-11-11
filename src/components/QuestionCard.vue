<script setup lang="ts">
import type { QuestionSpec } from '@/types'
import { computed } from 'vue'
import { DIFFICULTY_LABEL, QUESTION_TYPE_LABEL } from '@/lib/content'
import { splitOptionNotes } from '@/lib/optionInsights'
import MarkdownView from './MarkdownView.vue'

const props = defineProps<{
  question: QuestionSpec
  selected: string[]
  submitted: boolean
  doubted?: boolean
  examMode?: boolean
}>()

const emit = defineEmits<{ toggle: [key: string]; submit: []; toggleDoubt: [] }>()

const typeLabel = computed(() => QUESTION_TYPE_LABEL[props.question.type] ?? props.question.type)
const diffLabel = computed(() => DIFFICULTY_LABEL[props.question.difficulty] ?? '')
const multi = computed(() => props.question.type === 'multiple')
const canSubmit = computed(() => props.selected.length > 0 && !props.submitted)
const optionNotes = computed(() =>
  props.submitted
    ? splitOptionNotes(
        props.question.explanation,
        props.question.options.map((o) => o.key),
      )
    : {},
)
/** 只有确实拆出了逐选项说明时才提示，避免解析里没有点评时出现一句空话 */
const hasOptionNotes = computed(() => Object.keys(optionNotes.value).length > 0)

function optionClass(key: string) {
  if (!props.submitted) return { selected: props.selected.includes(key) }
  const isAnswer = props.question.answers.includes(key)
  const isPicked = props.selected.includes(key)
  const dimmed = !isAnswer && !isPicked
  // 带点评的未选项不能整体降透明度，否则点评小字也跟着看不见；
  // 交给 CSS 只淡化选项文字本身（见 .option.dim-with-note）
  return {
    correct: isAnswer,
    wrong: isPicked && !isAnswer,
    dim: dimmed && !optionNotes.value[key],
    'dim-with-note': dimmed && !!optionNotes.value[key],
  }
}
</script>

<template>
  <div v-spotlight class="question card">
    <div class="question-head">
      <span class="chip chip-blue">{{ typeLabel }}</span>
      <span class="chip">{{ diffLabel }}</span>
      <span v-for="t in question.tags" :key="t" class="chip chip-tag">#{{ t }}</span>
    </div>

    <div v-if="question.scenario" class="scenario md-box">
      <span class="scenario-label">【场景】</span>
      <MarkdownView :source="question.scenario" />
    </div>

    <MarkdownView class="stem" :source="question.stem" />

    <div class="options" :class="{ multi }">
      <button
        v-for="op in question.options"
        :key="op.key"
        type="button"
        class="option"
        :class="optionClass(op.key)"
        :disabled="submitted"
        @click="emit('toggle', op.key)"
      >
        <span class="option-key">{{ op.key }}</span>
        <span class="option-text">
          <span class="option-line">{{ op.text }}</span>
          <span
            v-if="submitted && optionNotes[op.key]"
            class="option-note"
            :class="{ good: question.answers.includes(op.key) }"
          >
            {{ optionNotes[op.key] }}
          </span>
        </span>
      </button>
    </div>

    <div v-if="!submitted && !examMode" class="question-actions">
      <button class="btn btn-primary" :disabled="!canSubmit" @click="emit('submit')">
        提交答案
      </button>
      <span v-if="multi" class="muted small">多选题：需选出全部正确项</span>
    </div>

    <div v-if="submitted" class="feedback">
      <p class="answer-line">
        正确答案：<strong>{{ question.answers.join('、') }}</strong>
      </p>
      <div class="explanation md-box">
        <p class="explanation-title">解析</p>
        <p v-if="hasOptionNotes" class="explanation-hint muted small">
          💡 解析里点到哪个选项，下面就会附上对它的说明（绿色为正确项，其余为避坑要点）
        </p>
        <MarkdownView :source="question.explanation" />
      </div>
      <div v-if="!examMode" class="question-actions">
        <button class="btn" :class="doubted ? 'btn-warn' : ''" @click="emit('toggleDoubt')">
          {{ doubted ? '★ 已存疑（点击取消）' : '☆ 标记存疑' }}
        </button>
      </div>
    </div>
  </div>
</template>
