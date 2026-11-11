import type { SqlExercise } from '../types'

/**
 * SQL 四步拆解：把「看到题目 → 写出查询」的过程固化成固定四步。
 *
 * 设计原则：口诀和写法指导在每道题上都一样，靠重复形成肌肉记忆；
 * 本题只给「信号词」提示（题干里哪个词在暗示什么结构），不暴露具体表名/字段/条件值，
 * 更不能把参考答案改写出来——否则就变成抄答案，练不到思路。
 */
export interface SqlStep {
  key: 'main' | 'join' | 'group' | 'filter'
  no: string
  title: string
  /** 固定口诀：每题相同，反复强化 */
  mnemonic: string
  /** 固定写法指导 */
  guide: string
  /** 本题是否用到这一步 */
  used: boolean
  /** 本题的信号提示，只讲「往哪想」，不给具体值 */
  signal: string
}

export interface SqlBlueprint {
  steps: SqlStep[]
  /** 只含关键字与占位符的空白骨架，可复制到编辑器照着填 */
  skeleton: string
  /** 写完后的自检问题 */
  checklist: string[]
}

const MNEMONIC: Record<SqlStep['key'], { no: string; title: string; mnemonic: string; guide: string }> = {
  main: {
    no: '①',
    title: '主表 FROM',
    mnemonic: '结果里「每一行」代表谁？先定主体，再动笔',
    guide: '先在心里说出这一行是什么（一个员工？一个部门？一个订单？），那张表就是 FROM 的起点。',
  },
  join: {
    no: '②',
    title: '连表 JOIN',
    mnemonic: '字段不够才连表；要保住主表全部行 → LEFT，只要两边都匹配 → INNER',
    guide: '先问「要的字段在不在主表里」。LEFT JOIN 保留左表全部行，INNER JOIN 只留对得上的行；自连接要给两张表起不同别名。',
  },
  group: {
    no: '③',
    title: '统计 / 分组',
    mnemonic: '看到「每个 / 各 / 按…」就分组；SELECT 里非分组列必须进聚合函数',
    guide: 'COUNT / SUM / AVG / MAX / MIN 配 GROUP BY；分组后想再筛聚合结果，用 HAVING 而不是 WHERE。',
  },
  filter: {
    no: '④',
    title: '条件与收尾',
    mnemonic: '分组前的行过滤写 WHERE，分组后的聚合过滤写 HAVING，最后 ORDER BY / LIMIT',
    guide: '先过滤、再分组、最后排序取前 N；题目要求「并列也要」「按某列升序」时，别忘了排序和并列处理。',
  },
}

/** 只看参考 SQL 的「结构」，不读具体表名、字段、条件值，避免剧透 */
function structure(sql: string) {
  const s = sql.replace(/--[^\n]*/g, ' ').toUpperCase()
  const count = (re: RegExp) => (s.match(re) ?? []).length
  return {
    joins: count(/\bJOIN\b/g),
    leftJoin: /\bLEFT\s+(OUTER\s+)?JOIN\b/.test(s),
    where: /\bWHERE\b/.test(s),
    having: /\bHAVING\b/.test(s),
    groupBy: /\bGROUP\s+BY\b/.test(s),
    aggregate: /\b(COUNT|SUM|AVG|MAX|MIN|COALESCE)\s*\(/.test(s),
    window: /\bOVER\s*\(/.test(s),
    distinct: /\bDISTINCT\b/.test(s),
    cte: /\bWITH\b/.test(s),
    union: /\bUNION\b/.test(s),
    exists: /\b(EXISTS|NOT\s+EXISTS|IN\s*\(|NOT\s+IN\s*\()/.test(s),
    limit: /\bLIMIT\b/.test(s),
    orderBy: /\bORDER\s+BY\b/.test(s),
    fromSubquery: /\bFROM\s*\(/.test(s),
  }
}

export function buildSqlBlueprint(ex: SqlExercise): SqlBlueprint {
  const t = structure(ex.reference)
  const stem = ex.stem
  const hasGroupWord = /(每个|各|按|分组|人数|次数|汇总|统计|总数|总额)/.test(stem)
  const hasKeepAll = /(没有.*也|所有|全部|从未|都要|包含|都要出现)/.test(stem)
  const hasTopN = /(最高|最多|前\s*\d|最慢|最快|排名|冠军|\d+\s*名)/.test(stem)

  const steps: SqlStep[] = [
    {
      key: 'main',
      ...MNEMONIC.main,
      used: true,
      signal: t.fromSubquery || t.cte
        ? '本题的「主表」不是原始表，而是先造出来的一张中间结果（子查询 / CTE）——先把这层想清楚。'
        : '先把主体定下来：题目最终要输出的是「谁」的一行？',
    },
    {
      key: 'join',
      ...MNEMONIC.join,
      used: t.joins > 0 || t.exists || t.union,
      signal: t.exists
        ? '本题是「有没有对应记录」的判断，想想 EXISTS / NOT EXISTS 与 JOIN 的区别。'
        : t.joins > 1
          ? `本题要连 ${t.joins} 次表，先画一下表与表之间靠哪个字段对上。`
          : t.leftJoin
            ? '注意题目里「没有…也要出现」这类要求 → 谁必须被完整保留？'
            : hasKeepAll
              ? '题目里有「所有 / 全部 / 从未」的字眼，先想清楚哪张表是必须全保留的主表。'
              : '先确认要的字段是否都在主表里，不够再连。',
    },
    {
      key: 'group',
      ...MNEMONIC.group,
      used: t.groupBy || t.aggregate || t.distinct || t.window,
      signal: t.window
        ? t.groupBy
          ? '本题是「先聚合、再排名」两层：内层用 GROUP BY 算出每组的汇总，外层用 OVER(PARTITION BY …) 排名；窗口函数不会把行压成一行。'
          : '本题是「组内排名 / 组内累计」：窗口函数 OVER(PARTITION BY …) 不会把多行压成一行，和 GROUP BY 不是一回事。'
        : t.groupBy
          ? hasGroupWord
            ? '题干里的「每个 / 各 / 按…」就是分组信号，分组键要想清楚。'
            : '本题有分组，先确定按什么分组、每组算什么。'
          : t.distinct
            ? '本题要的是「不重复的值」，想想 DISTINCT 和 GROUP BY 各自适合什么场合。'
            : t.aggregate
              ? '本题要算一个汇总值，注意聚合函数作用于哪些行。'
              : '本题不需要分组，别为了用聚合而分组。',
    },
    {
      key: 'filter',
      ...MNEMONIC.filter,
      used: t.where || t.having || t.orderBy || t.limit || hasTopN,
      signal: t.having
        ? '本题要「对统计结果再筛选」，这个条件不能写在 WHERE 里。'
        : hasTopN
          ? '题目要「前几名 / 最值」，注意并列情况与排序方向。'
          : t.where
            ? '本题有行级条件，它发生在分组之前。'
            : t.orderBy
              ? '别忘了题目对输出顺序的要求，以及排序字段的升 / 降序。'
              : '检查输出列、排序和行数限制是否都符合题意。',
    },
  ]

  // 空白骨架：只有关键字和占位符，按书写顺序排列，本题没用到的结构不放进去
  const lines = ['SELECT  <要输出的列>']
  lines.push(t.fromSubquery || t.cte
    ? 'FROM    ( <先造出中间结果> )  AS t   -- ① 主体'
    : 'FROM    <主表>                     -- ① 主体')
  if (t.joins > 0) {
    lines.push(`${t.leftJoin ? 'LEFT JOIN' : 'JOIN'} <附表> ON <两表怎么对上>   -- ② 连表`)
    if (t.joins > 1) lines.push('JOIN    <另一张附表> ON <关联条件>')
  }
  if (t.where) lines.push('WHERE   <分组前的行条件>        -- ④')
  if (t.groupBy) lines.push('GROUP BY <分组列>               -- ③')
  if (t.having) lines.push('HAVING  <对聚合结果的条件>      -- ④')
  if (t.window) lines.push('-- ③ 组内排名 / 累计：函数名() OVER (PARTITION BY <分组列> ORDER BY <排序列>)')
  if (t.orderBy) lines.push('ORDER BY <排序列> ASC|DESC      -- ④ 收尾')
  if (t.limit) lines.push('LIMIT   <N>                     -- ④ 取前 N')

  const checklist = [
    '① 我说得出结果里「每一行」代表什么吗？主表选对了吗？',
    '② 需要的字段都在主表里吗？连表类型和连接条件对吗？该保留的行有没有被 INNER JOIN 吃掉？',
    '③ 分组键对吗？SELECT 里有没有「既没分组、又没聚合」的列？COUNT(*) 会不会把 NULL 行也数进去？',
    '④ 条件写在 WHERE 还是 HAVING？排序方向、并列、前 N 都处理了吗？',
  ]

  return { steps, skeleton: lines.join('\n'), checklist }
}
