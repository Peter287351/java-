<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ value: number; duration?: number }>(), {
  duration: 900,
})

const shown = ref(0)
let raf = 0

function animate(to: number) {
  cancelAnimationFrame(raf)
  const from = shown.value
  const start = performance.now()
  const step = (t: number) => {
    const p = Math.min(1, (t - start) / props.duration)
    const eased = 1 - Math.pow(1 - p, 3)
    shown.value = Math.round(from + (to - from) * eased)
    if (p < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

onMounted(() => animate(props.value))
watch(() => props.value, (v) => animate(v))
</script>

<template>
  <span>{{ shown }}</span>
</template>
