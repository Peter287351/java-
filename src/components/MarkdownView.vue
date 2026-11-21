<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import LabTerminal from './LabTerminal.vue'

marked.use({ breaks: true, gfm: true })

const props = defineProps<{ source: string }>()

/**
 * 把知识卡里的 ~~~lab:场景id~~~ 拆出来交给 LabTerminal 渲染，
 * 其余部分仍走 marked。这样内容作者只写一行标记就能嵌一个模拟终端。
 */
const blocks = computed(() => {
  const parts = props.source.split(/~~~lab:([a-zA-Z0-9-]+)~~~\s*/g)
  return parts
    .map((part, i) =>
      i % 2 === 0
        ? { kind: 'md' as const, html: marked.parse(part) as string }
        : { kind: 'lab' as const, id: part },
    )
    .filter((b) => (b.kind === 'md' ? b.html.trim() : true))
})
</script>

<template>
  <template v-for="(b, i) in blocks" :key="i">
    <div v-if="b.kind === 'md'" class="md" v-html="b.html" />
    <LabTerminal v-else :scenario-id="b.id" />
  </template>
</template>
