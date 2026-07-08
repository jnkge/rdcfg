---
name: flutter-riverpod
description: Riverpod 状态管理与依赖注入最佳实践，含 Provider 体系与 AsyncValue。
category: framework
language: flutter
source: github.com/Jeffallan/claude-skills
---

# Flutter Riverpod 状态管理

本 skill 用于 Riverpod（推荐版本 2.x，配合 `flutter_riverpod` 与可选的 `riverpod_generator` 代码生成）。覆盖以下核心要点：

- **Provider 类型体系**：根据场景选用 `Provider`（派生/计算值）、`StateProvider`（简单可变状态）、`FutureProvider`（一次性异步）、`StreamProvider`（实时流）、`NotifierProvider`（带方法的复杂状态）、`AsyncNotifierProvider`（带方法的异步状态）。
- **Notifier 模式**：使用 `@riverpod` 注解 + `_$` 基类生成不可变状态；变更时务必返回新实例（`state = [...]`），切勿就地修改。
- **Widget 消费**：优先使用 `ConsumerWidget` 而非 `StatefulWidget`；用 `ref.watch` 订阅、`ref.read` 在回调中一次性读取；用 `ref.watch(provider.select(...))` 做细粒度重建以减少不必要 build。
- **AsyncValue 三态**：`when(data:, loading:, error:)` 统一处理加载/成功/失败，配合 `AsyncValue.guard` 实现安全的异步更新。
- **测试**：用 `ProviderContainer` + `override` 注入假依赖，断言读取结果。

## 参考文档

完整 Provider 用法、Notifier 示例、Widget 消费模式与速查表见：

- `references/riverpod-state.md` — Provider 类型、Riverpod 2.0 Notifier 写法、ConsumerWidget/select/AsyncValue 用法、Provider 速查对照表。

## 关键约束

- **必须**：状态变更创建新实例，`const` 构造静态 widget，复杂状态走 Notifier 而非散落的 `StateProvider`。
- **禁止**：用 `setState` 维护跨页面/全局状态，在 `build()` 内创建 Provider，直接修改 `state` 内部字段。
