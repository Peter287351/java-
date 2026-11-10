## 四个区域与一次提交

### 是什么
Git 分四个区域：工作区（你正在改的文件）、暂存区（`git add` 后的快照）、本地仓库（`git commit` 后的历史）、远程仓库（GitHub / GitLab）。`git status` 随时告诉你文件在哪个区域。

### 怎么用
日常循环是：`git status` → `git add <文件>` → `git commit -m "说明"` → `git push`。`git add .` 会把当前目录所有变更都放进去，提交前务必用 status 和 diff 复核。

### 常见坑
- `git commit` 只提交暂存区内容，`add` 之后又改过的文件不会进这次提交。
- 空目录 Git 不跟踪，需要放 `.gitkeep` 之类占位文件。
- commit 信息写「update」「fix」无法追溯，建议写清「做了什么、为什么」。

### 面试怎么问
「add 和 commit 分别做了什么？」答把工作区快照写入暂存区、再把暂存区固化成一次提交对象。

## 查看历史与差异

### 是什么
`git log --oneline --graph` 看提交线，`git diff` 看工作区与暂存区差异，`git diff --staged` 看即将提交的内容，`git show <hash>` 看某次提交详情。

### 怎么用
提交前用 `git diff --staged` 做最后一次自检；排查「这行谁改的」用 `git blame <文件>`。`.gitignore` 要在文件被跟踪之前写才有效，已跟踪的要先 `git rm --cached`。

### 常见坑
- 密钥、`.env`、`target/`、`node_modules/` 误提交后，只删文件不够，历史里仍然存在。
- `git diff` 默认不显示已 add 的改动，容易误以为没改。
- `.gitignore` 对已经跟踪的文件无效，这是最常见的「忽略不生效」原因。

### 面试怎么问
「误提交了密码怎么办？」答先撤销并改密码/轮换密钥，再清理历史（filter-repo 等），因为只删文件历史仍可查。

## 动手清单
1. 新建仓库，改两次文件但只 add 一次，用 status / diff / diff --staged 观察三个区域的差别。
2. 故意把一个 .log 文件提交后再写进 .gitignore，验证忽略规则不生效，再用 `git rm --cached` 修复。
