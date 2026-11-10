import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'git-01-basics-001',
    type: 'single',
    difficulty: 1,
    tags: ['git add'],
    stem: `git add 命令的作用是？`,
    options: [
      { key: 'A', text: '把改动直接推送到远程仓库' },
      { key: 'B', text: '把工作区改动写入暂存区，形成待提交快照' },
      { key: 'C', text: '在本地生成一条提交历史' },
      { key: 'D', text: '从远程拉取最新代码' },
    ],
    answers: ['B'],
    explanation: `add 只影响暂存区，commit 才生成本地提交，push 才同步到远程。A 是 push，C 是 commit，D 是 fetch/pull。`,
  },
  {
    id: 'git-01-basics-002',
    type: 'single',
    difficulty: 1,
    tags: ['git commit'],
    stem: `执行 git commit -m "feat: 新增登录" 之后，改动处于？`,
    options: [
      { key: 'A', text: '仍只在工作区' },
      { key: 'B', text: '已保存到本地仓库，但还没到远程' },
      { key: 'C', text: '已经同步到 GitHub' },
      { key: 'D', text: '已被删除' },
    ],
    answers: ['B'],
    explanation: `commit 在本地仓库生成提交对象，需要再执行 push 才会上传到远程。A 是未 add 的状态，C 把 commit 当成了 push，D 与提交语义相反。`,
  },
  {
    id: 'git-01-basics-003',
    type: 'single',
    difficulty: 2,
    tags: ['git diff'],
    stem: `想检查「即将被提交」的内容，应该用哪个命令？`,
    options: [
      { key: 'A', text: 'git diff --staged' },
      { key: 'B', text: 'git diff' },
      { key: 'C', text: 'git log -1' },
      { key: 'D', text: 'git status --short' },
    ],
    answers: ['A'],
    explanation: `git diff 比较工作区与暂存区，git diff --staged 比较暂存区与 HEAD，正好是下次 commit 的内容。C 看历史，D 只列文件名与状态。`,
  },
  {
    id: 'git-01-basics-004',
    type: 'single',
    difficulty: 2,
    tags: ['.gitignore'],
    stem: `文件已被 Git 跟踪，之后才把它写进 .gitignore，结果是？`,
    options: [
      { key: 'A', text: '自动从仓库删除并停止跟踪' },
      { key: 'B', text: '忽略规则对它不生效，仍会继续跟踪改动' },
      { key: 'C', text: 'Git 会报错并拒绝提交' },
      { key: 'D', text: '文件被移到暂存区' },
    ],
    answers: ['B'],
    explanation: `.gitignore 只作用于未跟踪文件；已跟踪的要先执行 git rm --cached <文件> 取消跟踪，再提交删除。A、C、D 都不是实际行为。`,
  },
  {
    id: 'git-01-basics-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['基础命令'],
    stem: `下列命令与用途对应正确的有哪些？`,
    options: [
      { key: 'A', text: 'git status 查看工作区与暂存区状态' },
      { key: 'B', text: 'git log --oneline 查看简洁提交历史' },
      { key: 'C', text: 'git show <hash> 查看某次提交的改动' },
      { key: 'D', text: 'git clone 用来把本地改动推送到远程' },
    ],
    answers: ['A', 'B', 'C'],
    explanation: `A、B、C 是标准用法。D 反了：clone 是把远程仓库复制到本地，推送用 git push。`,
  },
  {
    id: 'git-01-basics-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['敏感信息'],
    scenario: `同事把含数据库密码的 application-local.yml 提交并推送到了团队仓库，随后只在最新一次提交里删掉了该文件。`,
    stem: `关于这个处理，最准确的判断是？`,
    options: [
      { key: 'A', text: '文件已删除，历史里也查不到，无需其它动作' },
      { key: 'B', text: '密码仍在历史提交里，必须轮换密码并清理历史' },
      { key: 'C', text: '只要把仓库设为私有就安全了' },
      { key: 'D', text: '在 .gitignore 里补一行即可清除历史记录' },
    ],
    answers: ['B'],
    explanation: `删除文件只改变最新快照，旧提交仍完整保存内容；密钥一旦进过远程历史就要视为已泄露，先轮换凭据，再用 filter-repo/BFG 清理历史并通知协作者。A、C、D 都低估了历史的不可变性。`,
  },
  {
    id: 'git-01-basics-007',
    type: 'code',
    difficulty: 3,
    tags: ['git status'],
    stem: `执行 git status 看到如下输出，下一步若直接 git commit 会提交什么？

~~~text
On branch main
Changes to be committed:
  modified:   App.java
Changes not staged for commit:
  modified:   README.md
~~~`,
    options: [
      { key: 'A', text: '只提交 App.java 的改动' },
      { key: 'B', text: 'App.java 与 README.md 一起提交' },
      { key: 'C', text: '只提交 README.md 的改动' },
      { key: 'D', text: '什么都不提交并报错' },
    ],
    answers: ['A'],
    explanation: `commit 只固化暂存区（Changes to be committed）里的 App.java；README.md 属于未暂存改动，会留在工作区。想一起提交需要先 git add README.md。`,
  },
]
