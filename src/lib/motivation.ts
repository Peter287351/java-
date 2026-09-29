/* 激励系统：等级、成就、鼓励语、庆祝彩带 */

export const DAILY_GOAL = 10

export const ACHIEVEMENTS = [
  { id: 'first-answer', icon: '🌱', name: '初试锋芒', desc: '答出第一道题' },
  { id: 'combo-10', icon: '🎯', name: '十连击', desc: '单轮练习连对 10 题' },
  { id: 'streak-3', icon: '🔥', name: '三日不辍', desc: '连续打卡 3 天' },
  { id: 'streak-7', icon: '⚡', name: '七日之约', desc: '连续打卡 7 天' },
  { id: 'hundred', icon: '💯', name: '百题斩', desc: '累计作答 100 次' },
  { id: 'chapter-clear', icon: '📜', name: '初章告捷', desc: '第一个章节全部掌握' },
  { id: 'exam-80', icon: '🏅', name: '模考新星', desc: '模考正确率 ≥ 80%' },
  { id: 'module-ready', icon: '🚀', name: '蓄势待发', desc: '第一个模块达到实习达标线' },
] as const

const LEVELS = [
  { xp: 0, title: '新生' },
  { xp: 60, title: '入门' },
  { xp: 180, title: '筑基' },
  { xp: 400, title: '进阶' },
  { xp: 700, title: '熟练' },
  { xp: 1100, title: '精进' },
  { xp: 1600, title: '融会' },
  { xp: 2200, title: '贯通' },
  { xp: 3000, title: '准实习工程师' },
]

export function levelOf(xp: number) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) idx = i
  const cur = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1
  return { level: idx + 1, title: cur.title, next: next?.xp ?? null, progress }
}

/** 答题经验：首次答对按难度，重复答对小奖励，答错也安慰 2 分 */
export function xpForAnswer(correct: boolean, firstTime: boolean, difficulty: number): number {
  if (!correct) return 2
  return firstTime ? 8 + 4 * difficulty : 4
}

const CHEERS_RIGHT = [
  '漂亮！继续保持 🔥',
  '稳！这题拿捏了 ✨',
  '太棒了，思路完全正确 👏',
  '可以，这就是实习生的水平 💪',
  '答对了！离达标又近一步 🚀',
  '干净利落，教科书级 ⚡',
]

const CHEERS_WRONG = [
  '没关系，错题本会帮你记牢它 📝',
  '差一点点，看完解析再来 💡',
  '这个坑很经典，踩过才会 🕳️',
  '别灰心，面试官也爱问这个 😉',
]

export function randomCheer(correct: boolean): string {
  const pool = correct ? CHEERS_RIGHT : CHEERS_WRONG
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 轻量彩带：纯 DOM + CSS 动画，无第三方依赖 */
export function confetti(count = 90) {
  const colors = ['#7c8cff', '#a78bfa', '#38d9f5', '#34d399', '#fbbf24', '#fb7185']
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    el.className = 'confetti-piece'
    el.style.left = Math.random() * 100 + 'vw'
    el.style.background = colors[i % colors.length]
    el.style.animationDuration = 2.2 + Math.random() * 1.6 + 's'
    el.style.animationDelay = Math.random() * 0.5 + 's'
    el.style.width = 6 + Math.random() * 6 + 'px'
    el.style.height = 10 + Math.random() * 8 + 'px'
    el.style.opacity = String(0.7 + Math.random() * 0.3)
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 4600)
  }
}
