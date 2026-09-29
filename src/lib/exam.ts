import type { ExamRecord, ExamTagStat } from '@/types'
import type { QuestionRef } from './content'
import { questionById } from './content'
import { setEquals, shuffle } from './utils'

/** 按难度配比（30% 入门 / 45% 进阶 / 25% 实战）抽题，不足部分从剩余补齐 */
export function pickExamQuestions(pool: QuestionRef[], count: number): QuestionRef[] {
  const byDiff: Record<number, QuestionRef[]> = { 1: [], 2: [], 3: [] }
  for (const r of pool) byDiff[r.q.difficulty].push(r)
  const quota: Record<number, number> = {
    1: Math.round(count * 0.3),
    2: Math.round(count * 0.45),
    3: Math.round(count * 0.25),
  }
  const picked: QuestionRef[] = []
  const rest: QuestionRef[] = []
  for (const d of [1, 2, 3]) {
    const shuffled = shuffle(byDiff[d])
    picked.push(...shuffled.slice(0, quota[d]))
    rest.push(...shuffled.slice(quota[d]))
  }
  while (picked.length < count && rest.length) picked.push(rest.shift()!)
  return shuffle(picked).slice(0, count)
}

/** 判卷并统计按 tag / 难度的得分 */
export function gradeExam(
  questionIds: string[],
  answers: Record<string, string[]>,
): { correct: number; perTag: Record<string, ExamTagStat>; perDiff: Record<string, ExamTagStat>; wrongIds: string[] } {
  let correct = 0
  const perTag: Record<string, ExamTagStat> = {}
  const perDiff: Record<string, ExamTagStat> = {}
  const wrongIds: string[] = []
  for (const id of questionIds) {
    const ref = questionById(id)
    if (!ref) continue
    const ok = setEquals(answers[id] ?? [], ref.q.answers)
    if (ok) correct++
    else wrongIds.push(id)
    const keys = [...ref.q.tags.map((t) => `tag:${t}`), `diff:${ref.q.difficulty}`]
    for (const k of keys) {
      const bucket = k.startsWith('tag:') ? perTag : perDiff
      const name = k.slice(k.indexOf(':') + 1)
      const stat = (bucket[name] ??= { correct: 0, total: 0 })
      stat.total++
      if (ok) stat.correct++
    }
  }
  return { correct, perTag, perDiff, wrongIds }
}

export function buildExamRecord(
  scopeLabel: string,
  questionIds: string[],
  answers: Record<string, string[]>,
  durationSec: number,
): ExamRecord {
  const { correct, perTag, perDiff } = gradeExam(questionIds, answers)
  return {
    id: `exam-${Date.now()}`,
    date: Date.now(),
    scopeLabel,
    questionIds,
    answers,
    total: questionIds.length,
    correct,
    durationSec,
    perTag,
    perDiff,
  }
}
