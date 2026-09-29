<script setup lang="ts">
import type { QuestionSpec } from '@/types'
import { computed } from 'vue'
import { DIFFICULTY_LABEL, QUESTION_TYPE_LABEL } from '@/lib/content'
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

function optionClass(key: string) {
  if (!props.submitted) return { selected: props.selected.includes(key) }
  const isAnswer = props.question.answers.includes(key)
  const isPicked = props.selected.includes(key)
  return {
    correct: isAnswer,
    wrong: isPicked && !isAnswer,
    dim: !isAnswer && !isPicked,
  }
}
</script>

<template>
  <div class="question card">
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
        <span class="option-text">{{ op.text }}</span>
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
