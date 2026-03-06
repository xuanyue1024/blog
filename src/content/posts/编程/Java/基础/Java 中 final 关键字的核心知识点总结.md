---
author: 竹林听雨
tags:
  - Java
  - final
title: Java 中 final 关键字的核心知识点总结
abbrlink: "41961988"
published: 2025-11-13 22:15:54
updated: 2025-11-13 22:15:54
---

`final` 是 Java 中用于表达“不可变性”（Immutability）的关键字，可修饰变量、方法和类。其核心作用是限制变更，提升代码安全性与可读性。

## 1. `final` 修饰变量

### 局部变量

- 必须在声明时或使用前显式初始化；
- 一旦赋值，不能重新赋值；
- 若被匿名内部类或 Lambda 表达式捕获，必须是 **effectively final**（实质上不可变），显式 `final` 非必需但可增强语义。

### 成员变量（字段）


- 只能在声明处或构造器中赋值一次；
- 对象构造完成后，引用不可更改；
- **注意**：`final` 仅锁定引用，不阻止修改对象内部状态（如 `final List` 仍可 `add()`）。

### 引用类型 vs 基本类型

- `final int x = 10;` → `x` 的值不可变；
- `final StringBuilder sb = new StringBuilder();` → `sb` 引用不可变，但 `sb.append()` 允许（对象内容可变）。

## 2. `final` 修饰方法

- 禁止子类重写（override）；
- 可用于保护关键逻辑不被覆盖；
- 不影响继承和调用。

## 3. `final` 修饰类

- 禁止被继承；
- 常用于设计不可变类或安全敏感类（如 `String`、`Integer`）；
- 提升安全性与 JVM 优化潜力。

## 4. `final` 与线程安全

- **`final` 本身不等于线程安全**；
- 它保证：
    - 引用不可变；
    - 在 Java 内存模型（JMM）下，正确构造的对象其 `final` 字段对所有线程**立即可见**；
- 线程安全性最终取决于所引用对象是否线程安全：
    - ✅ `final String s = "x"` → 线程安全（`String` 不可变）；
    - ❌ `final List<String> list = new ArrayList<>()` + 多线程修改 → **非线程安全**。

## 5. 最佳实践

- 优先将成员变量声明为 `final`，尤其是依赖注入字段；
- 构造不可变对象时，所有字段应为 `final`；
- 结合不可变集合（如 `List.of()`、`Collections.unmodifiableList()`）实现真正不可变状态；
- 避免误认为 `final` 能自动保证并发安全。


> **核心原则**：`final` 锁定的是“标识符的绑定”，而非“对象的内容”。理解这一点，是正确使用 `final` 的关键。
