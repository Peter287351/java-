<script setup lang="ts">
import { STAGES } from '@/types'
import { modules } from '@/lib/content'
import ModuleCard from '@/components/ModuleCard.vue'
</script>

<template>
  <h1 class="page-title">学习路径</h1>
  <p class="page-sub muted">按阶段推进，顺序学习效果最佳；每个模块点进去逐章「先学后练」。</p>

  <section v-for="s in STAGES" :key="s.stage" class="stage-section">
    <h2 class="stage-title">阶段 {{ s.stage }} · {{ s.title }}</h2>
    <div class="module-grid stagger">
      <ModuleCard v-for="m in modules.filter((m) => m.meta.stage === s.stage)" :key="m.meta.id" :module="m" />
    </div>
  </section>
</template>
