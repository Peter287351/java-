<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { labScenarios, normalizeCommand, unknownFeedback } from '@/lib/labScenarios'
import type { LabScenario, LabStep } from '@/lib/labScenarios'

const props = defineProps<{ scenarioId: string }>()

const scenario = computed<LabScenario | undefined>(() => labScenarios[props.scenarioId])
const input = ref('')
const done = ref<number[]>([])
const history = ref<{ cmd: string; output: string; ok: boolean; explain?: string }[]>([])
const hintLevel = ref(0) // 0 无提示 / 1 文字线索 / 2 示例命令
const copied = ref(false)
const scrollBox = ref<HTMLElement>()

const stepIndex = computed(() => done.value.length)
const currentStep = computed<LabStep | undefined>(() => scenario.value?.steps[stepIndex.value])
const finished = computed(() => !!scenario.value && done.value.length >= scenario.value.steps.length)

async function scrollToEnd() {
  await nextTick()
  if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight
}

/** 填入示例命令（照着敲也能学会；提示只是省得手打长命令） */
function fillSample() {
  if (!currentStep.value) return
  input.value = currentStep.value.sample
  hintLevel.value = 2
}

/** 复制当前示例命令，方便粘到真实终端练手 */
async function copySample() {
  if (!currentStep.value) return
  try {
    await navigator.clipboard.writeText(currentStep.value.sample)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = currentStep.value.sample
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}

/** 核心：纯字符串规则匹配，绝不执行命令 */
function run() {
  if (!scenario.value || finished.value) return
  const raw = input.value
  const cmd = normalizeCommand(raw)
  if (!cmd) return

  const step = currentStep.value!
  const matched = step.accept.some((re) => re.test(cmd))
  if (matched) {
    history.value.push({ cmd, output: step.output, ok: true, explain: step.explain })
    done.value.push(stepIndex.value)
    hintLevel.value = 0
  } else {
    history.value.push({
      cmd,
      output: unknownFeedback(cmd, scenario.value),
      ok: false,
    })
  }
  input.value = ''
  scrollToEnd()
}

function reset() {
  input.value = ''
  done.value = []
  history.value = []
  hintLevel.value = 0
  scrollToEnd()
}
</script>

<template>
  <div v-if="!scenario" class="lab lab-missing">演练场景「{{ scenarioId }}」不存在，请检查知识卡配置。</div>
  <div v-else class="lab">
    <div class="lab-head">
      <span class="lab-dot" />
      <strong>{{ scenario.title }}</strong>
      <span class="lab-progress">{{ done.length }}/{{ scenario.steps.length }} 步</span>
    </div>

    <p class="lab-mission">{{ scenario.mission }}</p>

    <div ref="scrollBox" class="lab-screen">
      <div class="lab-line lab-welcome"># {{ scenario.host }} 命令演练（模拟环境，不会真的执行）</div>
      <div v-for="(h, i) in history" :key="i" class="lab-entry">
        <div class="lab-cmd"><span class="lab-prompt">$</span> {{ h.cmd }}</div>
        <pre class="lab-output" :class="h.ok ? '' : 'lab-output-bad'">{{ h.output }}</pre>
        <p v-if="h.explain" class="lab-explain">{{ h.explain }}</p>
      </div>
      <div v-if="finished" class="lab-done">{{ scenario.wrapUp }}</div>
    </div>

    <div v-if="!finished" class="lab-hint">
      <button class="lab-mini" @click="hintLevel = 1">💡 给点提示</button>
      <button class="lab-mini" @click="fillSample">⌨️ 填入示例</button>
      <button class="lab-mini" @click="copySample">{{ copied ? '已复制 ✓' : '📋 复制示例' }}</button>
      <span v-if="hintLevel >= 1 && currentStep" class="lab-hint-text">{{ currentStep.hint }}</span>
      <code v-if="hintLevel >= 2 && currentStep" class="lab-sample">{{ currentStep.sample }}</code>
    </div>

    <div v-if="!finished" class="lab-input-row">
      <span class="lab-prompt">$</span>
      <input
        v-model="input"
        class="lab-input"
        type="text"
        spellcheck="false"
        autocomplete="off"
        :placeholder="currentStep ? '照着提示敲命令，回车运行' : ''"
        @keydown.enter="run"
      />
      <button class="lab-run" @click="run">运行 ↵</button>
    </div>

    <div class="lab-foot">
      <span>第 {{ Math.min(stepIndex + 1, scenario.steps.length) }} 步 · 敲对才会计入进度，敲错会告诉你为什么</span>
      <button class="lab-mini" @click="reset">🔄 重来</button>
    </div>
  </div>
</template>

<style scoped>
.lab {
  margin: 16px 0;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  overflow: hidden;
  background: #0a101f;
}
.lab-missing {
  padding: 12px 14px;
  color: var(--red);
}
.lab-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  background: #131b2e;
  border-bottom: 1px solid var(--border);
  font-size: 13.5px;
  color: #dbe4ff;
}
.lab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34d399;
  flex: 0 0 auto;
}
.lab-progress {
  margin-left: auto;
  font-size: 12px;
  color: #93a4cc;
}
.lab-mission {
  margin: 0;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #b7c1ff;
  background: rgba(124, 140, 255, 0.07);
}
.lab-screen {
  max-height: 380px;
  overflow-y: auto;
  padding: 12px 14px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12.5px;
}
.lab-welcome {
  color: #6b7a9c;
  margin-bottom: 8px;
}
.lab-entry {
  margin-bottom: 12px;
}
.lab-cmd {
  color: #e6edff;
  word-break: break-all;
}
.lab-prompt {
  color: #34d399;
  margin-right: 6px;
}
.lab-output {
  margin: 6px 0 0;
  color: #9fe1cb;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.6;
  font-size: 12px;
}
.lab-output-bad {
  color: #f5c4b3;
}
.lab-explain {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-left: 2px solid #7c8cff;
  background: rgba(124, 140, 255, 0.08);
  border-radius: 0 8px 8px 0;
  color: #c4cdec;
  font-family: var(--font-sans);
  font-size: 12.5px;
  line-height: 1.7;
}
.lab-done {
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid rgba(52, 211, 153, 0.4);
  border-radius: 8px;
  background: rgba(52, 211, 153, 0.08);
  color: #9fe1cb;
  font-family: var(--font-sans);
  line-height: 1.7;
}
.lab-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-top: 1px solid var(--border);
}
.lab-mini {
  padding: 3px 10px;
  font-size: 12px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--surface-strong);
  color: var(--text);
  cursor: pointer;
}
.lab-mini:hover {
  border-color: var(--primary);
}
.lab-hint-text {
  flex: 1 1 200px;
  font-size: 12.5px;
  color: #b7c1ff;
}
.lab-sample {
  flex: 1 1 100%;
  padding: 6px 9px;
  border-radius: 6px;
  background: rgba(250, 204, 21, 0.1);
  color: #facc15;
  font-size: 12px;
  word-break: break-all;
}
.lab-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 14px 10px;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 6px 10px;
  background: #0f1729;
}
.lab-input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #e6edff;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12.5px;
}
.lab-input::placeholder {
  color: #6b7a9c;
}
.lab-run {
  flex: 0 0 auto;
  border: 0;
  border-radius: 6px;
  padding: 5px 12px;
  background: #7c8cff;
  color: #fff;
  font-size: 12.5px;
  cursor: pointer;
}
.lab-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 14px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--muted);
}
@media (max-width: 640px) {
  .lab-screen { max-height: 300px; }
  .lab-hint-text { flex-basis: 100%; }
}
</style>
