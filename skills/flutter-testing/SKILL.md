---
name: flutter-testing
description: Flutter 测试体系最佳实践，含 unit/widget/integration 测试与 golden test。
category: tool
language: flutter
source: flutter.dev/testing
---

# Flutter Testing

本 skill 指导 Flutter 应用的自动化测试体系：unit 测试验证纯逻辑、widget 测试验证单个组件 UI 与交互、integration 测试在真机/模拟器上验证完整流程，并覆盖 golden test 与 mock。核心思想：测试金字塔（unit 多、widget 中、integration 少而精）、行为优先而非实现细节、测试彼此独立、用 mock 隔离外部依赖、覆盖率作为参考而非目标。完整英文细则见 references。

## 核心要点

- **三类测试**：unit 测单个函数/方法/类（`test` 包，快、依赖少）；widget 测单个 widget（`flutter_test` 的 `testWidgets` + `WidgetTester`，在测试环境渲染组件树）；integration 测完整 app 或大流程（`integration_test` 包，跑在真机/模拟器上）。
- **test 包三件套**：`test()` 定义用例、`expect(actual, matcher)` 断言、`expectLater` 异步断言；`group()` 分组、`setUp`/`tearDown` 管理每个用例的前后置。
- **断言匹配器**：`equals`、`contains`、`isA<T>()`、`throwsA(matcher)`、`findsOneWidget`/`findsNWidgets(n)` 等；匹配器组合优于多个 `expect`。
- **mock 隔离**：用 `mocktail`（无代码生成，Dart 社区主流）替代 `mockito`。`class MockX extends Mock implements X {}`、`when(() => x.m()).thenAnswer/thenReturn/thenThrow`、`verify(() => x.m()).called(n)`；`any()` 匹配参数需 `registerFallbackValue` 注册自定义类型（放 `setUpAll`）。
- **Widget 测试流程**：`pumpWidget()` 挂载 → `pump(Duration)` 推进单帧 → `pumpAndSettle()` 等所有动画完成 → `find.*` 定位 → `tester.tap()`/`enterText()` 交互。涉及动画/`setState` 必须显式 `pump` 或 `pumpAndSettle`，否则断言过早。
- **Finder 体系**：`find.byType`、`find.byKey`、`find.text`、`find.widgetWithIcon`、`find.descendant(of:, matching:)`、`find.ancestor`；用 `Key` 唯一标识列表中重复 widget。
- **Golden test**：`expectLater(find.byType(X), matchesGoldenFile('goldens/x.png'))`；首次运行 `--update-goldens` 生成基线，后续比对像素。不同平台字体/渲染可能造成误报，需固定字体。
- **Integration test**：`IntegrationTestWidgetsFlutterBinding.ensureInitialized()` 初始化绑定，其余写法同 widget 测试；`flutter test integration_test/` 运行；`binding.takeScreenshot()` 截图后配 `matchesGoldenFile` 做视觉回归。
- **覆盖率**：`flutter test --coverage` 生成 `coverage/lcov.info`，用 `genhtml` 或 IDE 查看；作为参考指标，重点覆盖关键业务逻辑而非追求 100%。

## 参考指南

| 主题 | 参考文件 | 何时查阅 |
|------|---------|---------|
| 单元测试 | references/unit-testing.md | 写纯逻辑测试：test 包 API、断言匹配器、group/setUp、mocktail 全套用法、覆盖率与 lcov |
| Widget 测试 | references/widget-testing.md | 测单个组件：testWidgets/pumpWidget、pump 与 pumpAndSettle、Finder 体系、交互模拟、golden test 与调试陷阱 |
| 集成测试 | references/integration-testing.md | 测完整流程：integration_test 包、真机运行、截图测试、CI 集成（GitHub Actions / Codemagic） |
| 测试最佳实践 | references/best-practices.md | 测试策略：测试金字塔、命名规范、AAA 模式、测试独立性、何时该/不该 mock、覆盖率目标 |

## 约束

### 必做
- 按测试金字塔分配精力：大量 unit、适量 widget、少量 integration 覆盖关键用户路径。
- 测试彼此独立：每个用例自备数据、自行清理，不依赖其他用例的执行顺序或残留状态。
- 遵循 AAA（Arrange-Act-Assert）结构，断言聚焦行为而非实现细节。
- 用 mock 隔离外部依赖（网络、数据库、文件系统、平台插件），保证测试快速且不 flaky。
- widget/integration 测试涉及动画或异步交互时，必须 `pumpAndSettle()` 或显式 `pump(Duration)` 后再断言。
- mock 自定义类型参数用 `any()` 前，在 `setUpAll` 调用 `registerFallbackValue`。
- 把测试纳入 CI，每次提交自动运行 unit + widget，集成测试定期或发布前运行。
- golden test 基线文件纳入版本控制；CI 上固定字体与渲染环境以避免误报。

### 禁止
- 测试间共享可变状态或存在隐式依赖（破坏隔离、失败难定位）。
- 用 mock 测真实业务逻辑（应测被测单元的行为，mock 只用于隔离其依赖）。
- 在 widget 测试中忽略帧调度——未 `pump` 就断言会得到 "widget not found" 假失败。
- 追求 100% 覆盖率而写无意义的 getter/setter 测试，或为凑覆盖率测实现细节。
- 用 `sleep`/`Future.delayed` 等真实延时等待异步完成（应用 `expectLater` + completion、`pumpAndSettle` 或 `tester.binding` 控制时间）。
- 在 unit 测试中渲染 widget 或访问平台插件 channel（unit 测试不应有 UI/平台依赖）。
- 把 flaky 测试当作"偶发问题"忽略——必须定位时序或环境依赖并修复。
