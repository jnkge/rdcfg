---
name: fastapi-best-practices
description: FastAPI 现代 Web API 开发最佳实践，含类型注解、依赖注入与 Pydantic 校验。
category: framework
language: python
source: github.com/sanjeed5/awesome-cursor-rules-mdc
---

# FastAPI 最佳实践

本 skill 面向基于类型注解与 ASGI 的现代 Web API 开发，覆盖项目结构、依赖注入、Pydantic 数据校验、async 性能、安全防护与测试，帮助你在路由设计、业务编排、持久化与运维各环节做出符合社区共识的决策。完整英文细则见 references。

## 核心要点

- **按功能模块组织代码**：每个功能（如 `auth`、`posts`）独立成模块，内部含 `router.py`、`schemas.py`、`models.py`、`service.py`、`dependencies.py`、`exceptions.py`、`constants.py`，实现高内聚低耦合。
- **薄路由 + 厚 Service**：路由处理器只做请求/响应编排，业务逻辑下沉到 `service.py`；必要时用 Repository 模式抽象数据访问，便于替换与测试。
- **Pydantic 驱动校验**：所有请求体/查询参数用 Pydantic 模型声明类型、约束与自定义校验，配置走 `BaseSettings`，禁止硬编码。
- **善用依赖注入**：用 `Depends` 管理鉴权、授权、数据库会话等共享资源，优先基于接口注入以提升可测试性。
- **异步优先**：I/O 密集型操作用 `async`/`await`，切勿在 async 路由中执行阻塞 I/O；合理使用连接池、缓存与 gzip。
- **安全基线**：参数化查询防 SQL 注入、CORS 限定可信来源、敏感数据用 bcrypt/Argon2 哈希、HTTPS + HSTS + CSP。
- **全程测试**：单元测试隔离组件、集成测试覆盖端点、E2E 测试覆盖完整流程，用 `unittest.mock`/`pytest-mock` 打桩外部依赖。

## 参考指南

| 主题 | 参考文件 | 何时查阅 |
|------|---------|---------|
| 全部 FastAPI 最佳实践 | `references/fastapi.md` | 项目结构、目录约定、设计模式与反模式、性能与内存优化、安全防护、测试策略、工具链与 CI/CD、常见陷阱 |

`references/fastapi.md` 内含 7 大节：代码组织与结构、常用模式与反模式、性能优化、安全最佳实践、测试方法、常见陷阱与边缘情况、工具链与环境。遇到具体问题（如 N+1、阻塞 I/O、JWT/OAuth 选型、Docker 部署、GitHub Actions 配置）可直接检索对应小节。

## 约束

### 必做
- 采用功能模块化目录结构，每个模块自带 router/schemas/models/service/dependencies。
- 为所有函数参数与返回值添加类型注解；配置统一走 `BaseSettings` + 环境变量。
- 路由处理器保持精简，业务逻辑交给 Service 层。
- 用 Pydantic 模型校验所有外部输入；数据库访问优先用 ORM + 参数化查询。
- I/O 密集型端点用 `async`，并确保内部调用都是非阻塞的。
- 编写覆盖关键路径的单元 + 集成测试；用独立测试数据库。
- 用 `black`/`ruff` + pre-commit 保持风格统一。

### 禁止
- 在 async 路由中执行阻塞 I/O（会拖垮事件循环）。
- 把业务逻辑堆进路由处理器（fat route handler）。
- 在代码中硬编码配置值、密钥或连接串。
- 直接返回 Pydantic 对象（FastAPI 会多做一次转换，应返回 dict）。
- 忽略输入校验、跳过鉴权或使用裸 SQL 拼接。
- 放弃异常处理，任由未捕获异常把进程打挂。
