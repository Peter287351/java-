import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'git-04-rescue-001',
    type: 'single',
    difficulty: 1,
    tags: ['stash'],
    stem: `git stash 的典型用途是？`,
    options: [
      { key: 'A', text: '把未提交改动临时收起，方便干净地切换分支' },
      { key: 'B', text: '永久删除某次提交' },
      { key: 'C', text: '把本地分支推送到远程' },
      { key: 'D', text: '给提交打版本标签' },
    ],
    answers: ['A'],
    explanation: `stash 保存工作区/暂存区快照并恢复到 HEAD 状态，之后用 pop 或 apply 取回。B 是 reset/revert 的范畴，C 是 push，D 是 tag。`,
  },
  {
    id: 'git-04-rescue-002',
    type: 'single',
    difficulty: 1,
    tags: ['revert'],
    stem: `git revert 与 git reset 最关键的区别是？`,
    options: [
      { key: 'A', text: 'revert 只能用于未推送提交' },
      { key: 'B', text: 'revert 新增一个反向提交抵消改动，不改写已有历史' },
      { key: 'C', text: 'reset 会自动推送到远程' },
      { key: 'D', text: '两者完全相同，只是别名' },
    ],
    answers: ['B'],
    explanation: `revert 通过新提交「做反向 diff」，历史继续向前，适合共享分支；reset 移动分支指针改写历史，只适合本地未推送的提交。A 说反了适用场景，C、D 错误。`,
  },
  {
    id: 'git-04-rescue-003',
    type: 'single',
    difficulty: 2,
    tags: ['reset'],
    stem: `git reset --hard HEAD~1 最需要警惕的是？`,
    options: [
      { key: 'A', text: '会同时丢弃工作区与暂存区中未提交的改动' },
      { key: 'B', text: '会自动删除远程仓库' },
      { key: 'C', text: '会把提交信息改写成英文' },
      { key: 'D', text: '会让仓库变成只读' },
    ],
    answers: ['A'],
    explanation: `--hard 把 HEAD、暂存区、工作区一起重置到目标提交，未提交改动无法从 status 找回（可尝试 reflog 但文件改动未必在内）。B、C、D 都不是它的行为。`,
  },
  {
    id: 'git-04-rescue-004',
    type: 'single',
    difficulty: 2,
    tags: ['reflog'],
    stem: `误用 reset --hard 丢了一个本地提交后，最先应该查看？`,
    options: [
      { key: 'A', text: 'git reflog' },
      { key: 'B', text: 'git remote -v' },
      { key: 'C', text: 'git tag' },
      { key: 'D', text: 'git status --short' },
    ],
    answers: ['A'],
    explanation: `reflog 记录 HEAD 每次移动的目标哈希，找到旧提交后 reset 回去或 cherry-pick 即可。B 看远程地址，C 看标签，D 只看当前工作区状态。`,
  },
  {
    id: 'git-04-rescue-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['撤销'],
    stem: `下列关于 Git 撤销操作的说法正确的有哪些？`,
    options: [
      { key: 'A', text: 'git restore <文件> 撤销工作区改动' },
      { key: 'B', text: 'git restore --staged <文件> 把文件从暂存区撤回' },
      { key: 'C', text: 'git cherry-pick 会把指定提交的改动复制到当前分支并生成新哈希' },
      { key: 'D', text: 'git stash 默认会把未跟踪的新文件一起收起' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 正确。D 错：stash 默认只收已跟踪文件的改动，未跟踪文件要加 -u（--include-untracked）。`,
  },
  {
    id: 'git-04-rescue-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['回滚'],
    scenario: `一个错误提交已经 push 到团队共享的 main，并且同事基于它拉了新分支。现在要让这条改动失效。`,
    stem: `最合适的做法是？`,
    options: [
      { key: 'A', text: 'git reset --hard HEAD~1 后 git push --force' },
      { key: 'B', text: 'git revert <错误提交> 生成一个反向提交并正常推送' },
      { key: 'C', text: '删除远程仓库重新建一个' },
      { key: 'D', text: '在本地删掉那个提交文件即可' },
    ],
    answers: ['B'],
    explanation: `共享分支不能改写历史：revert 追加反向提交，所有人的历史仍然连续。A 会让同事分支与远程分叉甚至丢提交，C、D 破坏协作基线。`,
  },
  {
    id: 'git-04-rescue-007',
    type: 'code',
    difficulty: 3,
    tags: ['reflog'],
    stem: `git reflog 输出如下，想回到「add payment」那次提交，应使用哪个命令？

~~~text
a1b2c3d (HEAD -> main) HEAD@{0}: reset: moving to HEAD~1
9f8e7d6 HEAD@{1}: commit: add payment
3c4d5e6 HEAD@{2}: commit: init
~~~`,
    options: [
      { key: 'A', text: 'git reset --hard 9f8e7d6' },
      { key: 'B', text: 'git reset --hard 3c4d5e6' },
      { key: 'C', text: 'git revert a1b2c3d' },
      { key: 'D', text: 'git stash pop' },
    ],
    answers: ['A'],
    explanation: `reflog 显示 HEAD@{1} 的 9f8e7d6 正是被 reset 掉的 add payment，reset --hard 到它即可恢复。B 会回到更早的 init，C 对当前提交做反向提交不对，D 与提交恢复无关。`,
  },
]
