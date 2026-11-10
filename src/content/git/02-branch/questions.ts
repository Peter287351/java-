import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'git-02-branch-001',
    type: 'single',
    difficulty: 1,
    tags: ['分支'],
    stem: `关于 Git 分支的本质，正确的说法是？`,
    options: [
      { key: 'A', text: '分支是仓库里一份完整的文件副本' },
      { key: 'B', text: '分支是指向某个提交的可移动指针，创建成本极低' },
      { key: 'C', text: '分支必须依赖服务器才能创建' },
      { key: 'D', text: '一个仓库最多只能有 3 个分支' },
    ],
    answers: ['B'],
    explanation: `分支文件里只存一个提交哈希，所以创建与切换都很快。A 是 SVN 式复制目录的误解，C、D 与本地仓库能力不符。`,
  },
  {
    id: 'git-02-branch-002',
    type: 'single',
    difficulty: 1,
    tags: ['分支'],
    stem: `想创建名为 feat/login 的分支并立刻切过去，用哪条命令？`,
    options: [
      { key: 'A', text: 'git branch feat/login' },
      { key: 'B', text: 'git switch -c feat/login' },
      { key: 'C', text: 'git remote add feat/login' },
      { key: 'D', text: 'git tag feat/login' },
    ],
    answers: ['B'],
    explanation: `switch -c（旧写法 checkout -b）一次完成创建与切换。A 只创建不切换，C 配远程，D 打标签。`,
  },
  {
    id: 'git-02-branch-003',
    type: 'single',
    difficulty: 2,
    tags: ['merge', 'rebase'],
    stem: `merge 与 rebase 最关键的区别是？`,
    options: [
      { key: 'A', text: 'merge 会改写已有提交哈希，rebase 不会' },
      { key: 'B', text: 'rebase 会把提交重放成新的提交（改写历史），merge 保留原历史并生成合并提交' },
      { key: 'C', text: 'merge 只能用于本地分支，rebase 只能用于远程分支' },
      { key: 'D', text: '两者都不会产生新提交' },
    ],
    answers: ['B'],
    explanation: `rebase 复制并重放提交，哈希会变；merge 新增一个合并提交但不动原有提交。A 把两者说反，C、D 与实现不符。`,
  },
  {
    id: 'git-02-branch-004',
    type: 'single',
    difficulty: 2,
    tags: ['冲突'],
    stem: `合并冲突时文件里出现 <<<<<<< HEAD 与 >>>>>>> 标记，正确做法是？`,
    options: [
      { key: 'A', text: '保留标记直接提交，Git 会在运行时自动忽略' },
      { key: 'B', text: '人工选择/合并两边内容，删掉全部标记后 git add 再提交' },
      { key: 'C', text: '执行 git stash 就能自动解决冲突' },
      { key: 'D', text: '删除整个文件重新创建' },
    ],
    answers: ['B'],
    explanation: `冲突标记只是 Git 标出双方内容，必须由人决定最终版本并清理标记，再 add + commit（rebase 场景用 --continue）。A 会把标记带进代码，C、D 都不是冲突解决流程。`,
  },
  {
    id: 'git-02-branch-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['合并'],
    stem: `下列关于合并的说法正确的有哪些？`,
    options: [
      { key: 'A', text: 'fast-forward 合并默认不产生合并提交' },
      { key: 'B', text: 'git merge --no-ff 可以强制保留一个合并提交' },
      { key: 'C', text: '已经推送且多人共用的分支不建议 rebase' },
      { key: 'D', text: 'git branch -d 会无条件删除任何未合并分支' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 都是正确的协作常识。D 错：-d 会拒绝删除未合并分支，强制删除要用 -D，这正是防误删的保护。`,
  },
  {
    id: 'git-02-branch-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['rebase'],
    scenario: `团队规定「已 push 到远程的公共分支禁止 rebase」。新人觉得 rebase 能让历史更好看，打算在自己的 feat 分支跟着别人一起开发时直接 rebase 并强推。`,
    stem: `这条规定主要防止什么？`,
    options: [
      { key: 'A', text: '防止提交信息写得太长' },
      { key: 'B', text: 'rebase 改写哈希后强推会让协作者的本地历史与远程分叉，甚至覆盖别人的提交' },
      { key: 'C', text: '防止磁盘空间被分支占满' },
      { key: 'D', text: '防止 Git 自动创建标签' },
    ],
    answers: ['B'],
    explanation: `公共分支的历史是多人协作基线，改写哈希相当于「换了一套提交」，其他人再 push 或 pull 就会冲突，强推更可能直接丢提交。A、C、D 都与 rebase 的风险无关。`,
  },
  {
    id: 'git-02-branch-007',
    type: 'code',
    difficulty: 3,
    tags: ['查看历史'],
    stem: `下面是 git log --oneline --graph 的输出片段，能判断出什么？

~~~text
*   a1b2c3d (HEAD -> main) Merge branch 'feat'
|\\  
| * 9f8e7d6 (feat) add login
* | 3c4d5e6 fix typo
|/  
* 1a2b3c4 init
~~~`,
    options: [
      { key: 'A', text: 'main 与 feat 曾分叉，之后产生了一个合并提交 a1b2c3d' },
      { key: 'B', text: '仓库只有一条线性历史，没有任何分支' },
      { key: 'C', text: 'feat 分支从未被合并' },
      { key: 'D', text: 'init 是最新的提交' },
    ],
    answers: ['A'],
    explanation: `分叉线 |\\ 与顶部的 Merge branch 提交说明两条历史汇合；a1b2c3d 有两个父提交。B 忽略了分叉，C 与 Merge 提交矛盾，D 把最底部的初始提交当成了最新。`,
  },
  {
    id: 'git-02-branch-008',
    type: 'single',
    difficulty: 2,
    tags: ['分支删除'],
    stem: `git branch -d feat 提示「分支未完全合并」并拒绝删除，说明什么？`,
    options: [
      { key: 'A', text: 'Git 版本太旧，升级客户端即可' },
      { key: 'B', text: '该分支有尚未合并的提交，-d 是防误删保护；确认不需要后用 -D 强制删除' },
      { key: 'C', text: '分支名里含有非法字符' },
      { key: 'D', text: '远程仓库已经删除了这个分支' },
    ],
    answers: ['B'],
    explanation: `-d 会检查合并状态，避免丢失未合并的提交；确认确实不要这些提交后才用 -D。A、C、D 都不会触发这条特定的拒绝提示。`,
  },
]
