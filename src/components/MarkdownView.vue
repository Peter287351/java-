<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

marked.use({ breaks: true, gfm: true })

const props = defineProps<{ source: string }>()
const html = computed(() => marked.parse(props.source) as string)
</script>

<template>
  <div class="md" v-html="html" />
</template>
