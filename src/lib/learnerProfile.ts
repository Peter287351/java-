/* 学习画像：根据本轮错题生成薄弱点、学习建议与 AI 追问清单（纯规则，可解释、零外部依赖） */
import type { QuestionRef } from './content'
import { getModule, getChapter } from './content'
import type { QuestionSpec } from '../types'
import { plainText } from './utils'

export interface LearnerReport {
  weakTags: { tag: string; count: number }[]
  summary: string
  suggestions: { text: string; link?: string }[]
  aiQuestions: string[]
}

/** 题型在句子里的自然说法：避免「情景题题」「代码题题」这类重复 */
const TYPE_WORD: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  scenario: '情景题',
  code: '代码题',
}

/** 题干摘要：用于「我错在哪些题」的清单，把代码块压成 [代码] 保持简短 */
function brief(q: QuestionSpec): string {
  return plainText(q.stem, 56)
}

/**
 * 把一道错题还原成 AI 能看懂的完整题目卡片。
 * 这里刻意不用 plainText：code / scenario 题的代码块与场景是判断依据，必须原样给 AI。
 * 题库里最长的题干是 599 字，整段带上也不会让提示词过长。
 */
function questionCard(ref: QuestionRef, picked: string[]): string {
  const q = ref.q
  const lines: string[] = []
  lines.push(`【题型】${TYPE_WORD[q.type] ?? q.type}`)
  if (q.scenario) lines.push(`【场景】${q.scenario.trim()}`)
  lines.push(`【题干】${q.stem.trim()}`)
  lines.push('【选项】')
  for (const op of q.options) lines.push(`${op.key}. ${op.text}`)
  lines.push(`【我选的答案】${picked.length ? picked.join('、') : '（未作答）'}`)
  lines.push(`【正确答案】${q.answers.join('、')}`)
  return lines.join('\n')
}

function pickedOf(q: QuestionSpec, pickedByQid: Record<string, string[]>): string[] {
  return pickedByQid[q.id] ?? []
}

/**
 * @param wrong        本轮错题
 * @param total        本轮作答总数
 * @param pickedByQid  每道题「我当时实际选了哪些选项」，用于让 AI 定位错因；缺省时用「未作答」
 */
export function buildLearnerReport(
  wrong: QuestionRef[],
  total: number,
  pickedByQid: Record<string, string[]> = {},
): LearnerReport {
  const weakMap = new Map<string, number>()
  const diffMap = new Map<number, number>()
  const typeMap = new Map<string, number>()
  for (const w of wrong) {
    for (const t of w.q.tags) weakMap.set(t, (weakMap.get(t) ?? 0) + 1)
    diffMap.set(w.q.difficulty, (diffMap.get(w.q.difficulty) ?? 0) + 1)
    typeMap.set(w.q.type, (typeMap.get(w.q.type) ?? 0) + 1)
  }
  const weakTags = [...weakMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const d1 = diffMap.get(1) ?? 0
  const d3 = diffMap.get(3) ?? 0
  const multi = typeMap.get('multiple') ?? 0
  const totalWrong = wrong.length

  // 一句话画像
  let summary = ''
  if (totalWrong === 0) {
    summary = `本轮 ${total} 题全对，知识点掌握得很扎实，可以挑战下一章或更高难度。`
  } else {
    const parts: string[] = []
    if (weakTags.length) {
      parts.push(`薄弱点集中在${weakTags.map((t) => `「${t.tag}」`).join('、')}`)
    }
    if (d1 >= Math.max(2, totalWrong * 0.4)) parts.push('基础概念题失分偏多，概念层还需要加固')
    else if (d3 >= Math.max(1, totalWrong * 0.5)) parts.push('概念已基本掌握，实战应用（场景排查/综合判断）是当前短板')
    if (multi >= 2) parts.push('多选题容易漏选/错选')
    // 错题没有标签、难度与题型都不集中时，parts 会是空的，别只留一个句号
    if (!parts.length) {
      parts.push(`本轮错了 ${totalWrong} 题，建议先逐题读解析，再把错题连做两遍`)
    }
    summary = parts.join('；') + '。'
  }

  // 学习建议
  const suggestions: LearnerReport['suggestions'] = []
  if (weakTags.length) {
    const main = wrong.find((w) => w.q.tags.includes(weakTags[0].tag))
    if (main) {
      const m = getModule(main.moduleId)
      const c = getChapter(main.moduleId, main.chapterId)
      if (m && c) {
        suggestions.push({
          text: `回到《${m.meta.title} · ${c.meta.title}》重读知识卡的「是什么/为什么/常见坑」，再做一次本章练习`,
          link: `/chapter/${main.moduleId}/${main.chapterId}`,
        })
      }
    }
  }
  if (d1 >= Math.max(2, totalWrong * 0.4)) {
    suggestions.push({ text: '先补概念再刷题：把错题对应的知识卡通读一遍，合上书能复述核心定义才算过' })
  } else if (d3 >= Math.max(1, totalWrong * 0.5)) {
    suggestions.push({ text: '概念已够，多做场景演练：把每道情景题的「现象 → 线索 → 处置」排查链路自己复述一遍，并举一个工作中的例子' })
  }
  if (multi >= 2) {
    suggestions.push({ text: '多选题不要凭感觉：逐选项先写「对/错」，再合并判断；漏选比错选更常见' })
  }
  if (totalWrong > 0) {
    suggestions.push({ text: '今天的错题已进错题本，连续答对 2 次才会移出——明天先花 5 分钟回收它们', link: '/wrong' })
    // 问题条数随薄弱标签变化，不写死数字，免得对不上
    suggestions.push({
      text: '下面的问题已经带上题目、选项和你当时的作答，复制给 Kimi / DeepSeek 就能直接问，不用再手动补题',
    })
  }

  /* ---------- AI 追问清单 ---------- */
  const aiQuestions: string[] = []
  const mainTag = weakTags[0]?.tag
  const main = mainTag ? wrong.find((w) => w.q.tags.includes(mainTag)) : undefined
  const moduleTitle = main ? getModule(main.moduleId)?.meta.title ?? '后端' : '后端'
  // 用本轮真实错题给 AI 一个上下文，避免它泛泛科普
  const wrongBrief = wrong
    .slice(0, 3)
    .map((w) => `「${brief(w.q)}」`)
    .join('、')

  if (mainTag) {
    aiQuestions.push(
      [
        `我是 Java 后端实习生，本轮练习错了 ${totalWrong} 题，集中暴露在「${mainTag}」（${moduleTitle}）上，做错的题有：${wrongBrief}。请按 4 步帮我补齐，全程用中文：`,
        `1）先用一句话讲清「${mainTag}」到底解决什么问题、在 Java / Spring Boot 体系里处于哪一层，再配一个生活化类比；`,
        `2）给一段可运行的最小 Java / Spring Boot 示例，逐行注释关键处；`,
        `3）列出初学者最常踩的 3 个坑，每个坑按「错误写法 → 会出什么后果 → 正确写法」写；`,
        `4）最后出 2 道自检小题，先别给答案，等我回答后再逐题批改。`,
      ].join('\n'),
    )
    aiQuestions.push(
      [
        `请扮演 Java 后端面试官，围绕「${mainTag}」对我做一场模拟面试，目标是查出我在这轮错题里暴露的理解盲区（做错的题：${wrongBrief}）。`,
        `规则：一次只问 1 题，由浅入深；我回答后，先点评我答对了什么、漏了什么，再给参考答案，然后才问下一题。不要一次把题目和答案全列出来，也不要提前剧透。`,
        `共 3～5 轮，结束时给我一句总体评价和一份针对性的补强清单。现在请开始问第 1 题。`,
      ].join('\n'),
    )
  }

  if (wrong.length) {
    // 挑最有代表性的一题（高难度优先）做完整复盘
    const hardest = [...wrong].sort((a, b) => b.q.difficulty - a.q.difficulty)[0]
    const picked = pickedOf(hardest.q, pickedByQid)
    const lines = [
      `我刚做错了一道${TYPE_WORD[hardest.q.type] ?? '练习题'}，请帮我彻底弄懂，不要只丢一个结论。题目原文、四个选项、我选的答案和正确答案都在下面：`,
      '',
      questionCard(hardest, picked),
      '',
      '请按 4 步回答（中文）：',
      '1）先诊断我错在哪：概念记混、漏选 / 多选，还是审题漏了关键词？明确指出我多选了哪个、漏选了哪个；',
      '2）逐个点评每个选项「对在哪 / 错在哪」，不要只解释正确答案；',
      '3）给一个真实的 Java 后端工作场景（线上排查、接口设计、配置取舍等），说明这个知识点什么时候会用到、用错会引发什么事故；',
      '4）最后出 1 道同类变式题，先不给答案，等我回答后再批改，并告诉我该回哪一章重读。',
    ]

    // 还有其他错题时附上清单，让 AI 归纳共性错因，而不是只盯着一道
    const rest = wrong.filter((w) => w.q.id !== hardest.q.id).slice(0, 2)
    if (rest.length) {
      lines.push('', '【本轮其余错题，请在回答完后顺带归纳共性错因、给出复习顺序】')
      for (const [i, w] of rest.entries()) {
        const p = pickedOf(w.q, pickedByQid)
        lines.push(
          `${i + 1}. ${brief(w.q)}`,
          `   我选：${p.length ? p.join('、') : '未作答'} ｜ 正确：${w.q.answers.join('、')}`,
        )
      }
    }
    aiQuestions.push(lines.join('\n'))
  }

  return { weakTags, summary, suggestions, aiQuestions }
}
