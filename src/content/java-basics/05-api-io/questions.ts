import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'java-basics-05-api-io-001',
    type: 'single',
    difficulty: 1,
    tags: ['String拼接', 'StringBuilder'],
    stem: '关于字符串拼接的选型，下列说法正确的是？',
    options: [
      { key: 'A', text: 'StringBuffer 出现得更早，因此性能优于 StringBuilder' },
      { key: 'B', text: '循环中用 "a" + b 拼接，编译器会自动把整个循环优化成一次 StringBuilder 复用' },
      { key: 'C', text: '循环内拼接应使用 StringBuilder（单线程）；StringBuffer 的方法带 synchronized、线程安全但有锁开销，仅在多线程共享同一个 builder 时才需要' },
      { key: 'D', text: 'String 是可变类，只是修改成本比较高' },
    ],
    answers: ['C'],
    explanation:
      'C 正确：单线程场景默认 StringBuilder；StringBuffer 与它 API 兼容但每个方法 synchronized，在多线程共享同一个可变 builder 时才有意义。A 错误：synchronized 带来的是额外开销而非性能优势。B 错误：编译器优化只发生在「单次表达式」内部，循环体里每轮仍会新建 builder（JDK 9+ 改用 invokedynamic 实现同样无法跨轮复用），循环拼接必须把 StringBuilder 提到循环外。D 错误：String 内部的 value 数组是 final 的，String 完全不可变。',
  },
  {
    id: 'java-basics-05-api-io-002',
    type: 'single',
    difficulty: 2,
    tags: ['字节流', '字符流', '编码'],
    stem: '关于字节流与字符流，下列说法正确的是？',
    options: [
      { key: 'A', text: 'FileReader 读任何编码的文本文件都正确，与系统默认字符集无关' },
      { key: 'B', text: 'Reader/Writer 面向字符，读写时按字符集解码/编码；图片、zip 等二进制文件必须用字节流 InputStream/OutputStream 处理' },
      { key: 'C', text: '字节流无法读取文本文件，只能处理二进制' },
      { key: 'D', text: 'Writer 的 write(int b) 写出的是一个字节' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：这是二者的分工边界——字符流按 Charset 帮你完成字节与字符的转换，二进制内容没有字符语义，必须走字节流。A 错误：FileReader 默认使用平台字符集（JDK 18 之前中文 Windows 常是 GBK），读 UTF-8 文件会乱码；应改用 InputStreamReader 显式传 Charset（JDK 11+ 的 FileReader 也支持直接传）。C 错误：字节流能读任何文件，只是文本解码要自己做。D 错误：Writer.write(int) 写的是字符（char 的码值），不是字节。',
  },
  {
    id: 'java-basics-05-api-io-003',
    type: 'single',
    difficulty: 1,
    tags: ['缓冲流', 'flush'],
    stem: '关于缓冲流（BufferedInputStream / BufferedWriter 等），下列说法正确的是？',
    options: [
      { key: 'A', text: '缓冲流把文件一次性全部读入内存，所以速度快' },
      { key: 'B', text: '缓冲流通过内存缓冲合并小读写、减少底层系统调用次数来提速；缓冲未满时数据可能还在内存里，需要 flush 或 close 才能确保写出' },
      { key: 'C', text: '缓冲流如果不在每次写之后手动 flush，就一定会丢数据' },
      { key: 'D', text: '缓冲流只能包装网络流，不能包装文件流' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：默认约 8KB 的缓冲区把多次小 IO 合并成少数大 IO；写出路径上「缓冲未刷 = 数据未落盘」，flush 强制刷出，close 会先 flush 再释放资源。A 错误：缓冲区大小固定，并非整文件读入（那是 Files.readAllBytes 的行为）。C 错误：正常结束调用 close 就会刷出，「一定丢数据」言过其实；但异常路径不 flush 确实可能丢尾部数据。D 错误：缓冲流可以包装任意流。',
  },
  {
    id: 'java-basics-05-api-io-004',
    type: 'code',
    difficulty: 3,
    tags: ['LocalDate', '不可变'],
    stem: `下面代码的输出是什么？

~~~java
import java.time.LocalDate;

public class Main {
    public static void main(String[] args) {
        LocalDate deadline = LocalDate.of(2026, 1, 31);
        deadline.plusDays(1);
        deadline = deadline.plusMonths(1);
        System.out.println(deadline);
    }
}
~~~`,
    options: [
      { key: 'A', text: '2026-03-01' },
      { key: 'B', text: '2026-02-28' },
      { key: 'C', text: '2026-03-03' },
      { key: 'D', text: '抛出 DateTimeException：2026-02-31 不是有效日期' },
    ],
    answers: ['B'],
    explanation:
      'LocalDate 不可变：plusDays(1) 返回的新对象被丢弃，第一行是无效调用；第二行 deadline = deadline.plusMonths(1) 从 2026-01-31 得到 2026-02-28——2026 年不是闰年，2 月只有 28 天，月份加法自动钳制到月末，B 正确。A 错误：那是「plusDays(1) 生效变成 2026-02-01，再加一个月」的结果，但该行的返回值根本没有接住。C 是把两次加法都当成生效的臆测。D 错误：java.time 的日期加法会自动调整为合法日期，不会抛异常。要点：所有 plusXxx / minusXxx 都返回新对象，必须重新赋值。',
  },
  {
    id: 'java-basics-05-api-io-005',
    type: 'single',
    difficulty: 2,
    tags: ['serialVersionUID', '序列化'],
    stem: '关于 Java 序列化与 serialVersionUID，下列说法正确的是？',
    options: [
      { key: 'A', text: '不显式声明 serialVersionUID 时，JVM 会随机生成一个，因此任何类修改都无法反序列化' },
      { key: 'B', text: '反序列化时若类的 serialVersionUID 与流中的不一致会抛 InvalidClassException；显式固定 UID 后，新增字段这类兼容性修改仍可正常反序列化，新字段取默认值' },
      { key: 'C', text: 'serialVersionUID 不一致时，JVM 会自动迁移旧数据完成反序列化' },
      { key: 'D', text: '被 transient 修饰的字段会正常参与序列化' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：UID 是类的版本指纹，不一致直接拒绝并抛 InvalidClassException；固定 UID 的意义正是允许「加字段、加方法」这类向前兼容的演进，反序列化时新字段用默认值填充。A 错误：未声明时 UID 按类名、接口、字段、方法签名等结构信息自动计算（不是随机），类结构一变 UID 就变导致不兼容——所以规范要求显式声明。C 错误：不存在自动迁移机制。D 错误：transient 的语义就是跳过序列化，反序列化后为默认值。',
  },
  {
    id: 'java-basics-05-api-io-006',
    type: 'multiple',
    difficulty: 2,
    tags: ['Files', 'NIO', 'Path'],
    stem: '关于 NIO.2 的 Files 与 Path（java.nio.file），下列说法正确的有？（多选）',
    options: [
      { key: 'A', text: 'Files.readAllLines 一次把整个文件载入内存，适合小文件；大文件应使用 Files.lines 流式读取或 BufferedReader 逐行处理' },
      { key: 'B', text: 'Path 表示路径：Paths.get("logs", "app.log") 拼接路径，path.resolve("2026") 在其下追加子路径' },
      { key: 'C', text: 'Files.copy(src, dest) 在目标文件已存在时会静默覆盖' },
      { key: 'D', text: 'Files.delete 删除不存在的文件时返回 false' },
      { key: 'E', text: 'Files.copy 想覆盖已存在的目标，需显式传入 StandardCopyOption.REPLACE_EXISTING' },
    ],
    answers: ['A', 'B', 'E'],
    explanation:
      'A、B、E 正确：readAllBytes / readAllLines 是「整读」语义，Files.lines 返回惰性 Stream 按行读取；Path 配合 resolve / normalize 构成跨平台路径 API；覆盖目标必须显式授权。C 错误：默认目标已存在直接抛 FileAlreadyExistsException，绝不会静默覆盖。D 错误：删除不存在的文件会抛 NoSuchFileException，返回 false 的是 deleteIfExists。',
  },
  {
    id: 'java-basics-05-api-io-007',
    type: 'scenario',
    difficulty: 3,
    tags: ['字符编码', '乱码排查'],
    scenario:
      '运营在 Windows 上用某老工具导出客户名单 CSV，文件实际编码是 GBK；上传到 Linux 服务器后，后端用 new FileReader(file) 逐行解析入库，前端页面中文全部显示为乱码（替代符）。服务器默认字符集是 UTF-8，团队规范是全链路 UTF-8。同一个文件在 Windows 开发机上用本地代码读却是正常的。',
    stem: '最合理的判断与修复是？',
    options: [
      { key: 'A', text: '根因是「文件编码 GBK × 解码字符集 UTF-8」不匹配，且 FileReader 依赖平台默认字符集。要求源头改用 UTF-8 导出；代码显式用 new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8) 读取，不依赖平台默认字符集' },
      { key: 'B', text: '读出乱码后，对每行做 new String(s.getBytes("UTF-8"), "GBK") 的二次转码修复' },
      { key: 'C', text: '把文件重命名为 .utf8 后缀，JVM 会自动按 UTF-8 解码' },
      { key: 'D', text: '把 Linux 服务器的默认字符集改成 GBK，与文件编码对齐即可' },
    ],
    answers: ['A'],
    explanation:
      '根因是编码不匹配 + 隐式依赖平台默认字符集：Windows 开发机默认 GBK 所以「碰巧正常」，Linux 默认 UTF-8 就乱码，这正是 new FileReader 的环境陷阱。A 从两头根治：源头统一 UTF-8，代码显式指定 Charset（JDK 11 前 FileReader 无法传字符集，须用 InputStreamReader 包装；JDK 11+ 已提供 Charset 重载可直接传）。B 是常见误区：先按错误编码解码再试图转回，无效字节已变成替换符，信息丢失不可逆。C 荒谬：后缀不影响解码行为。D 临时对齐但把全局默认改成小众编码，其他 UTF-8 文件全乱，违背团队规范、引出新坑。',
  },
]
