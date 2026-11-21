<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { getChapter, getModule, questionById, modules, totalQuestionCount } from '@/lib/content'
import { useProgressStore } from '@/stores/progress'
import { formatStudyTime, plainText } from '@/lib/utils'
import { AI_PRESETS, chatStream, clearAiConfig, clearKeyMemory, getAiConfig, recallKey, rememberKey, saveAiConfig } from '@/lib/aiTutor'
import MarkdownView from '@/components/MarkdownView.vue'
import { mascotHidden, setMascotHidden } from '@/lib/mascotPref'
import { resetStudySession } from '@/lib/studyTimer'

const store = useProgressStore()
const fileInput = ref<HTMLInputElement>()
const message = ref('')

/* AI 助教配置（默认 OpenCode Go 网关，Key 与模型名由用户自填） */
const savedCfg = getAiConfig()
const aiForm = reactive({
  preset: savedCfg ? 'custom' : 'opencode',
  baseUrl: savedCfg?.baseUrl ?? AI_PRESETS[0].baseUrl,
  apiKey: savedCfg?.apiKey ?? '',
  model: savedCfg?.model ?? '',
})
const aiSaved = ref(false)
const aiTesting = ref(false)
const aiTestResult = ref('')

function applyPreset() {
  const p = AI_PRESETS.find((x) => x.id === aiForm.preset)
  if (!p) return
  if (p.baseUrl) aiForm.baseUrl = p.baseUrl
  // 预设带模型建议则取第一个；同时自动带出该服务商上次用的 Key（各服务商 Key 不通用）
  if (p.models?.length) aiForm.model = p.models[0]
  else if (p.model) aiForm.model = p.model
  if (p.baseUrl) aiForm.apiKey = recallKey(p.baseUrl)
}

/** 当前预设的模型下拉建议 */
const modelSuggestions = computed(
  () => AI_PRESETS.find((x) => x.id === aiForm.preset)?.models ?? [],
)

function saveAi() {
  const baseUrl = aiForm.baseUrl.trim()
  saveAiConfig({ baseUrl, apiKey: aiForm.apiKey.trim(), model: aiForm.model.trim() })
  rememberKey(baseUrl, aiForm.apiKey.trim())
  aiSaved.value = true
  setTimeout(() => (aiSaved.value = false), 2500)
  message.value = 'AI 助教配置已保存（仅保存在本机浏览器）'
}

function removeAi() {
  clearAiConfig()
  clearKeyMemory()
  aiForm.apiKey = ''
  aiForm.model = ''
  message.value = '已清除 AI 配置（含各服务商的 Key 记忆）'
}

async function testAi() {
  aiTesting.value = true
  aiTestResult.value = ''
  try {
    saveAiConfig({ baseUrl: aiForm.baseUrl.trim(), apiKey: aiForm.apiKey.trim(), model: aiForm.model.trim() })
    const answer = await chatStream(getAiConfig()!, [{ role: 'user', content: '收到请只回复两个字：正常' }], () => {})
    aiTestResult.value = answer.includes('正常') ? '✅ 连接成功，AI 助教已就绪' : `✅ 连接成功（回复：${answer.slice(0, 30)}）`
  } catch (e) {
    aiTestResult.value = '❌ 连接失败：' + (e instanceof Error ? e.message : String(e))
  } finally {
    aiTesting.value = false
  }
}

const answeredCount = computed(() => Object.keys(store.data.stats).length)
const examCount = computed(() => store.data.exams.length)
const activePracticeCount = computed(() => Object.keys(store.data.practiceSessions ?? {}).length)
const totalStudy = computed(() => formatStudyTime(store.totalStudySeconds))
const todayStudy = computed(() => formatStudyTime(store.todayStudySeconds))

function exportData() {
  const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `houduan-progress-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.value = '已导出进度文件'
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const err = store.importData(await file.text())
  message.value = err ? `导入失败：${err}` : '导入成功，进度已覆盖'
  input.value = ''
}

function resetAll() {
  if (window.confirm('确定清空全部学习进度、错题与考试记录吗？此操作不可恢复。')) {
    store.resetAll()
    resetStudySession()
    message.value = '已清空全部数据'
  }
}

const doubts = computed(() =>
  store.doubtedIds
    .map((qid) => {
      const r = questionById(qid)
      if (!r) return null
      const m = getModule(r.moduleId)
      const c = getChapter(r.moduleId, r.chapterId)
      return {
        qid,
        moduleTitle: m?.meta.title ?? '',
        chapterTitle: c?.meta.title ?? '',
        preview: plainText(r.q.stem),
        explanation: r.q.explanation,
      }
    })
    .filter(Boolean) as { qid: string; moduleTitle: string; chapterTitle: string; preview: string; explanation: string }[],
)
</script>

<template>
  <h1 class="page-title">设置</h1>

  <div class="card settings-block">
    <h3>数据概览</h3>
    <p class="muted small">
      共 {{ modules.length }} 个模块 / {{ totalQuestionCount }} 题 ·
      已作答 {{ answeredCount }} 题 · 模考 {{ examCount }} 次 · 存疑 {{ store.doubtedIds.length }} 题 · 选项标记 {{ store.optionMarkCount }} 处 ·
      进行中的练习 {{ activePracticeCount }} 轮
      <br />今日学习 {{ todayStudy }} · 累计学习 {{ totalStudy }}（切走页面或发呆 2 分钟自动暂停计时）
      <br />答题进度、每轮练习、学习时间都保存在浏览器 localStorage，换浏览器/清缓存前请先导出。
    </p>
    <p v-if="message" class="small" style="color: var(--green)">{{ message }}</p>
  </div>

  <div class="card settings-block">
    <h3>🤖 AI 助教（把每道题讲成人话）</h3>
    <p class="muted small">
      配置后，每道题和每章知识卡旁都会出现「用人话讲给我听」按钮：AI 先用生活化类比、再讲概念，还能无限追问。
      <br /><b>隐私说明：</b>API Key 只保存在你自己的浏览器 localStorage，请求从你的浏览器<b>直连</b>你选的服务商，不经过本站任何服务器、不进代码仓库。
      推荐用 <a href="https://platform.deepseek.com/" target="_blank" rel="noopener">DeepSeek 开放平台</a> 申请（便宜，OpenAI 兼容）。
    </p>
    <div class="ai-format-line">
      <span>API 格式：<b>Chat Completions（POST /chat/completions）</b></span>
      <span class="muted small">—— 已按网关要求自动配置好 URL 与格式，无需修改；本地开发自动走代理绕开跨域</span>
    </div>
    <div class="ai-form">
      <label>
        服务商预设
        <select v-model="aiForm.preset" @change="applyPreset">
          <option v-for="p in AI_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
        </select>
      </label>
      <label>
        接口地址 Base URL
        <input v-model="aiForm.baseUrl" type="text" placeholder="https://opencode.ai/zen/go/v1" />
      </label>
      <label>
        模型名 Model（下拉可选，也可自由输入）
        <input v-model="aiForm.model" type="text" list="ai-model-list" placeholder="glm-5.3-flash" />
        <datalist id="ai-model-list">
          <option v-for="m in modelSuggestions" :key="m" :value="m" />
        </datalist>
      </label>
      <label>
        API Key（自己填，只存本机浏览器）
        <input v-model="aiForm.apiKey" type="password" placeholder="粘贴你的 Key" autocomplete="off" />
      </label>
    </div>
    <div class="question-actions" style="margin-top: 10px">
      <button class="btn btn-primary" :disabled="!aiForm.baseUrl || !aiForm.apiKey || !aiForm.model" @click="saveAi">
        {{ aiSaved ? '已保存 ✓' : '保存配置' }}
      </button>
      <button class="btn" :disabled="aiTesting || !aiForm.baseUrl || !aiForm.apiKey || !aiForm.model" @click="testAi">
        {{ aiTesting ? '测试中…' : '测试连接' }}
      </button>
      <button class="btn btn-danger" @click="removeAi">清除配置</button>
    </div>
    <p v-if="aiTestResult" class="small" :style="{ color: aiTestResult.startsWith('✅') ? 'var(--green)' : 'var(--red)' }">
      {{ aiTestResult }}
    </p>
    <p class="muted small" style="margin: 8px 0 0">
      提示：Key 永远只存在本机浏览器、随测试连接直连服务商，不会出现在代码与 Git 仓库里；公共电脑用完点「清除配置」；导出的进度备份不含 API Key。
      <br />额度不够时：同一个网关直接在「模型名」下拉里换模型（如 glm-5.3-flash → deepseek-v4.1-flash，Key 不变）；要换到 DeepSeek 官方则切预设「DeepSeek」——各服务商的 Key 已按服务商分别记忆，切换时自动带出。
      <template v-if="aiForm.preset === 'opencode'">
        <br />⚠️ 已知限制：OpenCode Go 网关不支持浏览器跨域直连，本地用 <b>npm run dev</b> 时会自动走本地代理（需保持 dev 在运行）；部署上线后请改用 DeepSeek 等预设。
      </template>
    </p>
  </div>

  <div class="card settings-block">
    <h3>界面偏好</h3>
    <p class="muted small">
      桌面右下角的学习搭子可以随时收起或召回；也可以直接点玩偶上的 × 收起，再用右下角的 ⚡ 召回。设置保存在本机浏览器。
    </p>
    <div class="question-actions">
      <button class="btn" :class="mascotHidden ? 'btn-primary' : ''" @click="setMascotHidden(!mascotHidden)">
        {{ mascotHidden ? '显示桌面玩偶' : '隐藏桌面玩偶' }}
      </button>
      <span class="chip" :class="mascotHidden ? '' : 'chip-green'">
        {{ mascotHidden ? '当前：已隐藏' : '当前：显示中' }}
      </span>
    </div>
  </div>

  <div class="card settings-block">
    <h3>导出 / 导入进度</h3>
    <p class="muted small">导出的 JSON 也包含进行中的练习、每日学习时间、SQL 重点标记与选项标记；导入会整体覆盖当前进度、练习记录、学习时间与各类标记。</p>
    <div class="question-actions">
      <button class="btn btn-primary" @click="exportData">导出进度 JSON</button>
      <button class="btn" @click="fileInput?.click()">从文件导入</button>
      <input ref="fileInput" type="file" accept="application/json" style="display: none" @change="onImport" />
    </div>
  </div>

  <div class="card settings-block" v-if="doubts.length">
    <h3>存疑题目（{{ doubts.length }}）</h3>
    <p class="muted small">做题时标记"存疑"的题目会汇总在这里，方便复盘纠偏。</p>
    <div v-for="d in doubts" :key="d.qid" class="wrong-item">
      <span class="muted small">{{ d.moduleTitle }} · {{ d.chapterTitle }}</span>
      <p style="margin: 4px 0">{{ d.preview }}</p>
      <details class="doubt-detail">
        <summary>展开解析</summary>
        <div style="margin-top: 10px">
          <MarkdownView :source="d.explanation" />
        </div>
      </details>
      <button class="btn" style="margin-top: 8px" @click="store.unmarkDoubt(d.qid)">取消存疑</button>
    </div>
  </div>

  <div class="card settings-block">
    <h3>危险操作</h3>
    <p class="muted small">清空后会一并移除进行中的练习记录与全部学习时间，操作不可恢复；本次会话计时会重新开始。</p>
    <button class="btn btn-danger" @click="resetAll">清空全部学习数据</button>
  </div>
</template>
