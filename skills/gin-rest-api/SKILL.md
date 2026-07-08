---
name: gin-rest-api
description: Gin Web 框架开发最佳实践，含路由组、中间件、参数绑定与错误处理。
category: framework
language: go
source: gin-gonic.com
---

# Gin REST API

基于 gin-gonic/gin（原生仓库，非任何第三方增强分支）构建高性能 REST API 的工程实践，覆盖路由组与嵌套、中间件链、请求绑定与校验、统一响应与错误处理、项目结构及测试。目标是让 AI 助手在生成 Gin 代码时遵循官方 API 约定，路由清晰、校验前置、错误集中处理、可测试可演进。

## 核心要点

- **引擎选择**：`gin.Default()` 自带 Logger + Recovery，适合快速启动；需要自定义中间件集合或替换日志格式时用 `gin.New()` 再按需 `Use()`。生产环境务必保留 `gin.Recovery()` 防 panic 打挂进程。
- **路由组织靠分组**：用 `router.Group(prefix, middleware...)` 按版本/领域聚合路由，支持多级嵌套；公共中间件（鉴权、CORS、限流）挂在组级，避免每条路由重复。
- **参数绑定用 Should 系列**：优先 `c.ShouldBindJSON` / `ShouldBindQuery` / `ShouldBindUri`，绑定失败时由开发者决定响应；避免 `Bind` 系列（会自动写 400 且 `Content-Type` 退化为 `text/plain`，丢失控制权）。
- **校验靠 struct tag**：字段用 `binding:"required"` 等标签（go-playground/validator），复杂规则注册自定义验证器；校验错误统一翻译后再返回，不要把内部字段名直接暴露给客户端。
- **统一响应结构**：所有端点返回 `{code, message, data}` 一致 envelope，错误经中间件集中捕获（`c.Error()` + 末尾 ErrorHandler 读 `c.Errors` 统一响应），不要在每个 handler 里散写错误格式。
- **中断链路用 Abort**：鉴权失败、参数校验失败要 `c.AbortWithStatusJSON(code, resp)`，阻止后续中间件/handler 执行；`c.Abort()` 后再单独 `c.JSON` 容易出现"已写头部"告警。
- **项目分层**：`cmd/` 入口 + `internal/`（handlers/services/models/middleware/routes）按领域分包，handler 薄、service 厚，依赖通过构造函数注入便于测试。
- **测试用 httptest**：`httptest.NewRecorder()` + `router.ServeHTTP` 直接打路由，table-driven 覆盖正常/边界/错误路径；服务层用接口打桩，避免起真实数据库。
- **优雅关闭**：用 `http.Server` + `signal.Notify(SIGINT, SIGTERM)` + `Shutdown(ctx)`，不要直接 `r.Run()` 后被强杀导致在途请求断连。

## 参考指南

| 主题 | 参考文件 | 何时查阅 |
|------|---------|---------|
| 路由与中间件 | `references/routing-and-middleware.md` | 新建引擎、定义路由、分组与嵌套、路径/通配参数、写自定义中间件、NoRoute/NoMethod 处理 |
| 请求参数与绑定 | `references/request-binding.md` | 绑定 JSON/Query/URI/Form、binding tag 与 required 校验、自定义验证器、文件上传（单/多文件） |
| 响应与错误处理 | `references/response-and-errors.md` | JSON/XML/File 响应、统一响应 envelope、错误处理中间件、Abort 链、SSE 流式推送 |
| 项目结构与测试 | `references/project-structure-and-testing.md` | 目录划分、依赖注入、httptest + table-driven 测试、air 热重载、优雅关闭 |

## 约束

### 必做
- 生产用 `gin.New()` 显式装配中间件，或 `gin.Default()` 保留 Logger+Recovery；不要裸用无 Recovery 的引擎。
- 用 `router.Group` 组织路由并挂组级中间件；鉴权路由单独成组，公共路由另成组。
- 请求绑定一律用 `ShouldBind*` 系列；绑定失败后 `return`，不要继续执行业务逻辑。
- 校验规则用 `binding` struct tag 表达，复杂规则注册自定义 validator；错误信息经翻译/脱敏后再返回。
- 所有响应走统一 envelope `{code, message, data}`；错误经 `c.Error(err)` + 末端中间件集中格式化。
- handler 只做参数解析与响应编排，业务逻辑下沉 service 层；service 通过接口注入到 handler。
- 关键路径写 httptest table-driven 测试，覆盖正常、校验失败、权限拒绝三类用例。
- 部署用 `http.Server` + signal 优雅关闭，带超时 `Shutdown(ctx)`。

### 禁止
- 不要使用 `Bind` / `BindJSON` / `BindQuery` 等 Must-bind 系列（自动写 400 且 Content-Type 退化为 text/plain，丢失响应控制权）。
- 不要在 goroutine 里直接用原始 `*gin.Context`，必须 `c.Copy()` 得到只读副本再传递。
- 不要信任 `file.Filename`，上传文件名要做路径剥离与重命名，避免目录穿越。
- 不要把业务逻辑堆进路由 handler（fat handler），也不要在 handler 里直接拼 SQL。
- 不要用 `c.Abort()` 后再单独 `c.JSON()`，应直接 `c.AbortWithStatusJSON()`。
- 不要混用第三方增强分支（如 darkit/gin 等）的专有 API；所有代码须基于原生 `github.com/gin-gonic/gin`。
- 不要在路由注册顺序上依赖参数路由优先级做业务逻辑（Gin 中精确路由先于参数路由匹配，行为隐式）。
