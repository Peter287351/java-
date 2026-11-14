import type { SqlExercise, SqlStat } from '../types'
import { sqlExercises } from '../content/sql/exercises'

/**
 * SQL 技能路径：把题库里 40 个细碎标签归并为 6 个循序渐进的关卡。
 *
 * 为什么不直接按原始标签建关卡：40 个标签里有 27 个只挂了 1 道题，
 * 一标签一关会碎成「一题一关」，练不出由浅入深的节奏；而且 TOP N / TopN
 * 这类大小写不一致会造成重复关卡。所以这里做「标签 → 技能关卡」归并，
 * 关卡顺序按 SQL 知识依赖排列，与四步拆解（主表→连表→分组→条件）呼应。
 *
 * 每道题按其 tags 归入一个或多个关卡（跨关重复是有意的：同一知识点在不同场景复现）。
 * 进度完全基于现有 sqlStats，不新增存储字段。
 */

export interface SqlStage {
  id: string
  no: string
  title: string
  emoji: string
  desc: string
  /** 本关归并的原始标签 */
  tags: string[]
  /** 本关要练成的能力，点开关卡时给用户的一句话目标 */
  focus: string
}

export const SQL_STAGES: SqlStage[] = [
  {
    id: 'filter',
    no: '①',
    title: '单表过滤与排序',
    emoji: '🔍',
    desc: '先把一张表查明白：WHERE 过滤、ORDER BY 排序、DISTINCT 去重、日期范围与取前 N',
    tags: ['WHERE', 'ORDER BY', 'DISTINCT', '日期范围', '日期函数', 'TopN'],
    focus: '看到题目先定主表，再问「筛哪些行、按什么排、要不要去重、取几条」。',
  },
  {
    id: 'group',
    no: '②',
    title: '分组统计与聚合',
    emoji: '📊',
    desc: 'GROUP BY / HAVING / 聚合函数 / 条件聚合 / 行转列 / 时间桶，练「每个、各、按…统计」',
    tags: [
      'GROUP BY', 'HAVING', '聚合', 'MAX', 'AVG',
      'CASE WHEN', '条件聚合', '行转列', '时间桶', 'COALESCE',
    ],
    focus: '分组键是什么、每组算什么；聚合后的条件只能写 HAVING，不能写 WHERE。',
  },
  {
    id: 'join',
    no: '③',
    title: '多表连接与反连接',
    emoji: '🔗',
    desc: 'LEFT JOIN / 自连接 / 不等值连接 / 多表关联 / EXISTS 与 NOT EXISTS 反连接',
    tags: [
      'LEFT JOIN', '多表 JOIN', '多表关联', '自连接', '不等值连接',
      '反连接', 'EXISTS', 'NOT EXISTS', '相关子查询', '连续问题',
    ],
    focus: '先问谁是全量主表；要保住主表全部行用 LEFT JOIN，找「没有对应记录」用反连接。',
  },
  {
    id: 'subquery',
    no: '④',
    title: '子查询、CTE 与集合运算',
    emoji: '🧩',
    desc: '标量子查询、CTE、递归 CTE、UNION，练「先造中间结果再查」的分层思维',
    tags: [
      '子查询', '标量子查询', 'CTE', '递归 CTE', '树形结构',
      '集合运算', 'UNION', '反连接',
    ],
    focus: '把复杂需求拆成两层：内层算出中间表，外层再筛选或比较。',
  },
  {
    id: 'window',
    no: '⑤',
    title: '窗口函数与排名',
    emoji: '🪟',
    desc: 'RANK / DENSE_RANK / ROW_NUMBER / LAG / SUM OVER，练组内排名、环比与累计',
    tags: [
      '窗口函数', 'DENSE_RANK', 'ROW_NUMBER', 'LAG', 'SUM OVER', 'TopN',
    ],
    focus: '窗口函数不会把多行压成一行；PARTITION BY 分组、ORDER BY 定序，再在外层筛名次。',
  },
  {
    id: 'ops',
    no: '⑥',
    title: '运维排障综合实战',
    emoji: '🚨',
    desc: '用 SQL 定位线上故障：日志、错误率、时间窗口、发布版本、心跳异常',
    tags: ['运维排障'],
    focus: '按「现象 → 线索 → 处置」读题，先定位时间范围与维度，再决定聚合口径。',
  },
]

/** 标签归一化：统一大小写与内部空格，消除 TOP N / TopN 之类的重复 */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, '').toUpperCase()
}

/** 某一关包含的全部题目（按难度、再按 id 排序，保证由浅入深） */
export function questionsOfStage(stage: SqlStage): SqlExercise[] {
  const set = new Set(stage.tags.map(normalizeTag))
  return sqlExercises
    .filter((ex) => ex.tags.some((t) => set.has(normalizeTag(t))))
    .sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id))
}

/** 点击单个标签时练的题目（归一化匹配，TOP N 与 TopN 视为同一个标签） */
export function questionsOfTag(tag: string): SqlExercise[] {
  const key = normalizeTag(tag)
  return sqlExercises
    .filter((ex) => ex.tags.some((t) => normalizeTag(t) === key))
    .sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id))
}

export interface StageStat {
  total: number
  passed: number
  pct: number
  /** 本关全部题目都通过过 */
  mastered: boolean
}

export function stageStat(stage: SqlStage, stats: Record<string, SqlStat>): StageStat {
  const list = questionsOfStage(stage)
  const passed = list.filter((ex) => (stats[ex.id]?.passed ?? 0) > 0).length
  return {
    total: list.length,
    passed,
    pct: list.length ? passed / list.length : 0,
    mastered: list.length > 0 && passed === list.length,
  }
}

/** 解锁阈值：上一关通过 60% 才开下一关，避免卡在个别难题上 */
export const UNLOCK_RATIO = 0.6

/** 关卡是否解锁：第一关永远开放，其余看前一关完成度 */
export function stageUnlocked(index: number, stats: Record<string, SqlStat>): boolean {
  if (index <= 0) return true
  return stageStat(SQL_STAGES[index - 1], stats).pct >= UNLOCK_RATIO
}

export interface TagStat {
  tag: string
  total: number
  passed: number
}

/** 某关内每个标签的掌握情况，供「每个标签都练到位」的进度展示 */
export function tagStats(stage: SqlStage, stats: Record<string, SqlStat>): TagStat[] {
  // 同关内归一化后重复的标签（TOP N / TopN）只展示一次
  const seen = new Set<string>()
  const tags = stage.tags.filter((t) => {
    const k = normalizeTag(t)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return tags.map((tag) => {
    const list = questionsOfTag(tag)
    return {
      tag,
      total: list.length,
      passed: list.filter((ex) => (stats[ex.id]?.passed ?? 0) > 0).length,
    }
  })
}

export interface OverallStat {
  total: number
  passed: number
  masteredStages: number
  /** 全部关卡达到解锁阈值 → 开放综合训练 */
  finalUnlocked: boolean
  /** 已经至少通过 1 题的标签数 / 题库标签总数 */
  coveredTags: number
  totalTags: number
  /** 还没练过的标签，点一下就能单独练 */
  missingTags: string[]
}

/** 题库里出现过的全部标签（归一化去重，TOP N 与 TopN 算同一个） */
export function allTags(): string[] {
  const seen = new Map<string, string>()
  for (const ex of sqlExercises) {
    for (const t of ex.tags) {
      const k = normalizeTag(t)
      if (!seen.has(k)) seen.set(k, t)
    }
  }
  return [...seen.values()]
}

export function overallStat(stats: Record<string, SqlStat>): OverallStat {
  const passed = sqlExercises.filter((ex) => (stats[ex.id]?.passed ?? 0) > 0).length
  const masteredStages = SQL_STAGES.filter((s) => stageStat(s, stats).pct >= UNLOCK_RATIO).length
  const tags = allTags()
  const missingTags = tags.filter((tag) =>
    questionsOfTag(tag).every((ex) => (stats[ex.id]?.passed ?? 0) === 0),
  )
  return {
    total: sqlExercises.length,
    passed,
    masteredStages,
    finalUnlocked: masteredStages === SQL_STAGES.length,
    coveredTags: tags.length - missingTags.length,
    totalTags: tags.length,
    missingTags,
  }
}

/** 可复现的伪随机（同一天同一个种子给出同一套卷，避免刷新就换题） */
function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const a = [...arr]
  let s = seed >>> 0
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 综合训练组卷：按难度分层抽题，覆盖尽量多的技能关，题目不重复 */
export function buildFinalExam(seed = new Date().toISOString().slice(0, 10)): SqlExercise[] {
  let n = 0
  for (const ch of String(seed)) n = (n * 31 + ch.charCodeAt(0)) >>> 0
  const quota: [1 | 2 | 3, number][] = [[1, 2], [2, 5], [3, 3]]
  const picked: SqlExercise[] = []
  const used = new Set<string>()
  for (const [diff, count] of quota) {
    const pool = seededShuffle(
      sqlExercises.filter((e) => e.difficulty === diff),
      n + diff * 7919,
    )
    for (const ex of pool) {
      if (picked.filter((p) => p.difficulty === diff).length >= count) break
      if (used.has(ex.id)) continue
      used.add(ex.id)
      picked.push(ex)
    }
  }
  // 题量不足时（例如题库变小）按难度补满，仍不重复
  if (picked.length < 10) {
    for (const ex of seededShuffle(sqlExercises, n + 104729)) {
      if (picked.length >= 10) break
      if (!used.has(ex.id)) {
        used.add(ex.id)
        picked.push(ex)
      }
    }
  }
  return picked.sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id))
}
