import type { Directive } from 'vue'

/** v-spotlight：聚光灯卡片——鼠标跟随高光（设置 --mx/--my CSS 变量） */
export const vSpotlight: Directive<HTMLElement> = {
  mounted(el: HTMLElement) {
    el.classList.add('spotlight')
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      el.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }
    el.addEventListener('mousemove', move)
    ;(el as HTMLElement & { _spotlightMove?: typeof move })._spotlightMove = move
  },
  unmounted(el: HTMLElement) {
    const move = (el as HTMLElement & { _spotlightMove?: (e: MouseEvent) => void })._spotlightMove
    if (move) el.removeEventListener('mousemove', move)
  },
}
