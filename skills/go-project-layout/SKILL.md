---
name: go-project-layout
description: Go 项目目录结构约定，含 cmd/internal/pkg 划分与模块边界。
category: design
language: go
source: github.com/Jeffallan/claude-skills
---

# Go Project Layout

本 skill 指导 Go 项目的目录结构与模块管理：`cmd/` 多入口、`internal/` 私有代码、`pkg/` 公共库，以及 `go.mod` / `go.work` 模块边界。目标是让新建或重构的项目遵循 Go 社区通用约定，包边界清晰、构建可复现、易于团队协作。

## 核心工作流

1. **确定入口** — 在 `cmd/<name>/main.go` 下为每个可执行程序放一个入口；不要在仓库根目录写 `main.go`。
2. **隔离私有代码** — 仅本项目使用的代码放 `internal/`，编译器会阻止外部导入；可对外复用的放 `pkg/`。
3. **管理依赖** — 用 `go mod init` 建模块，`go mod tidy` 维护依赖，`go work` 协调 monorepo 多模块。
4. **领域分包** — 按领域（如 `user/`、`order/`）而非技术层（如 `controllers/`、`models/`）组织包，避免循环依赖。
5. **构建自动化** — 用 Makefile 统一 `build` / `test` / `lint` / `fmt`，多阶段 Dockerfile 产出精简镜像。

## 参考文档路由

根据上下文加载详细指引：

| 主题 | 参考文件 | 何时加载 |
|------|----------|----------|
| 项目布局与模块管理 | `references/project-structure.md` | 新建项目、目录划分、`internal`/`pkg` 边界、`go.mod`/`go.work`、Makefile、Dockerfile、build tags、版本信息注入 |

> 上述内容集中在单一参考文件中，涵盖了标准目录树、模块命令、internal 包语义、monorepo 工作区、构建标签、Makefile、多阶段 Dockerfile、ldflags 版本注入、`go:generate` 与配置管理。

## 约束

### 必做
- 每个可执行程序放在 `cmd/<name>/main.go`，保持 `main` 精简（仅装配依赖、调用 `internal/` 逻辑）。
- 私有代码放 `internal/`，对外 API 放 `pkg/`，边界由编译器强制。
- 用 `go mod tidy` 保持 `go.mod`/`go.sum` 干净；提交前运行 `go vet ./...`。
- 配置走环境变量或 functional options，不要硬编码。

### 禁止
- 不要在仓库根目录放 `main.go`。
- 不要把可复用库代码塞进 `internal/`（外部无法导入）。
- 不要手动编辑 `go.sum` 或 `// indirect` 依赖。
- 不要跨领域层分包（如统一的 `models/` 巨包），按领域聚合。
