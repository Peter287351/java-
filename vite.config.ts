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
    // AI 助教本地代理：部分网关（如 OpenCode Go）不返回 CORS 头，浏览器直连会被拦，
    // 由 dev server 服务端转发绕开跨域；OpenCode Go 还要求 x-opencode-session 路由头。
    // 仅开发/预览生效；生产静态部署需改用支持 CORS 的服务商或自建反代（见设置页说明）。
    proxy: {
      '/ai-opencode': {
        target: 'https://opencode.ai',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-opencode/, ''),
        headers: { 'x-opencode-session': 'houduan-study-web' },
      },
      '/ai-deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-deepseek/, ''),
      },
      '/ai-moonshot': {
        target: 'https://api.moonshot.cn',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-moonshot/, ''),
      },
      '/ai-qwen': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-qwen/, ''),
      },
    },
  },
  preview: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/ai-opencode': {
        target: 'https://opencode.ai',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-opencode/, ''),
        headers: { 'x-opencode-session': 'houduan-study-web' },
      },
      '/ai-deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-deepseek/, ''),
      },
      '/ai-moonshot': {
        target: 'https://api.moonshot.cn',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-moonshot/, ''),
      },
      '/ai-qwen': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-qwen/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
