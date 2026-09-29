<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ value: number; size?: number; stroke?: number; label?: string }>(),
  { size: 76, stroke: 8, label: '' },
)

const uid = Math.random().toString(36).slice(2)
const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(
  () => circumference.value * (1 - Math.min(1, Math.max(0, props.value))),
)
</script>

<template>
  <div class="ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size">
      <defs>
        <linearGradient :id="`rg-${uid}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7c8cff" />
          <stop offset="50%" stop-color="#a78bfa" />
          <stop offset="100%" stop-color="#38d9f5" />
        </linearGradient>
      </defs>
      <circle
        class="ring-bg"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="stroke"
        fill="none"
      />
      <circle
        class="ring-fg"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="stroke"
        fill="none"
        :stroke="`url(#rg-${uid})`"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
      />
    </svg>
    <div class="ring-text">
      <strong>{{ Math.round(value * 100) }}%</strong>
      <span v-if="label">{{ label }}</span>
    </div>
  </div>
</template>
