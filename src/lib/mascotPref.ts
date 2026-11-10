/* 桌面玩偶的显示偏好：玩偶组件与设置页共享同一个响应式状态，
   切换后立刻生效，并沿用已有的 localStorage 键 hds_mascot_hidden。 */
import { ref } from 'vue'

const STORAGE_KEY = 'hds_mascot_hidden'

function readHidden(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export const mascotHidden = ref(readHidden())

export function setMascotHidden(value: boolean) {
  mascotHidden.value = value
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // 隐私模式等场景下 localStorage 不可写：仍保证本次会话内开关生效
  }
}
