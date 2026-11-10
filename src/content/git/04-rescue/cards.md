## reset、revert 与 restore

### 是什么
`git reset` 移动当前分支指针：`--soft` 只移指针、保留暂存区，`--mixed`（默认）保留工作区但清空暂存区，`--hard` 连工作区一起丢弃。`git revert` 新建一个「反向提交」来抵消某次改动，不改写历史。

### 怎么用
未推送的本地提交用 reset 整理；已推送到共享分支的错误用 revert。`git restore <文件>` 撤销工作区改动，`git restore --staged <文件>` 把文件从暂存区撤回。

### 常见坑
- `reset --hard` 会丢掉未提交改动，执行前先 status 或 stash。
- revert 一个合并提交要指定 `-m 1` 说明保留哪条主线。
- 误删提交别慌，`git reflog` 记录了 HEAD 的移动轨迹，通常能找回哈希。

### 面试怎么问
「线上分支回滚用 reset 还是 revert？」答 revert，因为不改写公共历史。

## stash、cherry-pick 与 reflog

### 是什么
`git stash` 把未提交改动临时收起来，`git stash pop` 恢复；`git cherry-pick <hash>` 把某一个提交复制到当前分支；`git reflog` 记录本地 HEAD 与分支引用的每一次移动。

### 怎么用
切分支救急前先 stash；修完回来 `git stash list` 找到对应条目再 pop。cherry-pick 常用于把 hotfix 从主干同步到发布分支。

### 常见坑
- stash 默认不收未跟踪文件，需要 `-u`。
- cherry-pick 复制的是「差异」而不是同一个提交对象，哈希会变。
- reflog 只存在于本地且有过期时间，别把它当长期备份。

### 面试怎么问
「reset --hard 之后还能找回吗？」答只要对象还没被 GC，用 reflog 找到哈希再 reset 回来。

## 动手清单
1. 制造一个未提交改动，依次练习 restore、restore --staged、stash pop，观察每步 status 的变化。
2. 用 reset --hard 回退一次本地提交，再用 git reflog 找回哈希恢复；自测标准：能说清 reflog 为什么能救回来。
