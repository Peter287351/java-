import type { QuestionSpec } from '../../../types'

export const questions: QuestionSpec[] = [
  {
    id: 'java-basics-02-oop-001',
    type: 'single',
    difficulty: 1,
    tags: ['多态'],
    stem: '父类引用指向子类对象：Parent p = new Child(); 下列说法正确的是？',
    options: [
      { key: 'A', text: '通过 p 调用实例方法时，绑定的是编译期类型 Parent 的方法版本' },
      { key: 'B', text: '通过 p 调用被子类重写的实例方法时，运行期绑定到对象实际类型 Child；而通过 p 访问成员变量仍按编译期类型 Parent 解析' },
      { key: 'C', text: 'p 无法调用 Child 新增的方法，强制转换后也不行' },
      { key: 'D', text: 'Java 的多态主要通过方法重载（overload）实现' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：实例方法调用是动态绑定（运行期看对象实际类型），成员变量访问是静态绑定（编译期看引用类型），这正是「方法多态、字段不多态」的经典辨析。A 错误：编译期只确定方法签名候选，运行期才决定执行哪个版本。C 错误：强转 (Child) p 之后即可调用子类新增方法，只是要留意 ClassCastException 风险。D 错误：多态的载体是重写（override），重载是编译期按参数选方法，与动态绑定无关。',
  },
  {
    id: 'java-basics-02-oop-002',
    type: 'single',
    difficulty: 1,
    tags: ['重载', '重写'],
    stem: '关于方法重载（overload）与重写（override），下列说法正确的是？',
    options: [
      { key: 'A', text: '重写时子类方法的访问权限可以比父类更小，例如 public 改成 private' },
      { key: 'B', text: '只要方法名相同、返回值类型不同，就构成重载' },
      { key: 'C', text: '重载是方法名相同且参数列表必须不同；重写发生在父子类之间，方法签名必须相同' },
      { key: 'D', text: 'static 方法被子类同名方法「覆盖」后，通过父类引用调用会执行子类版本' },
    ],
    answers: ['C'],
    explanation:
      'C 正确描述了两者的边界：重载看参数列表（编译期静态选择），重写看相同签名（运行期动态绑定）。A 错误：重写的访问权限不能缩小，public 改 private 编译报错，受检异常也不能声明得更宽。B 错误：仅返回值不同不构成重载，编译器报「方法已定义」。D 错误：static 方法没有多态，子类同名 static 方法是隐藏（hiding），通过父类引用调用的仍是父类版本。',
  },
  {
    id: 'java-basics-02-oop-003',
    type: 'multiple',
    difficulty: 2,
    tags: ['接口', '抽象类'],
    stem: '关于接口（interface）与抽象类（abstract class），下列说法正确的有？（多选）',
    options: [
      { key: 'A', text: '抽象类可以有构造器和普通成员变量来承载状态；接口中的变量默认都是 public static final 常量' },
      { key: 'B', text: 'JDK 8 之后接口可以有 default 方法，抽象类已经没有任何存在价值' },
      { key: 'C', text: '一个类只能继承一个抽象类，但可以实现多个接口' },
      { key: 'D', text: '抽象类中的方法必须都是抽象方法' },
      { key: 'E', text: '一个类同时实现两个互不相关（无继承关系）的接口、两者存在同签名 default 方法时，实现类必须重写该方法，否则编译失败' },
    ],
    answers: ['A', 'C', 'E'],
    explanation:
      'A、C、E 正确：抽象类是「半成品模板」，能持有状态、构造逻辑与模板方法；接口是多能力声明，Java 类只能单继承但可以多实现；E 是两个互不相关接口的 default 方法出现菱形冲突时的规则——编译器无法替你选择。B 错误：default 方法让接口能演化 API，但抽象类仍可持有私有状态与构造器，二者定位不同，没有被取代。D 错误：抽象类可以包含普通具体方法，只要不能被实例化即可。',
  },
  {
    id: 'java-basics-02-oop-004',
    type: 'code',
    difficulty: 3,
    tags: ['初始化顺序'],
    stem: `下面代码的输出是什么？

~~~java
public class Main {
    static class Parent {
        static { System.out.print("P-static "); }
        { System.out.print("P-block "); }
        Parent() { System.out.print("P-ctor "); }
    }
    static class Child extends Parent {
        static { System.out.print("C-static "); }
        { System.out.print("C-block "); }
        Child() { System.out.print("C-ctor "); }
    }
    public static void main(String[] args) {
        new Child();
    }
}
~~~`,
    options: [
      { key: 'A', text: 'P-static C-static P-block P-ctor C-block C-ctor' },
      { key: 'B', text: 'P-static P-block P-ctor C-static C-block C-ctor' },
      { key: 'C', text: 'C-static C-block C-ctor P-static P-block P-ctor' },
      { key: 'D', text: 'P-static C-static P-ctor P-block C-ctor C-block' },
    ],
    answers: ['A'],
    explanation:
      '类初始化先于对象初始化，且父类先于子类：静态块按「父类静态 → 子类静态」在类加载时各执行一次；随后创建对象按「父类实例块 → 父类构造器 → 子类实例块 → 子类构造器」，A 正确。B 把子类静态块穿插到了对象构造之间——静态初始化在类加载阶段全部完成，不会出现这种交错。C 完全颠倒了父子顺序。D 混淆了同类中实例块与构造器的相对顺序：实例块总是先于构造器体执行。口诀：父静子静、父块父构、子块子构。',
  },
  {
    id: 'java-basics-02-oop-005',
    type: 'single',
    difficulty: 2,
    tags: ['static', 'final'],
    stem: '关于 static 与 final，下列说法正确的是？',
    options: [
      { key: 'A', text: 'static 方法属于类而非实例，方法体内不能使用 this 或 super' },
      { key: 'B', text: 'final 修饰引用类型变量后，该对象的内容也不能再修改' },
      { key: 'C', text: 'static 实例变量在每次 new 对象时都会重新初始化一次' },
      { key: 'D', text: 'final 修饰的方法不能被重载，但可以被重写' },
    ],
    answers: ['A'],
    explanation:
      'A 正确：static 方法不依赖任何实例、没有 this 引用，自然也无法 super 调用父类版本。B 错误：final 锁的是「引用不可重新指向」，对象内容（如 final List 里的元素）依然可改，要内容不可变得靠不可变类型。C 错误：static 变量属于类，类只加载一次，所有实例共享同一份。D 完全说反：final 方法不能被子类重写（override），但不妨碍在同一个类里重载（overload）。',
  },
  {
    id: 'java-basics-02-oop-006',
    type: 'single',
    difficulty: 2,
    tags: ['内部类'],
    stem: '关于内部类（inner class）与嵌套类（nested class），下列说法正确的是？',
    options: [
      { key: 'A', text: '静态嵌套类持有外部类实例引用，可以直接访问外部类的实例字段' },
      { key: 'B', text: '匿名内部类访问所在方法的局部变量时，该变量必须是 final 或 effectively final' },
      { key: 'C', text: '非静态内部类可以在任意位置用 new Inner() 直接创建，不依赖外部实例' },
      { key: 'D', text: '匿名内部类只能实现接口，不能继承普通类' },
    ],
    answers: ['B'],
    explanation:
      'B 正确：局部变量被匿名内部类捕获时是按值复制，为保证内外一致，JDK 8 起要求该变量 final 或等效 final（声明后不再重新赋值）。A 错误：static nested class 不持有外部实例引用，访问不了实例字段，只能访问外部类的 static 成员。C 错误：非静态内部类隐式绑定外部实例，必须先有外部对象，如 outer.new Inner()。D 错误：匿名内部类既可以实现接口（new Runnable(){...}），也可以继承类（new Thread(){...}）。',
  },
  {
    id: 'java-basics-02-oop-007',
    type: 'single',
    difficulty: 2,
    tags: ['record', 'Object方法'],
    stem: '关于 record（JDK 16 转正）与 Object 核心方法，下列说法正确的是？',
    options: [
      { key: 'A', text: 'record 由编译器按全部组件自动生成 equals、hashCode、toString，组件本身是 final 不可变的' },
      { key: 'B', text: 'record 可以通过 extends 继承一个普通类来复用其字段' },
      { key: 'C', text: 'record 的组件字段可以通过自动生成的 setter 修改' },
      { key: 'D', text: '不重写 hashCode 时，Object 的默认实现返回的就是对象在内存中的地址数值' },
    ],
    answers: ['A'],
    explanation:
      'A 正确：record 是「不可变数据载体」，构造后组件不可改，三个 Object 方法自动基于全部组件生成。B 错误：record 隐式 final 且已继承 java.lang.Record，不能再有父类，只能实现接口。C 错误：没有 setter，也没有无参构造，修改数据须新建 record 实例。D 错误：默认 hashCode 通常与对象身份相关（类似 identity hash），但规范明确不保证等于内存地址，各 JVM 实现也不同，依赖其具体数值是错误做法。',
  },
  {
    id: 'java-basics-02-oop-008',
    type: 'scenario',
    difficulty: 3,
    tags: ['构造器', '可重写方法'],
    scenario:
      '框架里有一个抽象任务基类 BaseJob，构造器中调用 this.init() 完成装配。子类 HttpJob 重写了 init()，其中访问自身字段 private String url = "...";（字段在声明处赋值，且 init() 会在某条分支读取 url）。测试环境只覆盖了不读 url 的分支，没暴露问题；线上首次创建 HttpJob 实例走到读取分支时，稳定抛出 NullPointerException，堆栈落在 init() 里读取 url 的那一行。',
    stem: '对该问题的判断与修复，最合理的是？',
    options: [
      { key: 'A', text: '根因是父类构造器执行时子类字段初始化尚未发生：构造期调用可被重写的方法，会让重写方法在「半成品对象」上运行。把 init() 这类钩子移出构造器（改为显式 start() 或框架生命周期回调），并保持构造器内不调用可被重写的方法' },
      { key: 'B', text: '把子类字段 url 声明为 static，让它在类加载阶段就完成赋值' },
      { key: 'C', text: '在父类构造器中用 try-catch 包住 this.init()，捕获 NullPointerException 后重试几次' },
      { key: 'D', text: '把子类字段 url 加上 final 修饰，JVM 会保证它在父类构造器执行前完成赋值' },
    ],
    answers: ['A'],
    explanation:
      '初始化顺序是「父类构造器先跑、子类字段赋值后跑」：父类构造器调用 init() 时动态绑定到子类重写版本，此刻 url 还是默认值 null——该问题在构造期必然发生、与运行时序无关，只是测试分支没覆盖到读取 url 的路径，A 的根因链完整且修复方向正确。B 是饮鸩止渴：static 会让所有实例共享 url，语义被破坏。C 用重试掩盖确定性缺陷，半成品状态下重试依然 NPE。D 错误：final 不改变「父类构造先于子类字段初始化」的顺序。经验法则：构造器只做确定性装配，绝不调用可被重写的方法。',
  },
]
