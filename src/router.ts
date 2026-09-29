import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('./views/DashboardView.vue') },
    { path: '/path', component: () => import('./views/PathView.vue') },
    { path: '/module/:moduleId', component: () => import('./views/ModuleView.vue'), props: true },
    { path: '/chapter/:moduleId/:chapterId', component: () => import('./views/ChapterView.vue'), props: true },
    { path: '/practice', component: () => import('./views/PracticeView.vue') },
    { path: '/exam', component: () => import('./views/ExamView.vue') },
    { path: '/wrong', component: () => import('./views/WrongBookView.vue') },
    { path: '/settings', component: () => import('./views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
