import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'microservices-06-rabbitmq-001',
    type: 'single',
    difficulty: 1,
    tags: ['AMQP', 'Exchange'],
    stem: '在 RabbitMQ 的 AMQP 模型里，关于消息的流转与存储，下列说法正确的是？',
    options: [
      { key: 'A', text: '消息先存进 Exchange，等 Exchange 推送成功后才写入 Queue' },
      { key: 'B', text: '消息最终只存放在 Queue 中，Exchange 只按 Binding 与 routing key 做路由，本身不保存消息' },
      { key: 'C', text: '一条消息被多个队列匹配时只投递一次，由第一个消费成功的队列负责删除' },
      { key: 'D', text: '消费者直接订阅 Exchange，Queue 只是给监控看的逻辑概念' },
    ],
    answers: ['B'],
    explanation:
      'Exchange 的职责是查路由表，不是存储：生产者把消息连同 routing key 发给 Exchange，Exchange 按类型与 Binding 把消息投递进匹配的队列，消息真正的存放地是 Queue。A 错在把 Exchange 当成了存储节点，实际上若没有任何队列按规则绑定，消息会被直接丢弃。C 错在被多个队列匹配时，RabbitMQ 会给每个队列各放一份拷贝，各队列独立消费、独立删除。D 错在消费者只能从 Queue 取消息；而且同一队列内是竞争消费，一条消息只会给其中一个消费者。B 正确。',
  },
  {
    id: 'microservices-06-rabbitmq-002',
    type: 'single',
    difficulty: 1,
    tags: ['Exchange', '路由匹配'],
    stem: '某队列用 binding key order.* 绑定到 topic 交换机。下列 routing key 中，哪一个会被路由到该队列？',
    options: [
      { key: 'A', text: 'order.paid.cn' },
      { key: 'B', text: 'order' },
      { key: 'C', text: 'order.created' },
      { key: 'D', text: 'payment.created' },
    ],
    answers: ['C'],
    explanation:
      'topic 交换机以点号分词，* 恰好匹配一个词，# 匹配零个或多个词。binding key 是 order.*，所以星号位必须正好有一个词：C 的 order.created 命中。A 有两个词（paid.cn），星号位放不下，要用 order.# 才收得到；B 星号位零个词，也不命中；D 第一个词是 payment，从头就不匹配。反过来记：若 binding key 换成 order.#，则 A、B、C 都会进队列——这正是 * 与 # 最常考的一字之差。C 正确。',
  },
  {
    id: 'microservices-06-rabbitmq-003',
    type: 'single',
    difficulty: 2,
    tags: ['持久化', '可靠性'],
    stem: '要求 Broker 重启后队列与其中的消息都还在，下列配置最完整的是？',
    options: [
      { key: 'A', text: '只把队列声明为 durable' },
      { key: 'B', text: '交换机 durable、队列 durable，且消息设置 deliveryMode=2（persistent）' },
      { key: 'C', text: '只要生产者开启 publisher confirm，重启后消息一定还在' },
      { key: 'D', text: '只要消费者使用手动 ack，Broker 就会自动把消息持久化到磁盘' },
    ],
    answers: ['B'],
    explanation:
      'Broker 重启不丢消息需要落盘三件套：交换机 durable（否则重启后绑定关系丢失）、队列 durable（否则队列本身消失）、消息 persistent（否则队列还在但里面的消息清空）。A 错在只声明了队列，消息仍是瞬时的，重启后队列空。C 错在 publisher confirm 只证明 Broker 收到了这条消息，属于传输层确认，跟是否写磁盘是两件事。D 错在手动 ack 解决的是「消费者处理失败不要丢」，完全不控制 Broker 的落盘行为。B 正确，且要补一句：持久化只保证单节点重启，整机磁盘损坏仍要靠副本队列。',
  },
  {
    id: 'microservices-06-rabbitmq-004',
    type: 'single',
    difficulty: 2,
    tags: ['Confirm', '可靠投递'],
    stem: '生产端要确认「消息确实被 Broker 收到」，同时不希望吞吐大幅下降，最合适的做法是？',
    options: [
      { key: 'A', text: '用 AMQP 事务 txSelect / txCommit，每条消息提交一次' },
      { key: 'B', text: '开启 publisher confirm，异步处理 ack / nack，对未确认的消息记录并重试' },
      { key: 'C', text: '发送后固定 sleep 100ms，认为 Broker 一定已经处理完' },
      { key: 'D', text: '只要 TCP 连接建立成功，就说明消息已被 Broker 接收' },
    ],
    answers: ['B'],
    explanation:
      'publisher confirm 是异步的：Broker 处理完消息后回调 ConfirmCallback，生产者只对未确认或 nack 的消息重发，吞吐代价远小于同步事务。A 错在 AMQP 事务是同步阻塞的，每条消息都要等一次 txCommit 往返，吞吐通常下降一个数量级，生产上基本不用。C 错在固定时延既不能证明送达，网络抖动时还会漏判。D 错在 TCP 连接成功只说明通道可用，消息可能不可路由、可能被 Broker 拒绝。B 正确，但要注意两处边界：不可路由的消息要用 mandatory + ReturnCallback 兜住；confirm 回调前生产者宕机会造成重发，所以仍需消费端幂等，核心链路更推荐用本地消息表保证「业务落库」与「待发消息」原子。',
  },
  {
    id: 'microservices-06-rabbitmq-005',
    type: 'multiple',
    difficulty: 2,
    tags: ['ACK', 'prefetch'],
    stem: '关于消费端的手动 ACK 与 prefetch，下列说法正确的有？',
    options: [
      { key: 'A', text: 'autoAck=true 时 Broker 一投递就认为成功，消费者处理到一半崩溃会丢消息' },
      { key: 'B', text: 'basic.qos 的 prefetchCount 限制的是该消费者「已投递但未 ack」的消息数，合理设置能避免慢消费者把消息全捞走' },
      { key: 'C', text: '处理失败应配合重试次数与死信队列；无脑 requeue=true 会让毒消息反复循环' },
      { key: 'D', text: 'prefetch 越大吞吐一定越高，直接设成 10000 最省事' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'A 是自动确认最经典的坑：确认发生在投递瞬间而不是业务成功后。B 说的是 prefetch 的准确口径，它限制单个消费者上未 ack 的上限，让 Broker 能把消息留给更快的消费者。C 是失败分级的正确姿势：可重试的进重试队列，多次失败进 DLX 并告警，人工可重放。D 错在 prefetch 过大会让一个消费者手里堆几千条 unacked，既造成实例间负载不均、内存上涨，又会在该实例重启时把这一大批消息全部重回队列形成重复洪峰；吞吐要靠单条耗时、并发数与下游容量一起压测得出，不是把 prefetch 拉满。',
  },
  {
    id: 'microservices-06-rabbitmq-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['死信队列', 'TTL'],
    stem: '下列哪些情况会让消息进入死信交换机（DLX）？',
    options: [
      { key: 'A', text: '消费者调用 basic.reject / basic.nack 且 requeue=false' },
      { key: 'B', text: '消息在队列中设置的 TTL 到期' },
      { key: 'C', text: '队列达到 x-max-length 上限，被挤出的队头消息' },
      { key: 'D', text: '消费者处理耗时过长、还没来得及返回 ack' },
    ],
    answers: ['A', 'B', 'C'],
    explanation:
      'DLX 的标准来源就是三类：被明确拒绝且不再入队、消息 TTL 过期、队列满被挤出（这三类都要队列配了 x-dead-letter-exchange 才会转投）。D 错在这种消息只是处于 unacked 状态，Broker 会一直等确认；只有消费者断开连接时才会重新入队，并不会变成死信。容易混淆的是「队列级 TTL 到期」：那是整个队列被删除，与消息进 DLX 不是一回事。另外 DLQ 必须配消费与告警，否则只是把垃圾换了个地方堆着。',
  },
  {
    id: 'microservices-06-rabbitmq-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['消息堆积', '线上排查'],
    scenario:
      '大促后订单事件队列堆积到 200 万条且 ready 持续上涨；监控显示 unacked 长期稳定在 200 左右（4 个消费者实例、prefetch=50），消费者 CPU 只有 20%，单条处理约 800ms，其中约 700ms 在同步等待优惠券接口。运维同学提议立刻把消费者扩到 40 个实例，并把 prefetch 调到 1000。',
    stem: '下列判断与处置最贴近根因的是？',
    options: [
      { key: 'A', text: 'CPU 才 20% 说明消费端很闲，把 prefetch 调到 1000 就能让吞吐翻倍' },
      { key: 'B', text: 'unacked 已顶到 prefetch 上限且 CPU 很低，说明线程都卡在等下游同步调用；应先优化单条耗时（异步化 / 批量化）并核对优惠券接口的容量，再谈扩容' },
      { key: 'C', text: '直接扩到 40 个实例，消费能力线性提升 10 倍，问题即可解决' },
      { key: 'D', text: 'ready 上涨说明 Broker 写盘慢，应把队列改成非持久化并清空重建' },
    ],
    answers: ['B'],
    explanation:
      'unacked≈4×50 已经顶到上限、CPU 却很低，是典型的「线程不干活、都在等 I/O」：单条 800ms 里有 700ms 耗在同步调用优惠券接口。此时瓶颈在下游与单条耗时，不在消费者数量。A 错在 prefetch 拉到 1000 只会让每个实例手里堆更多 unacked，既不提升单条处理速度，还会造成负载不均与重启后的重复洪峰。C 错在扩容 10 倍等于把下游调用量也放大 10 倍，很可能先把优惠券服务打挂，且单队列吞吐与连接数本身也有上限，不会线性增长。D 错在 ready 上涨与写盘慢无关，关持久化会引入丢消息，清空队列更是直接丢业务数据。B 正确：先做下游超时/异步化/批量化与缓存，压测出下游可承受并发，再决定扩多少消费者；实在追不上时用多队列拆分与外部转储回放兜底。',
  },
  {
    id: 'microservices-06-rabbitmq-008',
    type: 'scenario',
    difficulty: 3,
    tags: ['延迟队列', 'TTL'],
    scenario:
      '团队用「队列 x-message-ttl + DLX」实现延迟重试：缓冲队列没有消费者，过期消息经死信交换机转入真正的消费队列。上线后发现一个怪现象：先发了一条 30 分钟后才该重试的消息（用消息级 TTL 设置），紧接着发的、10 秒就该重试的消息也迟迟没有被消费；把长延迟消息撤掉后，短延迟消息马上正常。',
    stem: '最可能的根因是？',
    options: [
      { key: 'A', text: 'RabbitMQ 不支持按消息单独设置 TTL，长延迟那条根本没生效' },
      { key: 'B', text: 'RabbitMQ 只在消息到达队头时才检查是否过期，队头的长 TTL 消息会阻塞后面已到期的短 TTL 消息；应按延迟档位拆分队列或改用延迟消息插件' },
      { key: 'C', text: '消费者 prefetch 设置得太小，导致后面的消息取不到' },
      { key: 'D', text: 'DLX 的 routing key 写错了，所以消息一直积压在缓冲队列' },
    ],
    answers: ['B'],
    explanation:
      '这是 TTL 队列最经典的坑：过期判定只针对队头消息，RabbitMQ 不会扫描队列中间已过期的消息，因此一条 30 分钟的队头消息会把后面 10 秒就该过期的消息一起堵住，现象与题目描述完全吻合。修法是按延迟档位拆成多个队列（10s / 1min / 10min 各自一个 TTL 队列）、使用 rabbitmq_delayed_message_exchange 插件在交换机层按 x-delay 定时，或用 Redis ZSet / 定时扫表做外部调度。A 错在消息级 TTL（per-message TTL）是支持的，否则长消息不会堵住队头。C 错在问题出在缓冲队列的过期判定，跟消费端 prefetch 无关。D 错在若 routing key 写错，所有消息都到不了消费队列，不会出现「撤掉长消息后短消息立刻正常」这种与队头相关的现象。B 正确。',
  },
  {
    id: 'microservices-06-rabbitmq-009',
    type: 'code',
    difficulty: 2,
    tags: ['Spring AMQP', 'ACK'],
    stem: `某消费者使用下面这个监听器容器工厂，监听方法里先查库再写库，耗时较长：

~~~java
@Bean
public SimpleRabbitListenerContainerFactory factory(ConnectionFactory cf) {
  SimpleRabbitListenerContainerFactory f = new SimpleRabbitListenerContainerFactory();
  f.setConnectionFactory(cf);
  f.setAcknowledgeMode(AcknowledgeMode.NONE);
  f.setPrefetchCount(50);
  return f;
}
~~~

下列判断正确的是？`,
    options: [
      { key: 'A', text: 'NONE 模式下 Broker 一投递就认为已确认，消费者处理到一半宕机会丢消息；应改为 MANUAL 并在业务成功后 basicAck' },
      { key: 'B', text: 'NONE 只是不发送 ack 帧，Broker 会一直保留消息，等消费者重启后重新投递' },
      { key: 'C', text: '在 NONE 模式下 prefetchCount 会被自动强制为 1，所以不会有问题' },
      { key: 'D', text: '只要队列声明为 durable，NONE 模式也不会丢消息' },
    ],
    answers: ['A'],
    explanation:
      'Spring AMQP 的 AcknowledgeMode.NONE 等价于原生客户端的 autoAck=true：Broker 把消息发出去就算完成，不再等待确认。消费者在「查库之后、写库之前」崩溃，这条消息已经从队列删除，业务却没做完，属于典型丢消息。A 正确，改成 MANUAL（或 AUTO 且让异常抛出触发重试）并在业务事务提交后 basicAck 才是可靠做法。B 错在把 NONE 理解成「不确认所以保留」，实际语义恰恰相反。C 错在 prefetch 与确认模式是两回事，NONE 下 prefetch 仍生效，只是此刻未 ack 计数已失去意义。D 错在 durable 只保证 Broker 重启后队列和消息还在，管不了「消息已被投递但业务没做完」这一段。',
  },
  {
    id: 'microservices-06-rabbitmq-010',
    type: 'single',
    difficulty: 3,
    tags: ['仲裁队列', '选型'],
    stem: '关于 RabbitMQ 的高可用队列与它和 Kafka 的选型，下列说法正确的是？',
    options: [
      { key: 'A', text: '镜像队列是当前推荐的高可用方案，仲裁队列只是实验特性' },
      { key: 'B', text: '仲裁队列（Quorum Queue）基于 Raft 复制，通常部署 3 或 5 个副本，优先保证数据安全与故障自动恢复；经典镜像队列已在新版本中移除' },
      { key: 'C', text: 'RabbitMQ 和 Kafka 一样支持按消费位点回溯历史消息，因此更适合日志流回放' },
      { key: 'D', text: '只要队列声明为 durable，单节点宕机后消息就一定能继续被消费，不需要副本' },
    ],
    answers: ['B'],
    explanation:
      '经典镜像队列已被废弃并在 RabbitMQ 4.x 移除，官方主推基于 Raft 的 Quorum Queue，奇数副本、写入需多数派确认，节点故障时自动选主。B 正确，代价是要接受它不支持消息级 TTL 策略、优先级队列等经典特性，单队列吞吐也受顺序复制约束。A 把新旧关系说反了。C 错在 RabbitMQ 是「消费确认后删除」，没有分区位点与历史回放，日志采集、流处理、按位点重放这类场景应选 Kafka；RabbitMQ 的优势是复杂路由、逐条确认与业务事件。D 错在 durable 只解决单节点重启后的数据保留，整机宕机或磁盘损坏时队列根本不可用，必须靠副本。',
  },
]
