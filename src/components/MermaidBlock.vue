<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{ code: string }>()
const svg = ref('')
const failed = ref(false)

async function render() {
  failed.value = false
  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'dark' })
    const id = 'mmd-' + Math.random().toString(36).slice(2)
    const { svg: out } = await mermaid.render(id, props.code.trim())
    svg.value = out
  } catch {
    failed.value = true
  }
}

onMounted(render)
watch(() => props.code, render)
</script>

<template>
  <div v-if="svg" class="mermaid-box" v-html="svg" />
  <pre v-else-if="failed" class="ai-output">{{ code }}</pre>
  <div v-else class="ai-streaming">图表生成中…</div>
</template>
