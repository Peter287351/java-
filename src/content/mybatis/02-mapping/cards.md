## 结果映射：resultType、resultMap 与关联

### 是什么
`resultType` 按列名与属性名自动同名映射；`resultMap` 显式声明列与属性的对应关系，支持 `association`（一对一）与 `collection`（一对多）做关联映射。开启 `mapUnderscoreToCamelCase` 后，`create_time` 可自动映射到 `createTime`。

### 怎么用
单表、列名规范用 resultType 最省事；列名不一致、需要嵌套对象或懒加载时用 resultMap。一对多务必用 `collection` + 主键分组，不要自己 JOIN 后在 Java 里手工拼装。

### 常见坑
- 只查了部分列却用 resultType 映射整个实体，缺列的属性会是 null 而非报错。
- JOIN 一对多直接写 resultType 会产生重复行，应该用 resultMap 的 collection 或拆成两次查询。
- `mapUnderscoreToCamelCase` 是全局开关，改之前要确认所有 SQL 的别名约定一致。

### 面试怎么问
「resultType 和 resultMap 什么时候换？」答列名不一致/嵌套映射时用 resultMap，并说出 association 与 collection 的区别。

## 动态 SQL 标签

### 是什么
`<if>` 按条件拼接片段；`<where>` 只在有子元素时输出 WHERE 并自动去掉开头多余的 AND/OR；`<set>` 用于 UPDATE 并去掉末尾多余逗号；`<foreach>` 遍历集合做 IN 查询或批量插入；`<trim>` 可自定义前缀后缀覆盖规则。

### 怎么用
多条件搜索用 `<where>` 包住一组 `<if>`；批量操作用 `<foreach collection="list" item="x" separator=",">`。`<choose>/<when>/<otherwise>` 对应「只取第一个命中的分支」。

### 常见坑
- 手写 `WHERE 1=1` 虽然能跑，但会掩盖索引与条件问题，优先用 `<where>`。
- `<if test="name != null and name != ''">` 里字符串判空要写全，只判 null 会拼出空条件。
- foreach 的 `collection` 名字要与参数注解一致（单 List 默认是 list/collection）。

### 面试怎么问
「动态 SQL 里 WHERE AND 语法错误怎么来的、怎么解？」答条件片段带 AND 但没用 `<where>` 或 `<trim>` 去除。

## 动手清单
1. 写一个带三个可选条件的查询，先用裸 `<if>` 复现 `WHERE AND` 报错，再换成 `<where>`。
2. 用 `<foreach>` 写批量插入并打印最终 SQL；自测标准：能说清 collection、item、separator 各控制什么。
