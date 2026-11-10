import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'git-03-remote-001',
    type: 'single',
    difficulty: 1,
    tags: ['remote'],
    stem: `git remote -v 的作用是？`,
    options: [
      { key: 'A', text: '列出已配置的远程仓库地址与别名' },
      { key: 'B', text: '查看当前分支的提交历史' },
      { key: 'C', text: '删除远程分支' },
      { key: 'D', text: '显示工作区文件差异' },
    ],
    answers: ['A'],
    explanation: `remote -v 打印每个远程别名对应的 fetch / push URL。B 是 git log，C 是 git push --delete，D 是 git diff。`,
  },
  {
    id: 'git-03-remote-002',
    type: 'single',
    difficulty: 1,
    tags: ['pull'],
    stem: `git pull 默认等价于下列哪组操作？`,
    options: [
      { key: 'A', text: 'git add + git commit' },
      { key: 'B', text: 'git fetch + 合并到当前分支' },
      { key: 'C', text: 'git push + git tag' },
      { key: 'D', text: 'git clone + git checkout' },
    ],
    answers: ['B'],
    explanation: `pull 先 fetch 更新 origin/xxx 跟踪引用，再把远程提交合并（或按配置 rebase）到本地分支。A 是本地提交流程，C、D 与拉取无关。`,
  },
  {
    id: 'git-03-remote-003',
    type: 'single',
    difficulty: 2,
    tags: ['fetch'],
    stem: `git fetch 之后，工作区文件通常会？`,
    options: [
      { key: 'A', text: '立刻被远程版本覆盖' },
      { key: 'B', text: '保持不变，只更新本地保存的远程跟踪引用' },
      { key: 'C', text: '自动生成一个合并提交' },
      { key: 'D', text: '被清空' },
    ],
    answers: ['B'],
    explanation: `fetch 只下载对象并移动 origin/main 之类的引用，不动 HEAD 与工作区；要生效需再 merge 或 pull。A、C 是 pull 的效果，D 与 fetch 无关。`,
  },
  {
    id: 'git-03-remote-004',
    type: 'single',
    difficulty: 2,
    tags: ['push'],
    stem: `首次推送时用 git push -u origin main，其中 -u 的作用是？`,
    options: [
      { key: 'A', text: '强制覆盖远程历史' },
      { key: 'B', text: '建立本地 main 与 origin/main 的上游跟踪关系' },
      { key: 'C', text: '上传时自动压缩对象' },
      { key: 'D', text: '跳过 CI 检查' },
    ],
    answers: ['B'],
    explanation: `-u（--set-upstream）记录跟踪关系，之后可直接 git push / git pull 而不用每次写远程与分支。A 是 --force，C、D 不是 push 参数语义。`,
  },
  {
    id: 'git-03-remote-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['协作'],
    stem: `关于远程协作，下列说法正确的有哪些？`,
    options: [
      { key: 'A', text: 'origin/main 是本地保存的远程分支引用，不等于远程服务器实时状态' },
      { key: 'B', text: 'PR 通常包含 diff、评审意见与 CI 检查结果' },
      { key: 'C', text: '附注标签适合记录版本发布的作者与时间' },
      { key: 'D', text: 'push 被拒绝时最优先的做法是立即 git push --force' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 正确。D 危险：non-fast-forward 通常说明远程有新提交，应先 fetch/pull 整合；强推可能覆盖他人工作。`,
  },
  {
    id: 'git-03-remote-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['push'],
    scenario: `你准备 push 本地提交，Git 提示 ! [rejected] main -> main (non-fast-forward)，而同事半小时前刚合并了一个 PR。`,
    stem: `最稳妥的第一步是？`,
    options: [
      { key: 'A', text: 'git push --force 直接覆盖远程' },
      { key: 'B', text: 'git fetch 或 git pull --rebase 先把远程新提交整合进本地，再推送' },
      { key: 'C', text: '删除本地仓库重新 clone' },
      { key: 'D', text: '把远程分支删掉再重建' },
    ],
    answers: ['B'],
    explanation: `被拒是因为本地落后于远程，整合后提交就能快进推送。A 会覆盖同事的 PR，C 丢本地未推送工作，D 破坏共享分支。`,
  },
  {
    id: 'git-03-remote-007',
    type: 'code',
    difficulty: 3,
    tags: ['状态判读'],
    stem: `git status 显示下面这段，最合理的下一步是？

~~~text
On branch main
Your branch is ahead of 'origin/main' by 2 commits.
  (use "git push" to publish your local commits)
nothing to commit, working tree clean
~~~`,
    options: [
      { key: 'A', text: '执行 git pull，因为本地落后于远程' },
      { key: 'B', text: '执行 git push，把本地 2 个提交同步到远程' },
      { key: 'C', text: '执行 git reset --hard 丢弃本地提交' },
      { key: 'D', text: '先 git add 再 commit 一次' },
    ],
    answers: ['B'],
    explanation: `ahead by 2 表示本地比远程多两个提交，工作区又干净，直接 push 即可。A 方向反了，C 会丢提交，D 没有必要（没有待提交内容）。`,
  },
]
