<script setup lang="ts">
import { useProgressStore } from '@/stores/progress'

const store = useProgressStore()
const links = [
  { to: '/', label: '首页' },
  { to: '/path', label: '学习路径' },
  { to: '/exam', label: '模拟考' },
  { to: '/wrong', label: '错题本' },
  { to: '/settings', label: '设置' },
]
</script>

<template>
  <header class="navbar">
    <div class="navbar-inner container">
      <router-link to="/" class="brand">
        <span class="logo-dot">⚡</span>
        <span class="brand-text">后端修炼场</span>
      </router-link>
      <nav class="nav-links">
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="nav-link" active-class="active">
          {{ l.label }}
          <span v-if="l.to === '/wrong' && store.wrongIds.length" class="badge">{{ store.wrongIds.length }}</span>
        </router-link>
      </nav>
      <div class="nav-xp" title="答题赚取经验，升级见证成长">
        <span class="lvl">Lv.{{ store.level.level }}</span>
        <span>{{ store.level.title }}</span>
      </div>
    </div>
  </header>
</template>
