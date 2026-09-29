# 后端修炼场 ⚡

免费开源的后端实习学习平台：通过「知识卡先学后练 + 选择题/情景题实战演练」，帮助想学后端的实习生从 0 到 1 达到实习水平。

> **8 大模块 · 39 个章节 · 293 道精讲题 · 完全免费 · 纯前端零后端**

## 模块与学习路径

| 阶段 | 模块 |
|---|---|
| 一 · 语言地基 | Java 基础 |
| 二 · 存储与中间件 | MySQL → Redis → Elasticsearch |
| 三 · 框架核心 | Spring → Spring Boot |
| 四 · AI 应用 | LangChain4j → LangGraph4j |

**实习达标线**：每个模块全章节掌握（题目答对过）且最近一次作答正确率 ≥ 80%，首页实时展示"实习就绪度"。

## 功能特性

- **先学后练**：每章 2–3 张知识卡（是什么→为什么→怎么用→常见坑→面试怎么问）+ 动手清单，学完即练
- **四种题型**：单选 / 多选 / 情景题（真实故障排查场景）/ 代码阅读题（全部经过真实编译运行验证），解析覆盖每个错误选项
- **循序渐进**：每章题目按 入门 → 进阶 → 实战 自动排序
- **模拟考试**：20 题 25 分钟，按难度配比抽题，交卷出考点报告
- **错题本**：答错自动进本，连续答对 2 次自动移出
- **激励系统**：经验值 / 9 级头衔 / 每日目标 / 连击 / 8 枚成就 / 全对彩带庆祝
- **进度管理**：localStorage 持久化 + JSON 导出/导入迁移

## 快速开始

环境要求：Node.js ≥ 18（自带 npm）

```bash
git clone https://github.com/Peter287351/java-.git
cd java-
npm install
npm run dev        # 开发模式，默认 http://localhost:5173
```

生产构建与本地预览：

```bash
npm run build      # 产出纯静态 dist/ 目录
npm run preview    # 本地预览构建产物
```

其他脚本：

```bash
npm run validate    # 校验题库 schema（--strict 为全量严格模式）
npm run typecheck   # TypeScript 类型检查
```

## 部署（可选）

`dist/` 是纯静态文件（hash 路由 + 相对路径），可托管到任意静态服务：

- **GitHub Pages**：仓库 Settings → Pages → 选择 GitHub Actions 或分支部署 `dist/`
- **Vercel / Netlify**：导入仓库，构建命令 `npm run build`，产物目录 `dist`
- **本机直接使用**：构建后用任意静态服务器（如 `npx serve dist`）或双击 `dist/index.html` 亦可运行

## 隐私与数据安全

- **纯前端架构**：无后端、无账号系统、无 Cookie、无任何第三方统计/追踪脚本，构建产物完全离线可用
- **数据只在你本地**：学习进度保存在浏览器 `localStorage`（键 `hds_progress_v1`），不上传任何服务器
- **换浏览器/清缓存会丢进度**：请先在「设置」页导出 JSON 备份，换设备后导入即可
- 无痕模式下关闭窗口进度不保留，属浏览器机制

## 扩充题库

1. 阅读 [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)，在对应模块目录新增章节（`cards.md` + `questions.ts`）
2. 在 `module.json` 的 `chapters` 中登记
3. 运行 `npm run validate` 与 `npm run build` 确认通过

## 目录结构

```
docs/DESIGN.md            设计文档（含自我 review）
docs/CONTENT_GUIDE.md     题库内容格式契约
scripts/validate-content.mjs  题库校验脚本（直接 import 题目数据做结构化校验）
src/content/<module>/     题库：module.json 清单 + 每章 cards.md / questions.ts
src/lib/content.ts        内容加载与索引（import.meta.glob 静态导入，按难度排序）
src/lib/exam.ts           模考抽题与判卷
src/lib/motivation.ts     激励系统（等级/成就/彩带）
src/stores/progress.ts    进度存储（localStorage 持久化）
src/views/                页面（首页/路径/模块/章节/刷题/模考/错题本/设置）
```

## 技术栈

Vue 3 + TypeScript + Vite + Pinia + Vue Router（hash 路由）+ marked，暗色极光主题纯手写 CSS，无 UI 框架依赖。
