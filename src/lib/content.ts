import type { Chapter, KnowledgeCard, Module, ModuleMeta, QuestionSpec } from '@/types'

// glob 用相对当前文件的路径：以 / 开头的绝对路径在 Windows 下会被拼成 c:/... 的错误路径，
// 导致 dev 与 build 都无法解析题库文件。
const manifestModules = import.meta.glob('../content/*/module.json', { eager: true })
const cardFiles = import.meta.glob('../content/*/*/cards.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const questionFiles = import.meta.glob('../content/*/*/questions.ts', { eager: true })

/** cards.md 以 `## 标题` 分隔成多张知识卡 */
function parseCards(md: string): KnowledgeCard[] {
  const cards: KnowledgeCard[] = []
  for (const section of md.split(/^## /m)) {
    const t = section.trim()
    if (!t) continue
    const nl = t.indexOf('\n')
    const title = (nl === -1 ? t : t.slice(0, nl)).trim()
    const body = nl === -1 ? '' : t.slice(nl + 1).trim()
    if (title) cards.push({ title, body })
  }
  return cards
}

export const modules: Module[] = (() => {
  const metas: ModuleMeta[] = Object.values(manifestModules).map(
    (m) => (m as { default: ModuleMeta }).default,
  )
  // 先按学习阶段、再按阶段内顺序排列，保证首页模块列表与学习路径一致
  metas.sort((a, b) => a.stage - b.stage || a.order - b.order)
  return metas.map((meta) => {
    const chapters: Chapter[] = meta.chapters.map((cm) => {
      // 与上面 glob 的相对路径保持一致，才能按文件名取到知识卡和题目
      const cardKey = `../content/${meta.id}/${cm.id}/cards.md`
      const qKey = `../content/${meta.id}/${cm.id}/questions.ts`
      const cards = cardKey in cardFiles ? parseCards(cardFiles[cardKey]) : []
      const questions =
        qKey in questionFiles
          ? ((questionFiles[qKey] as { questions?: QuestionSpec[] }).questions ?? [])
          : []
      // 循序渐进：每章题目按难度 升序（同难度按 id）排序，学习从入门到实战
      questions.sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id))
      return { meta: cm, cards, questions }
    })
    return { meta, chapters }
  })
})()

export function getModule(id: string): Module | undefined {
  return modules.find((m) => m.meta.id === id)
}

export function getChapter(moduleId: string, chapterId: string): Chapter | undefined {
  return getModule(moduleId)?.chapters.find((c) => c.meta.id === chapterId)
}

export interface QuestionRef {
  q: QuestionSpec
  moduleId: string
  chapterId: string
}

export const questionIndex = new Map<string, QuestionRef>()
for (const m of modules)
  for (const c of m.chapters)
    for (const q of c.questions)
      questionIndex.set(q.id, { q, moduleId: m.meta.id, chapterId: c.meta.id })

export function questionById(id: string): QuestionRef | undefined {
  return questionIndex.get(id)
}

export const totalQuestionCount = questionIndex.size

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  single: '单选',
  multiple: '多选',
  scenario: '情景题',
  code: '代码题',
}

export const DIFFICULTY_LABEL: Record<number, string> = {
  1: '入门',
  2: '进阶',
  3: '实战',
}
