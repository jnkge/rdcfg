---
name: laravel-best-practices
description: Laravel 全栈开发最佳实践，含 Eloquent ORM、路由、队列与 Artisan。
category: framework
language: php
source: github.com/Jeffallan/claude-skills
---

# Laravel 全栈开发最佳实践

本 skill 面向 Laravel 10+ 与 PHP 8.2+ 的全栈开发，覆盖 Eloquent ORM、路由与 API、队列系统、Livewire 响应式组件与测试，帮助你在建模、接口、异步任务与质量保障各环节做出符合社区共识的决策。

## 核心工作流

1. **分析需求** — 识别模型、关系、API 与队列需求。
2. **设计架构** — 规划数据库 schema、Service 层与 Job 队列。
3. **实现模型** — 用 `php artisan make:model` 创建带关系、作用域与 cast 的 Eloquent 模型，再用 `php artisan migrate:status` 校验。
4. **构建功能** — 开发控制器、Service、API Resource 与 Job，用 `php artisan route:list` 核对路由。
5. **充分测试** — 编写 feature/unit 测试，在确认任一步骤完成前执行 `php artisan test`（目标覆盖率 >85%）。

## 约束

### 必须做
- 使用 PHP 8.2+ 特性（readonly、enum、typed properties）。
- 为所有方法参数与返回值添加类型声明。
- 正确使用 Eloquent 关系，用 eager loading 避免 N+1。
- 用 API Resource 转换输出数据。
- 把耗时任务放入队列。
- 编写覆盖关键路径的测试（>85%）。
- 使用服务容器与依赖注入。
- 遵循 PSR-12 编码规范。

### 禁止做
- 使用未受保护的裸查询（SQL 注入风险）。
- 漏掉 eager loading（导致 N+1）。
- 明文存储敏感数据。
- 在控制器里堆业务逻辑。
- 硬编码配置值。
- 跳过用户输入校验。
- 使用已废弃的 Laravel 特性。
- 忽略队列失败。

## 代码模板

每个实现都应以下列结构为起点：类型化的 Eloquent 模型、migration、API Resource、可入队 Job，以及一个 Pest feature test。完整模板见原始 SKILL 源文件；本 skill 侧重在 references 中给出可直接复用的范例。

## references 索引

根据上下文按需加载对应参考文档：

| 主题 | 参考文件 | 何时加载 |
|------|----------|----------|
| Eloquent ORM | `references/eloquent.md` | 模型、关系、作用域、查询优化、自定义 cast、事件与 observer |
| 路由与 API | `references/routing.md` | 路由模式、控制器、FormRequest 校验、API Resource、中间件、限流、版本与 CORS |
| 队列系统 | `references/queues.md` | Job 模式、分发、链式、批处理、限流、唯一 Job、失败处理、Horizon 与 worker 运维 |
| Livewire | `references/livewire.md` | 组件、`wire:model`、表单与上传、实时校验、事件、轮询与性能优化 |
| 测试 | `references/testing.md` | Feature/Unit 测试、Pest、Factory、Mock（Http/Event/Queue/Notification/Storage）、数据库与 API 测试、Sanctum 鉴权测试 |

## 校验检查点

在每一步用下列命令确认正确性后再继续：

| 阶段 | 命令 | 预期结果 |
|------|------|----------|
| 迁移后 | `php artisan migrate:status` | 所有迁移显示 `Ran` |
| 路由后 | `php artisan route:list --path=api` | 新路由以正确动词出现 |
| 派发 Job 后 | `php artisan queue:work --once` | Job 处理无异常 |
| 实现完成后 | `php artisan test --coverage` | 覆盖率 >85%，0 失败 |
| 提 PR 前 | `./vendor/bin/pint --test` | PSR-12 lint 通过 |

## 知识范围

Laravel 10+、Eloquent ORM、PHP 8.2+、API Resource、Sanctum/Passport、队列、Horizon、Livewire、Inertia、Octane、Pest/PHPUnit、Redis、广播、事件/监听器、通知、任务调度。
