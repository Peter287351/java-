<script setup lang="ts">
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import MascotWidget from '@/components/MascotWidget.vue'
import { useProgressStore } from '@/stores/progress'

const route = useRoute()
const store = useProgressStore()
</script>

<template>
  <div class="aurora" aria-hidden="true">
    <span class="a1" />
    <span class="a2" />
    <span class="a3" />
  </div>
  <NavBar />
  <main class="container">
    <router-view v-slot="{ Component }">
      <div :key="route.fullPath" class="page-anim">
        <component :is="Component" />
      </div>
    </router-view>
  </main>
  <footer class="footer">
    <span class="heart">⚡ 后端修炼场</span> · 为想学后端的实习生而建 · 免费开放 · 每天 30 分钟，从 0 到实习
  </footer>

  <MascotWidget />

  <!-- 激励通知 -->
  <div class="toast-wrap">
    <div v-for="t in store.toasts" :key="t.key" class="toast">
      <span class="icon">{{ t.icon }}</span>
      <div>
        <div class="t-title">{{ t.title }}</div>
        <div class="t-desc">{{ t.desc }}</div>
      </div>
    </div>
  </div>
</template>
