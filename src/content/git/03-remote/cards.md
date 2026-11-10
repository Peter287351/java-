## 远程、跟踪分支与 fetch/pull/push

### 是什么
`origin` 是远程仓库的默认别名；`origin/main` 是本地保存的远程分支快照（远程跟踪引用），`git fetch` 只更新这个快照，`git pull` = fetch + 合并到当前分支。

### 怎么用
首次推送用 `git push -u origin main` 建立上游跟踪，之后可直接 `git push` / `git pull`。`git remote -v` 看地址，`git branch -vv` 看跟踪关系。

### 常见坑
- push 被拒（non-fast-forward）说明远程有你本地没有的提交，先 pull/rebase 再推，别直接 `--force`。
- `git fetch` 不会改工作区，适合先看别人改了什么；直接 pull 可能立刻触发冲突。
- 改了远程地址用 `git remote set-url origin <新地址>`，别删了重建丢配置。

### 面试怎么问
「fetch 和 pull 的区别？」答 pull 多了一步合并，fetch 更安全可控。

## PR / MR 与标签

### 是什么
Pull Request / Merge Request 是「请求把某个分支合入目标分支」的协作流程，附带 diff、讨论、CI 检查与评审。`tag` 给某个提交打不可移动的记号，常用于版本发布。

### 怎么用
从 main 拉功能分支 → 小步提交 → push 到远程 → 开 PR → 评审通过后合并并删除分支。发布时打 `git tag -a v1.2.0 -m "..."` 并 `git push --tags`。

### 常见坑
- PR 粒度太大没人能审；一个 PR 尽量只解决一件事。
- 轻量标签与附注标签不同，发布建议用 `-a` 附注标签以便记录作者与时间。
- 合并后忘记同步本地 main，下次又在旧基线上开分支，冲突会越积越多。

### 面试怎么问
「你们的代码怎么合进主干？」答分支 + PR + CI + 评审 + 合并策略，能说出 squash / merge commit 的取舍更好。

## 动手清单
1. 用 git remote -v 确认地址，手动 fetch 一次后用 git log origin/main 查看差异，再执行 pull。
2. 给当前提交打一个附注标签并推送，用 git tag -n 查看说明；自测标准：能说清 tag 与 branch 的区别。
