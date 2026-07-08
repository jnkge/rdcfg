---
name: flutter-go-router
description: go_router 声明式导航最佳实践，含路由树、命名路由、ShellRoute 与认证守卫。
category: framework
language: flutter
source: github.com/Jeffallan/claude-skills
---

# Flutter go_router 声明式导航

本 skill 用于官方 `go_router` 包，覆盖声明式路由树、命名路由、持久化 UI 与认证守卫等要点：

- **声明式路由树**：以嵌套 `GoRoute` 描述 URL 结构，`path` + `builder` 生成页面；通过 `MaterialApp.router(routerConfig: goRouter)` 接入。
- **导航 API**：`context.go()` 替换栈、`context.push()` 入栈、`context.pop()` 返回、`context.pushReplacement()` 替换当前；通过 `extra` 传递非 URL 数据，目标页用 `GoRouterState.of(context).extra` 取回。
- **参数**：路径参数 `details/:id` 经 `state.pathParameters['id']` 读取；查询参数经 `state.uri.queryParameters['q']` 读取。
- **ShellRoute**：为需要常驻 UI（如底部导航栏）的子路由提供共享 `builder`，外壳只构建一次、子页在 `child` 中切换。
- **重定向与认证守卫**：在顶层 `redirect` 钩子中根据登录状态与 `state.matchedLocation` 决定跳转 `/auth/login` 或放行（返回 `null`）。
- **Web/深链接**：URL 同步支持深链接与浏览器前进后退。

## 参考文档

完整路由配置、导航方法、ShellRoute、查询参数与速查表见：

- `references/gorouter-navigation.md` — GoRouter 基础配置（含 redirect 认证守卫）、context 导航方法、ShellRoute 持久化 UI、查询参数用法、方法速查对照表。

## 关键约束

- **必须**：用 `MaterialApp.router` 接入路由；重定向逻辑集中放在顶层 `redirect`；路径参数与查询参数显式校验并提供默认值。
- **禁止**：与 `Navigator.push` 混用造成双栈；在 `builder` 中执行副作用（应只依据 `state` 纯构建）；忽略 `push` 与 `go` 的语义差异。
