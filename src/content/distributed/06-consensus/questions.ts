import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'distributed-06-consensus-001',
    type: 'single',
    difficulty: 1,
    tags: ['Raft', '选主'],
    stem: '关于 Raft 的选主与任期，下列说法正确的是？',
    options: [
      { key: 'A', text: 'Candidate 拿到超过半数节点的选票才能成为 Leader，任期号用于让旧 Leader 的心跳失效' },
      { key: 'B', text: '得票最多的节点即可成为 Leader，不要求过半' },
      { key: 'C', text: '任期号只用于日志排序，与选主安全性无关' },
      { key: 'D', text: 'Follower 收不到心跳会立即自己提升为 Leader' },
    ],
    answers: ['A'],
    explanation:
      '过半投票是 Raft 安全性的地基：任意两个多数派集合必然相交，新 Leader 因此一定包含已提交的日志。B 错在「相对多数」会允许网络分区两侧各选出一个主，直接造成脑裂。C 错在任期号正是让旧 Leader 被识别并拒绝的机制——旧主发出低任期心跳时，节点会告知它已过期，它必须降级。D 错在 Follower 超时后先转为 Candidate 并拉票，不是自我提升；只有拿到过半票才算当选。A 正确：这也是为什么集群节点数取奇数，3 节点容忍 1 故障、5 节点容忍 2 故障。',
  },
  {
    id: 'distributed-06-consensus-002',
    type: 'single',
    difficulty: 2,
    tags: ['Quorum', '读写一致性'],
    stem: 'N=3 副本、W=2 写确认、R=2 读副本，满足 W + R > N。下列判断正确的是？',
    options: [
      { key: 'A', text: '只要 W + R > N，读写副本集合必有交集，读到的副本里至少有一个含最新写入' },
      { key: 'B', text: 'W + R > N 能保证读到的一定是最新值，不需要版本比较' },
      { key: 'C', text: 'W 越小写入越安全，因为写入延迟更低' },
      { key: 'D', text: 'N 取偶数比奇数容错更高，因为票数更对称' },
    ],
    answers: ['A'],
    explanation:
      '抽屉原理：两个大小分别为 2 的集合，在 3 个元素里必然至少共享 1 个，所以读集合里至少有一个副本见过最新写。B 错在「必有交集」只保证能拿到含新值的副本，应用仍需按版本号/时间戳挑最新那份，直接返回第一个响应仍可能是旧值。C 说反了：W 越小，写确认的副本越少，宕机丢数据的风险越高，只是延迟低。D 错在 4 节点过半需 3 票、仍只容忍 1 故障，与 3 节点相同却多付一台成本，所以共识集群惯用奇数。A 正确：这是 Quorum 读写能避免「读到完全没更新过的副本」的核心推理。',
  },
  {
    id: 'distributed-06-consensus-003',
    type: 'multiple',
    difficulty: 3,
    tags: ['脑裂', 'fencing'],
    stem: '关于脑裂与 fencing token，下列说法正确的有？',
    options: [
      { key: 'A', text: '心跳超时只能推测节点可能故障，无法区分「进程真死了」和「只是 GC 停顿或网络抖动」' },
      { key: 'B', text: 'fencing token 单调递增，存储层拒绝比已见最大 token 更小的写请求' },
      { key: 'C', text: '只要给分布式锁设置了足够长的过期时间，就不可能出现两个写者同时操作共享资源' },
      { key: 'D', text: '网络分区时，少数派一侧应停止写入，否则恢复后可能产生冲突数据' },
    ],
    answers: ['A', 'B', 'D'],
    explanation:
      '这题考的是「超时是推测而非事实」这一层。A 是全部讨论的起点，正因为判活不可靠，才需要额外机制。B 是 fencing 的定义，把安全性下沉到资源层，旧持有者即便自认为持锁也写不进去。D 是分区时的正确取舍：保一致就应让少数派拒绝写，恢复后再做数据对账。C 错在无论 TTL 多长，进程暂停时间都可能超过它；旧持有者恢复后仍会继续写，与新持有者形成两个写者——这正是必须配合 fencing token 或数据库版本号兜底的原因。',
  },
  {
    id: 'distributed-06-consensus-004',
    type: 'scenario',
    difficulty: 3,
    tags: ['脑裂', '线上排查'],
    scenario:
      '一个用 Redis 分布式锁保护的库存扣减服务，锁 TTL 30 秒。某次 Full GC 让实例 A 暂停了 40 秒，期间锁过期、实例 B 拿到锁并完成扣减。A 恢复后继续执行原来的扣减逻辑并写库，导致库存被扣了两次。数据库表没有唯一约束，也没有版本号字段。',
    stem: '最根本的修复是？',
    options: [
      { key: 'A', text: '把锁 TTL 调到 10 分钟，确保任何 GC 停顿都不会超过它' },
      { key: 'B', text: '给锁配单调递增的 fencing token，并在数据库写入时用版本号或唯一约束拒绝过期的持有者' },
      { key: 'C', text: '把心跳超时调短，让 Redis 更快判定 A 已下线' },
      { key: 'D', text: '在扣减前先查一次库存，大于 0 才扣' },
    ],
    answers: ['B'],
    explanation:
      '根因是「超时判活不可信 + 下游无防线」：A 只是暂停，恢复后仍认为自己持锁，而数据库不拒绝它的写。A 错在把 TTL 调长只能降低概率，无法覆盖任意长的停顿，还会让真正宕机时锁长时间不释放。C 错在缩短心跳只会更频繁误判、引发选主抖动，且改变不了 A 进程仍活着这一事实。D 错在「先查再扣」同样是竞态，A 与 B 可能同时读到库存充足，且没有原子性保障。B 正确：用单调递增 token（或数据库 version / 唯一索引）让资源层拒绝过期持有者的写，即使锁机制完全失效也不会重复扣减——这是不依赖时钟与超时的最后一道防线。',
  },
]
