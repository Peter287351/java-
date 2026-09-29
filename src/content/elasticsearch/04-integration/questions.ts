import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'elasticsearch-04-integration-001',
    type: 'single',
    difficulty: 1,
    tags: ['集群健康'],
    stem: 'GET _cluster/health 返回 status 为 yellow，准确的含义是？',
    options: [
      { key: 'A', text: '所有主分片正常，但存在未分配的副本分片（如单节点集群配了副本）' },
      { key: 'B', text: '存在未分配的主分片，部分索引数据不可读写' },
      { key: 'C', text: '集群完全健康，无需关注' },
      { key: 'D', text: '集群磁盘水位超限，即将转为只读' },
    ],
    answers: ['A'],
    explanation:
      '三色语义：green 表示主分片与副本全部就绪；yellow 表示主分片都在、只是副本分片没能分配——最典型的是单节点集群配了 number_of_replicas > 0，副本无处可放，读写不受影响，A 正确；red 才是有主分片丢失、相关索引数据不可用。B 描述的是 red。C 错误：yellow 通常无碍但必须能解释成因。D 是磁盘洪水（flood stage）问题，与健康三色无直接对应关系。',
  },
  {
    id: 'elasticsearch-04-integration-002',
    type: 'single',
    difficulty: 1,
    tags: ['RestClient'],
    stem: '关于 Java 程序访问 Elasticsearch 的方式，下列说法正确的是？',
    options: [
      { key: 'A', text: 'REST 客户端通过 HTTP（默认 9200 端口）收发 JSON 与 ES 交互，客户端与服务端版本解耦' },
      { key: 'B', text: '必须走传输层 9300 端口，且客户端与服务端大版本必须完全一致' },
      { key: 'C', text: 'RestClient 发送的是 SQL 语句，由 ES 解析执行' },
      { key: 'D', text: 'RestClient 需要在服务端安装特定插件才能工作' },
    ],
    answers: ['A'],
    explanation:
      '现代接入方式统一是 REST API：low-level RestClient、RestHighLevelClient 或官方新版 elasticsearch-java，都基于 HTTP 9200 + JSON，客户端升级不受服务端版本强绑定，A 正确。B 描述的是已废弃的 TransportClient（9300 私有二进制协议），版本强耦合正是它被淘汰的原因。C、D 均不成立：REST 客户端发送的是查询 DSL 的 JSON，ES 开箱即可配合使用，无需额外插件。',
  },
  {
    id: 'elasticsearch-04-integration-003',
    type: 'single',
    difficulty: 2,
    tags: ['别名', 'reindex'],
    stem: '线上索引 mapping 需要大改（多个字段类型变更），要做到对业务基本无感，推荐的流程是？',
    options: [
      { key: 'A', text: '直接 DELETE 旧索引重建，利用低峰期停写灌数据' },
      { key: 'B', text: '新建带正确 mapping 的索引 → _reindex 迁移历史数据 → 校验数据量与抽样 → 通过 _aliases 原子切换别名 → 观察后删除旧索引' },
      { key: 'C', text: '用 PUT mapping 直接把旧字段改成新类型' },
      { key: 'D', text: '写脚本逐条 UPDATE 文档，让 ES 自动把字段改成新类型' },
    ],
    answers: ['B'],
    explanation:
      'ES 中已定义字段的类型不可原地修改，C 直接行不通；D 同样无效：UPDATE 不会改变 mapping，类型不符时文档反而会被拒写。A 会造成停写窗口，客户端还要改配置。B 是标准姿势：业务始终通过别名访问，别名切换是原子操作瞬间完成；历史数据靠 reindex 迁移，切换瞬间的写流量可用双写或增量补齐兜底，全程业务无感。',
  },
  {
    id: 'elasticsearch-04-integration-004',
    type: 'single',
    difficulty: 3,
    tags: ['写入调优'],
    stem: '需要把几十亿条历史日志一次性灌入 ES（期间不要求可搜），下列写入侧调优思路正确的是？',
    options: [
      {
        key: 'A',
        text: '导入期间把 refresh_interval 设为 -1、副本临时调 0，加大 bulk 批量与并发；导完恢复 refresh 与副本，并做 force merge 减少段数',
      },
      { key: 'B', text: '把 refresh_interval 设为 0，让文档立即生成 segment' },
      { key: 'C', text: '每写完一批就手动 refresh 一次，保证数据尽快可搜' },
      { key: 'D', text: '把 translog 关闭，省掉刷盘开销' },
    ],
    answers: ['A'],
    explanation:
      '一次性导入追求吞吐而非实时可搜：refresh 关闭（-1）避免频繁生成小段，副本临时调 0 省去同步开销，bulk 大批量 + 多线程摊薄网络与段创建成本，导完恢复配置并 force merge 合并段，A 正确。B 错误：refresh_interval 不接受 0，关闭要用 -1。C 错误：频繁 refresh 会不断产生小段，段合并的代价反过来拖慢写入，与优化目标背道而驰。D 错误：translog 是宕机恢复的底线，不能关闭，最多把 durability 调成 async 换吞吐并接受小概率丢数据的风险。',
  },
  {
    id: 'elasticsearch-04-integration-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['数据同步', 'canal', 'MQ'],
    stem: 'MySQL 同步到 ES 的常见方案中，下列说法正确的有？（多选）',
    options: [
      { key: 'A', text: '同步双写实现最简单，但侵入业务代码，任何一处漏写 ES 就不一致，写 ES 失败还会牵连主流程' },
      { key: 'B', text: 'canal 伪装成 MySQL 从库订阅 binlog，对业务零侵入，适合既有系统改造' },
      { key: 'C', text: 'MQ 异步方案能削峰、与主流程解耦，但必须处理消费幂等与消息丢失' },
      { key: 'D', text: 'Logstash 的 JDBC input 基于 SQL 轮询拉取，能完整捕获所有行的物理删除' },
      { key: 'E', text: 'DataX 适合一次性或周期性的全量/批量迁移，不适合实时增量同步' },
    ],
    answers: ['A', 'B', 'C', 'E'],
    explanation:
      'A、B、C、E 是各方案的典型取舍：双写快而脆，漏写即不一致；canal 零侵入，但要维护 binlog 链路与位点；MQ 解耦削峰，一致性靠消费端幂等与补偿保障；DataX 的定位就是离线批量，实时增量不是它的活。D 错误：JDBC input 只能按 SQL 轮询结果集（通常靠 update_time/自增列做增量），被物理删除的行从此从结果集消失，根本「看不到」删除，需要软删除标记或额外对账来补齐。',
  },
  {
    id: 'elasticsearch-04-integration-006',
    type: 'scenario',
    difficulty: 3,
    tags: ['数据同步', '排查'],
    scenario:
      '商品搜索采用「MySQL 变更 → MQ → 同步服务 upsert 到 ES」。客服反馈：少量商品在搜索页显示旧价格，但 MySQL 里已是新价；出现时间集中在每天凌晨的促销批量更新之后。同步服务日志显示这些消息都消费成功，MQ 也没有堆积。',
    stem: '最合理的排查与修复思路是？',
    options: [
      { key: 'A', text: '直接删掉 ES 索引，每天凌晨全量重灌一次，一劳永逸' },
      {
        key: 'B',
        text: '先取几例不一致样本比对：凌晨批量更新造成同一商品的多条变更消息并发消费/重试后乱序到达，旧值后写覆盖新值；消费端改为按 update_time（或版本号）条件更新——旧数据不覆盖新数据，并补一个凌晨后的定时对账任务兜底',
      },
      { key: 'C', text: '断定 MQ 丢消息，把 MQ 整体换成 Kafka 三副本' },
      { key: 'D', text: '搜索页每次读 ES 后回查 MySQL 实时兜底，不再信任 ES' },
    ],
    answers: ['B'],
    explanation:
      '三个线索——库新 ES 旧、集中在批量更新时段、消息消费成功——指向乱序与并发覆盖：同一商品先后两条价格变更被并发消费（或重试交错），ES 的 upsert 是「后写胜」，旧价格消息后到就覆盖了新值。B 的修复直击原因：写入带时间戳/版本条件，旧不覆新，再用对账兜底极端情况。A 全量重灌成本高且不改因，第二天照样复发。C 在「消息已消费成功」的证据面前是无效替换。D 把一致性债务转移给 MySQL，放大主库压力，属于掩盖问题而非解决问题。',
  },
  {
    id: 'elasticsearch-04-integration-007',
    type: 'code',
    difficulty: 2,
    tags: ['RestClient'],
    stem: `使用 low-level RestClient 访问一个【不存在】的索引 orders_v1：

~~~java
RestClient client = RestClient.builder(
        new HttpHost("localhost", 9200, "http")).build();

Request request = new Request("GET", "/orders_v1/_settings");
try {
    Response response = client.performRequest(request);
    System.out.println(response.getStatusLine().getStatusCode());
} catch (ResponseException e) {
    System.out.println(e.getResponse().getStatusLine().getStatusCode());
}
~~~

输出是？`,
    options: [
      { key: 'A', text: '200' },
      { key: 'B', text: '404' },
      { key: 'C', text: '500' },
      { key: 'D', text: '抛出 NullPointerException，程序崩溃' },
    ],
    answers: ['B'],
    explanation:
      '索引不存在时 ES 返回 404；low-level RestClient 对非 2xx 状态码会抛出 ResponseException，但异常对象里携带完整的原始响应，e.getResponse().getStatusLine().getStatusCode() 取到的正是 404，因此打印 404，B 正确。A 错误：资源不存在不可能返回 200。C 错误：查不到资源是客户端错误 404，不是服务端 500。D 错误：代码已捕获 ResponseException，且该异常与 NPE 无关。「非 2xx 抛异常但原始响应仍在」是使用 low-level 客户端必须掌握的行为。',
  },
]
