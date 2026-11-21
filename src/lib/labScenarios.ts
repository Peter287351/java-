/**
 * 知识卡内嵌的「命令演练」场景数据。
 * 纯前端规则匹配：输入命令 → 正则匹配 → 返回预置的真实格式输出 + 点评。
 * 绝不 eval、不调用任何真实命令 / 接口，只做字符串比对，保证生产安全。
 */

export interface LabStep {
  /** 这一小步要教会什么（提示语，先给线索再给示例命令） */
  hint: string
  /** 照着敲的示例命令，用于"填入示例"，也作为兜底匹配依据 */
  sample: string
  /** 可接受的命令正则（匹配时忽略首尾空格与连续空格） */
  accept: RegExp[]
  /** 模拟的真实输出（等宽字体原样展示） */
  output: string
  /** 敲完这一步后的简短点评：把输出里的现象和知识点对上 */
  explain: string
}

export interface LabScenario {
  id: string
  title: string
  /** 终端标题栏显示的主机 / 环境，增强代入感 */
  host: string
  /** 任务说明：这一轮演练要达成什么 */
  mission: string
  steps: LabStep[]
  /** 全部完成后的小结 */
  wrapUp: string
}

/** 规范化输入：去首尾空格、连续空格压成一个，便于正则匹配 */
export function normalizeCommand(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

/** 按"忽略大小写"生成匹配用的正则（命令大小写不敏感，输出仍按原样展示） */
function ci(source: string): RegExp {
  return new RegExp(source, 'i')
}

export const labScenarios: Record<string, LabScenario> = {
  /* ------------------------------------------------------------------ */
  'docker-run': {
    id: 'docker-run',
    title: '把一个 Spring Boot 容器真正跑起来',
    host: 'ops@prod-server:~$',
    mission:
      '目标：用镜像 myapp:1.0 起一个容器，prod 配置、宿主 8080 端口、日志挂到 /opt/logs、命名 app，然后确认它真的在提供服务。按顺序敲下面每一步。',
    steps: [
      {
        hint: '先把镜像拉到本地。想想：不带标签时默认拉哪个标签？',
        sample: 'docker pull myapp:1.0',
        accept: [ci('^docker pull(\\s+\\S+)?\\s+myapp:1\\.0$')],
        output: [
          '1.0: Pulling from library/myapp',
          'a3ed95caeb02: Pull complete',
          '5f70bf18a086: Pull complete',
          'Digest: sha256:9c1f2e...7bd4',
          'Status: Downloaded newer image for myapp:1.0',
          'docker.io/library/myapp:1.0',
        ].join('\n'),
        explain:
          '镜像是分层下载的：两行 Pull complete 表示复用了两层已有镜像层。Digest 是内容摘要，同一个 tag 内容变了摘要就变——生产环境最好用摘要而非 latest 固定版本。',
      },
      {
        hint: '用一条 docker run 把四件事一起做：后台、端口映射、环境变量、挂卷，并命名。',
        sample:
          'docker run -d -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod -v /opt/logs:/app/logs --name app myapp:1.0',
        accept: [
          ci('^docker run .*myapp:1\\.0$'),
          ci('^docker run .*-d.*-p.*8080:8080.*myapp:1\\.0$'),
        ],
        output: 'f47ac10b58cc4372a1a0b9e5d3f6c8a1b7e9d0f2a4c6e8b1d3f5a7c9e0b2d4f6',
        explain:
          '返回的一长串是容器 ID。拆开那条命令：-d 后台运行；-p 8080:8080 左边宿主、右边容器（写反外面就连不上）；-e 注入 prod 配置；-v 把宿主 /opt/logs 挂到容器 /app/logs，容器删了日志还在；--name 方便后面按名字操作。配置没打进镜像，换环境只换环境变量。',
      },
      {
        hint: '容器起来了，用一条命令确认它在跑、端口映射也对。',
        sample: 'docker ps',
        accept: [ci('^docker ps$'), ci('^docker ps -a$')],
        output: [
          'CONTAINER ID   IMAGE        COMMAND                  CREATED         STATUS         PORTS                    NAMES',
          'f47ac10b58cc   myapp:1.0    "java -jar /app/app.j…"  12 seconds ago  Up 11 seconds  0.0.0.0:8080->8080/tcp   app',
        ].join('\n'),
        explain:
          'STATUS 是 Up 说明进程活着；PORTS 那列 0.0.0.0:8080->8080/tcp 就是 -p 的效果——左边是宿主机，浏览器访问的是左边。注意：进程活着不等于业务可用，还要看日志。',
      },
      {
        hint: '看应用日志，确认 Spring Boot 真的起来了、跑在 prod、端口监听成功。',
        sample: 'docker logs app',
        accept: [ci('^docker logs(\\s+-f)?\\s+app$')],
        output: [
          '2026-11-19 10:23:11.442  INFO 1 --- [app] c.e.App : Starting App using Java 21',
          '2026-11-19 10:23:11.448  INFO 1 --- [app] c.e.App : The following 1 profile is active: "prod"',
          '2026-11-19 10:23:13.901  INFO 1 --- [app] o.s.b.w.e.t.TomcatWebServer : Tomcat started on port 8080',
          '2026-11-19 10:23:14.002  INFO 1 --- [app] c.e.App : Started App in 2.56 seconds',
        ].join('\n'),
        explain:
          '三行关键信息：profile 是 prod（说明 -e 生效）；Tomcat 监听 8080（说明容器内的端口对）；Started 表示 Spring 上下文初始化完成。到这里才算"服务真的起来了"，光看 docker ps 的 Up 不够。',
      },
      {
        hint: '排障常用：不进容器就想确认挂载和环境变量。用 inspect 取状态即可。',
        sample: 'docker inspect app --format {{.State.Status}}',
        accept: [
          ci('^docker inspect .*app.*$'),
          ci('^docker inspect app$'),
        ],
        output: 'running',
        explain:
          'inspect 能看到容器的全部元数据：State.Status、Mounts（挂卷）、Config.Env（环境变量）。用 --format 只取需要的字段，适合脚本里判断。再次印证：明文密码放进 -e 会留在 inspect 里，敏感值应走密钥管理。',
      },
    ],
    wrapUp:
      '你已经走完一遍"拉镜像 → 起容器 → 看状态 → 看日志 → 查元数据"的完整链路。记住这条主线：Up 只说明进程活着，日志里的 Started 才说明业务可用。',
  },

  /* ------------------------------------------------------------------ */
  'git-rescue': {
    id: 'git-rescue',
    title: '误操作之后，把提交找回来',
    host: 'dev@laptop:~/project (main)$',
    mission:
      '事故现场：你刚用 git reset --hard HEAD~1 删掉了最后一次提交，现在需要把它找回来。按顺序敲命令，观察每一步的 HEAD 变化。',
    steps: [
      {
        hint: '先确认现状：当前历史里还有没有那条被删的提交？',
        sample: 'git log --oneline',
        accept: [ci('^git log( --oneline)?$')],
        output: [
          'b1a2c3d (HEAD -> main) 重构订单服务',
          '9f8e7d6 修复库存扣减并发问题',
          '3c2d1e0 初始化项目',
        ].join('\n'),
        explain:
          'HEAD 指向 b1a2c3d，"加日志脱敏"那条提交已经不在 log 里了。但"不在 log 里"不等于"被删除"——Git 只是把分支指针往前移了，提交对象还在。',
      },
      {
        hint: '用那本"本地操作日记"找到 HEAD 刚才在哪。',
        sample: 'git reflog',
        accept: [ci('^git reflog$'), ci('^git reflog --date=.*$')],
        output: [
          'b1a2c3d (HEAD -> main) HEAD@{0}: reset: moving to HEAD~1',
          'e4d5f6a HEAD@{1}: commit: 加日志脱敏',
          'b1a2c3d HEAD@{2}: commit: 重构订单服务',
          '9f8e7d6 HEAD@{3}: commit: 修复库存扣减并发问题',
        ].join('\n'),
        explain:
          'HEAD@{1} 就是 reset 之前的提交 e4d5f6a。reflog 记录本地 HEAD / 分支引用的每一次移动，所以能找到"已经不在历史里"的提交。它只在本地、且有过期时间，别当长期备份。',
      },
      {
        hint: '有了哈希，把分支指回去。注意这次用的是哈希而不是 HEAD~1。',
        sample: 'git reset --hard e4d5f6a',
        accept: [ci('^git reset --hard e4d5f6a$'), ci('^git reset --hard HEAD@\\{1\\}$')],
        output: 'HEAD is now at e4d5f6a 加日志脱敏',
        explain:
          'reset --hard 把分支指针和工作区一起移到目标提交。因为目标对象还在（没被 GC），所以能恢复。如果之前有未提交改动，这一步会直接丢掉——所以 reset --hard 前要先 status 或 stash。',
      },
      {
        hint: '最后确认：那条提交真的回来了吗？',
        sample: 'git log --oneline -3',
        accept: [ci('^git log( --oneline)?( -3)?$')],
        output: [
          'e4d5f6a (HEAD -> main) 加日志脱敏',
          'b1a2c3d 重构订单服务',
          '9f8e7d6 修复库存扣减并发问题',
        ].join('\n'),
        explain:
          '提交回到最顶端，工作区也恢复了。这正是 reflog 的用途：救回本地误操作。注意如果这个提交已经 push 到共享分支，就不要用 reset 改写公共历史，而要用 git revert 新建一个反向提交。',
      },
    ],
    wrapUp:
      '你刚刚完成了一次完整的"误删提交救援"。核心结论：reset 只是移动指针、不是销毁对象，reflog 记下了指针的移动轨迹，所以能按哈希找回去；公共分支上则改用 revert。',
  },

  /* ------------------------------------------------------------------ */
  'mysql-explain': {
    id: 'mysql-explain',
    title: '用 EXPLAIN 看见索引有没有生效',
    host: 'mysql> ',
    mission:
      'orders 表有 500 万行，按 user_id 查询很慢。用 EXPLAIN 看执行计划，建索引前后对比，再理解覆盖索引。',
    steps: [
      {
        hint: '先看没有索引时的执行计划：SELECT * 按 user_id 查。',
        sample: 'EXPLAIN SELECT * FROM orders WHERE user_id = 12345;',
        accept: [ci('^EXPLAIN SELECT \\* FROM orders WHERE user_id = 12345;?$')],
        output: [
          '+----+-------------+--------+------------+------+---------------+------+---------+------+---------+----------+-------------+',
          '| id | select_type | table  | partitions | type | possible_keys | key  | key_len | ref  | rows    | filtered | Extra       |',
          '+----+-------------+--------+------------+------+---------------+------+---------+------+---------+----------+-------------+',
          '|  1 | SIMPLE      | orders | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 4983120 |    10.00 | Using where |',
          '+----+-------------+--------+------------+------+---------------+------+---------+------+---------+----------+-------------+',
          '1 row in set, 1 warning (0.03 sec)',
        ].join('\n'),
        explain:
          'type=ALL 是全表扫描，rows≈498 万表示要扫近 500 万行，key=NULL 说明没用任何索引。possible_keys=NULL 是因为 user_id 上压根没索引。这就是慢的原因。',
      },
      {
        hint: '给 user_id 建一个普通二级索引。',
        sample: 'CREATE INDEX idx_orders_user ON orders(user_id);',
        accept: [ci('^CREATE INDEX .*user.*ON orders\\(user_id\\);?$')],
        output: 'Query OK, 0 rows affected (4.21 sec)\nRecords: 5000000  Duplicates: 0  Warnings: 0',
        explain:
          '建索引要扫描全表并排序，所以 500 万行花了 4 秒——这是一次性成本。二级索引的叶子节点存的是 "user_id + 主键值"，不是整行。',
      },
      {
        hint: '同样的查询再 EXPLAIN 一次，对比 type / key / rows。',
        sample: 'EXPLAIN SELECT * FROM orders WHERE user_id = 12345;',
        accept: [ci('^EXPLAIN SELECT \\* FROM orders WHERE user_id = 12345;?$')],
        output: [
          '+----+-------------+--------+------------+------+----------------+----------------+---------+-------+------+----------+-------+',
          '| id | select_type | table  | partitions | type | possible_keys  | key            | key_len | ref   | rows | filtered | Extra |',
          '+----+-------------+--------+------------+------+----------------+----------------+---------+-------+------+----------+-------+',
          '|  1 | SIMPLE      | orders | NULL       | ref  | idx_orders_user | idx_orders_user | 4       | const |   12 |   100.00 | NULL  |',
          '+----+-------------+--------+------------+------+----------------+----------------+---------+-------+------+----------+-------+',
          '1 row in set, 1 warning (0.01 sec)',
        ].join('\n'),
        explain:
          'type 从 ALL 变成 ref（索引等值匹配），key 命中 idx_orders_user，rows 从 498 万降到 12。注意 SELECT * 的 Extra 是 NULL：查到主键后还要回聚簇索引取整行，这就是"回表"。',
      },
      {
        hint: '只查 user_id 一列，再看 Extra——这就是覆盖索引。',
        sample: 'EXPLAIN SELECT user_id FROM orders WHERE user_id = 12345;',
        accept: [ci('^EXPLAIN SELECT user_id FROM orders WHERE user_id = 12345;?$')],
        output: [
          '+----+-------------+--------+------------+------+----------------+----------------+---------+-------+------+----------+-------------+',
          '| id | select_type | table  | partitions | type | possible_keys  | key            | key_len | ref   | rows | filtered | Extra       |',
          '+----+-------------+--------+------------+------+----------------+----------------+---------+-------+------+----------+-------------+',
          '|  1 | SIMPLE      | orders | NULL       | ref  | idx_orders_user | idx_orders_user | 4       | const |   12 |   100.00 | Using index |',
          '+----+-------------+--------+------------+------+----------------+----------------+---------+-------+------+----------+-------------+',
          '1 row in set, 1 warning (0.00 sec)',
        ].join('\n'),
        explain:
          'Extra 出现 Using index —— 要查的列都在索引里，不用回表，这就是覆盖索引。所以线上能只查需要的列就别写 SELECT *。',
      },
    ],
    wrapUp:
      '你会看 EXPLAIN 的三个关键列了：type 看访问方式（ALL 最差、ref 较好）、key 看命中哪个索引、rows 看预估扫描行数；Extra 里的 Using index 表示覆盖索引不用回表。',
  },

  /* ------------------------------------------------------------------ */
  'redis-cmd': {
    id: 'redis-cmd',
    title: 'redis-cli 里玩转五种数据结构',
    host: '127.0.0.1:6379>',
    mission:
      '你已经连上了 redis-cli。按顺序敲命令，观察每种数据类型的返回格式（Redis 的返回值本身就透露了命令语义）。',
    steps: [
      {
        hint: '最基础的键值：设一个带过期时间的验证码，并查看剩余秒数。',
        sample: 'SET code:13800138000 9527 EX 60',
        accept: [ci('^SET code:13800138000 9527 EX 60$')],
        output: 'OK',
        explain:
          'SET 带 EX 60 表示 60 秒后自动过期。返回 OK 是 Redis 状态回复。验证码、短信码这类"一次性 + 自动失效"的数据最适合这种写法。',
      },
      {
        hint: '查一下这个键还能活多久。',
        sample: 'TTL code:13800138000',
        accept: [ci('^TTL code:13800138000$')],
        output: '(integer) 54',
        explain:
          'TTL 返回剩余秒数（这里是 54，说明已经过了 6 秒）。返回 -1 表示永不过期，-2 表示键不存在。这是排查"缓存为什么没了"的第一条命令。',
      },
      {
        hint: '用 List 做一个简单的消息队列：从左侧推入两条任务，再从右侧取出。',
        sample: 'LPUSH queue:job "job-1" "job-2"',
        accept: [ci('^LPUSH queue:job.*job-1.*job-2.*$'), ci('^RPUSH queue:job.*$')],
        output: '(integer) 2',
        explain:
          'LPUSH 返回推入后列表的长度 2。注意 List 是有序序列，LPUSH + RPOP 组成 FIFO 队列；但真实业务里更推荐 Stream，因为 List 没有确认机制，消费失败会丢消息。',
      },
      {
        hint: '从右侧弹出一个任务。',
        sample: 'RPOP queue:job',
        accept: [ci('^RPOP queue:job$')],
        output: '"job-1"',
        explain:
          '先入的 job-1 先被弹出，验证了 FIFO。RPOP 返回的是批量字符串回复，所以带引号。队列空时返回 nil。',
      },
      {
        hint: '用 Hash 存用户信息，并取出全部字段。',
        sample: 'HSET user:1 name Tom age 28',
        accept: [ci('^HSET user:1 name Tom age 28$')],
        output: '(integer) 2',
        explain:
          'Hash 适合存对象：user:1 是一个 key，name / age 是 field。相比把整个对象 JSON 序列化成一个 String，Hash 能单独取改某个字段，省带宽也少序列化。',
      },
      {
        hint: '最后看一眼这个用户对象。',
        sample: 'HGETALL user:1',
        accept: [ci('^HGETALL user:1$')],
        output: ['1) "name"', '2) "Tom"', '3) "age"', '4) "28"'].join('\n'),
        explain:
          'HGETALL 返回"字段名、值"交替的列表。字段多时别无脑 HGETALL，字段数很大用 HSCAN 分批；只取需要的字段用 HMGET。',
      },
    ],
    wrapUp:
      '你已经用四种典型返回格式（状态 OK、整数、批量字符串、数组）走完了 String + 过期、List 队列、Hash 对象。记住：Redis 的返回值类型本身就是命令语义的一部分。',
  },
}

/** 未知命令时的友好反馈：不假装成功，给可操作的下一步 */
export function unknownFeedback(command: string, scenario: LabScenario): string {
  const first = command.split(/\s+/)[0] || ''
  const known = scenario.steps[0]?.sample ?? ''
  if (!first) return '（什么也没敲。试着输入上面提示里的命令。）'
  return [
    `bash: ${first}: 这条命令不在当前演练里`,
    `提示：这一步要做的是「${scenario.steps.find((s) => !s.hint.includes('✅'))?.hint ?? scenario.mission}」`,
    `参考命令：${known}`,
  ].join('\n')
}
