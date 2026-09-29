# 内容生产指南（CONTENT_GUIDE）

本指南是题库内容的**唯一格式契约**。所有内容文件由本指南约束，网站引擎按此解析。

---

## 1. 文件布局

每个模块一个目录，每个章节一个子目录：

```
src/content/<moduleId>/module.json          ← 模块清单（已由项目方提供，内容作者【不要】修改）
src/content/<moduleId>/<chapterId>/cards.md        ← 本章知识卡（Markdown）
src/content/<moduleId>/<chapterId>/questions.ts    ← 本章题目（TypeScript 数组）
```

- `chapterId` 就是章节目录名（如 `02-index`），必须与 module.json 中 chapters[].id 完全一致。
- 不要创建指南之外的任何文件（不要 index.ts、不要 README、不要动其他模块）。

## 2. cards.md 格式

- 每张知识卡是一个 `## 卡片标题` 段落，一张卡聚焦一个主题。
- 每章 2–3 张卡，最后一张固定为 `## 动手清单`（1–2 个小练习 + 自测标准）。
- 每张卡内部用 `###` 小节组织：**是什么 → 为什么 → 怎么用 → 常见坑 → 面试怎么问**（可按内容取舍，但"常见坑"与"面试怎么问"尽量保留）。
- 单张卡 300–600 字，中文讲解 + 英文术语原文，代码块用标准 ``` 围栏并标注语言（```java / ```sql / ```yaml）。
- cards.md 是真正的 Markdown 文件，直接写即可。

示例（节选）：

```markdown
## HashMap 的底层结构

### 是什么
JDK 8 起 HashMap 用「数组 + 链表 + 红黑树」……

### 常见坑
- 树化阈值是 8，但前提是数组长度 ≥ 64，否则先扩容……

### 面试怎么问
「HashMap 什么时候链表转红黑树？」——先说 8，再补 64 与扩容优先，体现完整度。
```

## 3. questions.ts 格式

题目用 TypeScript 而非 JSON（便于书写多行文本）。每个文件固定结构：

```ts
import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'java-basics-03-collections-001',
    type: 'single',
    difficulty: 2,
    tags: ['HashMap'],
    stem: '在 JDK 8 中，下面代码的输出是什么？\n\n~~~java\nMap<String, Integer> map = new HashMap<>();\nmap.put("a", 1);\nSystem.out.println(map.get("A"));\n~~~',
    options: [
      { key: 'A', text: '1' },
      { key: 'B', text: 'null' },
      { key: 'C', text: '抛出 NullPointerException' },
      { key: 'D', text: '编译错误' },
    ],
    answers: ['B'],
    explanation: 'HashMap 的 key 用 equals/hashCode 定位，"A" 与 "a" 不相等，返回 null……',
  },
]
```

**书写硬规则（违反会导致构建失败）：**

1. 多行文本一律用**模板字符串**（反引号）或 `\n` 拼接；模板字符串内**绝不能出现反引号** —— 代码块围栏一律用三个波浪线 `~~~`（开头标注语言，如 `~~~java`），**不要用 ``` **。
2. 模板字符串内如需字面量 `${`（如 Spring 占位符），必须写成 `\${`。
3. `id` 全局唯一，格式固定：`<moduleId>-<chapterId>-<三位序号>`，如 `mysql-02-index-003`，序号从 001 递增。
4. `type` ∈ `single | multiple | scenario | code`；`difficulty` ∈ 1/2/3。
5. `single` 恰好 1 个答案；`multiple` ≥2 个答案；`scenario`/`code` 通常 1 个答案。
6. `options` 2–6 个，key 依次为 A/B/C/D/...，与 answers 对应；**禁止**"以上都对/以上都不对"式选项。
7. `scenario` 题必须填 `scenario` 字段（场景描述），`stem` 是问题本身；其他题型不要填 scenario。
8. `code` 题的 `stem` 必须包含 `~~~` 代码块，且代码必须**可运行、结果确定**。
9. `tags` 用简短中文考点词（如 `['索引','最左前缀']`），同一章内保持一致。
10. `explanation` 必须解释**正确答案为什么对，且每个错误选项分别错在哪**；2–6 句，Markdown 可用（围栏同样用 `~~~`）。

## 4. 内容质量标准

- **语言**：中文讲解，代码/标识符/术语用英文；不使用"送分题"式的废话题干。
- **难度配比**（每章约）：difficulty 1 占 30%，2 占 45%，3 占 25%。
- **题型配比**（每章约）：single 55–60%，multiple 15%，scenario 15–20%，code 10–15%。
- **scenario 题**要还原真实工作场景：现象 → 线索 → 决策，选项是不同处置方案，干扰项应是"看起来合理但诊断错误"的做法，解析给出完整排查链路。
- **code 题**考"读代码"能力：输出预测、bug 定位、行为辨析；Java 题用 Java 8+ 语法。
- **知识卡**面向 0 基础读者，但要有深度增量（常见坑、面试问法），不写教科书式面面俱到。
- 每章题目必须**全覆盖本章大纲列出的考点**，不留死角。

## 5. 提交前自查（每个 questions.ts）

1. 模板字符串内无反引号、无未转义的 `${`。
2. import 路径正确（`../../../types`）。
3. id 前缀与所在模块/章节一致，序号连续。
4. 每题的 answers 都是 options 中存在的 key。
