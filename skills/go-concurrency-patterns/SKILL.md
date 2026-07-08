---
name: go-concurrency-patterns
description: Go 并发模式最佳实践，含 worker pool、fan-in/fan-out、context 取消。
category: framework
language: go
source: github.com/Jeffallan/claude-skills
---

# Go Concurrency Patterns

本 skill 覆盖 Go 并发编程的核心模式：goroutine 生命周期管理、channel（generator / fan-out / fan-in / pipeline）、select 超时与取消、sync 原语、限流与背压。目标是写出无泄漏、可取消、有界的并发代码。

## 核心工作流

1. **界定并发边界** — 明确 goroutine 的启动与退出条件，绝不让 goroutine 无主运行。
2. **传播 context** — 所有阻塞操作接收 `context.Context`，在 `select` 中处理 `ctx.Done()`。
3. **选对模式** — 有界并发用 worker pool；多路并行归并用 fan-out/fan-in；流式处理用 pipeline；共享状态用 mutex/RWMutex。
4. **背压控制** — 用带缓冲 channel、semaphore 或 `golang.org/x/time/rate` 限流，防止生产端压垮消费端。
5. **验证** — 测试加 `-race` 标志，确认无数据竞争与 goroutine 泄漏。

## 参考文档路由

根据上下文加载详细指引：

| 主题 | 参考文件 | 何时加载 |
|------|----------|----------|
| 并发模式全集 | `references/concurrency.md` | 写 goroutine/channel、worker pool、fan-in/fan-out、pipeline、select 超时、sync 原语、限流/背压时 |

> 参考文件包含可运行的代码骨架：有界 worker pool、generator、fan-out/fan-in、多阶段 pipeline、select 超时与 done channel 优雅关闭、`sync.Mutex`/`RWMutex`/`Once`、token bucket 限流器、semaphore，以及一张模式速查表。

## 约束

### 必做
- 每个 goroutine 都要有明确的退出路径（`ctx.Done()` 或关闭的 channel）。
- 所有阻塞调用接收并尊重 `context.Context`。
- 共享可变状态用 `sync.Mutex` / `sync.RWMutex` 保护；读多写少用 `RWMutex`。
- channel 由唯一的发送方负责 `close`；多发送方用 `sync.WaitGroup` 协调后统一关闭。
- 测试始终加 `-race`。

### 禁止
- 不要启动没有生命周期管理的 goroutine（"fire-and-forget"）。
- 不要忽略 `ctx.Done()` 分支，否则取消信号无法传播、goroutine 泄漏。
- 不要在已关闭的 channel 上发送（会 panic）。
- 不要对 goroutine 内的错误静默丢弃，用 error channel 或 `errgroup` 向上传播。
- 不要用 `panic` 处理并发中的正常错误，用 error 返回值。
