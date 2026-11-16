import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  // 开发 / 预览都固定在 5174：学习进度存在浏览器 localStorage，按「协议+域名+端口」隔离，
  // 端口一旦漂移就会变成另一份空记录。strictPort 让端口被占用时直接报错，而不是悄悄换端口。
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
