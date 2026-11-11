export type QuestionType = 'single' | 'multiple' | 'scenario' | 'code'

export interface QuestionOption {
  key: string
  text: string
}

export interface QuestionSpec {
  id: string
  type: QuestionType
  difficulty: 1 | 2 | 3
  tags: string[]
  /** 仅 scenario 题填写：场景描述 */
  scenario?: string
  /** 题干，Markdown；code 题内含 ~~~ 代码块 */
  stem: string
  options: QuestionOption[]
  /** 正确答案的 option key 集合 */
  answers: string[]
  /** 解析，Markdown */
  explanation: string
}

export interface ChapterMeta {
  id: string
  title: string
}

export interface ModuleMeta {
  id: string
  title: string
  emoji: string
  stage: 1 | 2 | 3 | 4 | 5 | 6
  order: number
  description: string
  chapters: ChapterMeta[]
}

export interface KnowledgeCard {
  title: string
  body: string
}

export interface Chapter {
  meta: ChapterMeta
  cards: KnowledgeCard[]
  questions: QuestionSpec[]
}

export interface Module {
  meta: ModuleMeta
  chapters: Chapter[]
}

/* ---------- 进度相关 ---------- */

export interface QuestionStat {
  attempts: number
  /** 连续答对次数 */
  streak: number
  everCorrect: boolean
  lastCorrect: boolean
  /** 答错后置 true，连续答对 2 次自动移出错题本 */
  needsReview: boolean
  lastAt: number
}

export interface ExamTagStat {
  correct: number
  total: number
}

export interface ExamRecord {
  id: string
  date: number
  scopeLabel: string
  questionIds: string[]
  answers: Record<string, string[]>
  total: number
  correct: number
  durationSec: number
  perTag: Record<string, ExamTagStat>
  perDiff: Record<string, ExamTagStat>
}

export interface ActiveExam {
  id: string
  scopeLabel: string
  questionIds: string[]
  answers: Record<string, string[]>
  index: number
  startedAt: number
  endsAt: number
}

/** 章节练习里某一题本轮的作答快照 */
export interface PracticeAnswerRecord {
  selected: string[]
  correct: boolean
  cheer: string
}

/** 进行中的一轮章节练习：按练习范围分别保存，换页面/刷新回来能接着做 */
export interface PracticeSession {
  /** 练习范围标识（由路由 query 规范化得到） */
  scopeKey: string
  ids: string[]
  idx: number
  /** 每题当前选择（含还没提交的草稿） */
  drafts: string[][]
  /** 每题作答快照，null 表示本轮还没提交 */
  records: (PracticeAnswerRecord | null)[]
  finished: boolean
  summaryShown: boolean
  lastSubmittedIdx: number
  combo: number
  bestCombo: number
  /** 本轮累计获得的经验值（不依赖页面打开时的基准值） */
  sessionXpEarned: number
  lastAt: number
}

export interface ProgressData {
  version: 1
  stats: Record<string, QuestionStat>
  /** qid → 存疑标记时间 */
  doubts: Record<string, number>
  exams: ExamRecord[]
  /** 'YYYY-MM-DD' → 当日答题数 */
  daily: Record<string, number>
  /** 'YYYY-MM-DD' → 当日有效学习秒数（页面在前台且有操作才计入） */
  studySeconds: Record<string, number>
  lastVisit: { moduleId: string; chapterId: string } | null
  activeExam: ActiveExam | null
  /** 进行中的章节练习，按范围隔离（只保留最近若干轮） */
  practiceSessions: Record<string, PracticeSession>
  /** 手写 SQL 练习记录 */
  sqlStats: Record<string, SqlStat>
  /** 经验值与成就（激励系统） */
  xp: number
  unlocked: Record<string, number>
  bestCombo: number
  /** 已庆祝过每日目标的日期 */
  lastGoalCelebrate: string
}

/* ---------- 手写 SQL 练习 ---------- */

export interface SqlDataset {
  id: string
  name: string
  /** 建表 + 初始化数据（多语句） */
  ddl: string
}

export interface SqlExercise {
  id: string
  title: string
  difficulty: 1 | 2 | 3
  tags: string[]
  datasetId: string
  /** 业务问题 */
  stem: string
  /** 参考答案（判分基准） */
  reference: string
  /** 备用解法：与参考答案结果必须一致，用于双重验证 */
  alts?: string[]
  /** 递进提示 */
  hints: string[]
  explanation: string
  /** 结果是否必须按序一致（题目要求排序时为 true） */
  orderMatters?: boolean
  /** 常见错误定位：判分失败且用户 SQL 命中 pattern（正则源串）时，优先展示对应提示 */
  commonMistakes?: { pattern: string; hint: string }[]
}

export interface SqlStat {
  passed: number
  attempts: number
  viewedAnswer: boolean
  lastAt: number
}

export const STAGES: { stage: 1 | 2 | 3 | 4 | 5 | 6; title: string }[] = [
  { stage: 1, title: '语言地基' },
  { stage: 2, title: '存储与中间件' },
  { stage: 3, title: '框架核心' },
  { stage: 4, title: 'AI 应用' },
  { stage: 5, title: '微服务与分布式' },
  { stage: 6, title: '交付与运维' },
]

export const READY_ACCURACY = 0.8
