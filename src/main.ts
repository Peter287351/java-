import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { vSpotlight } from './directives/spotlight'
import './styles/main.css'

createApp(App).use(createPinia()).use(router).directive('spotlight', vSpotlight).mount('#app')
