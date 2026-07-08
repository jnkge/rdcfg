---
name: yii2-development
description: Yii2 框架全栈开发最佳实践，含 ActiveRecord、MVC、RBAC、REST API 与 Gii 代码生成。
category: framework
language: php
source: github.com/codeChap/mcp-server-yii2-ai-boost
---

# Yii2 全栈开发最佳实践

本 skill 面向 Yii2 2.0.x（以 2.0.45 为基准）与 PHP 7.4+/8.x 的全栈开发，覆盖核心架构、ActiveRecord、迁移、控制器与路由、表单校验、视图与小组件、RBAC 鉴权、REST API、缓存、事件、依赖注入、控制台、队列、行为与 Gii 代码生成，帮助你在建模、Web 入口、安全、接口与质量保障各环节做出符合框架惯例的决策。

## 定位

Yii2 是高性能、组件化的全栈 PHP 框架，强约定在「应用配置（config/web.php、config/console.php）+ 组件（components）+ ActiveRecord + Gii 代码生成」这条主线上。所有功能都通过 `Yii::$app` 上的应用组件暴露；URL 既可走传统 `?r=` 也可走 `urlManager` 美化规则；安全（CSRF、SQL 参数绑定、XSS 转义）由框架默认开启。理解这条主线，就能把绝大多数需求落到正确的层。

## 核心工作流

1. **分析需求** — 识别涉及的模型、关系、控制器动作、REST 资源与权限点。
2. **设计架构** — 规划数据库 schema（`migrations/`）、Service/组件、URL 规则、RBAC 角色，并在 `config/` 中登记组件。
3. **生成骨架** — 用 Gii 生成 Model、CRUD、Controller 或 Module，避免手写样板代码；命令行 `./yii gii/...` 适合脚本化。
4. **实现业务** — 在 AR 模型中写 `rules()`、`relations()`、`behaviors()`；在控制器中编排动作、注入组件；REST 用 `ActiveController`。
5. **保障质量** — 用迁移校验 `./yii migrate/up`、用 `./yii` 列出命令、为关键路径写 Codeception/PHPUnit 测试，提交前确认 CSRF/参数绑定/XSS 转义到位。

## references 索引

根据上下文按需加载对应参考文档：

| 主题 | 参考文件 | 何时加载 |
|------|----------|----------|
| 框架总览 | `references/core-overview.md` | 目录结构、命名空间、控制器/模型/视图/组件骨架、安全与性能要点、反模式 |
| 应用配置 | `references/application-config.md` | `config/web.php`、`config/console.php`、bootstrap、组件装配、别名与 `params` |
| 控制器（Web） | `references/controllers.md` | `yii\web\Controller`、action、`behaviors()`、请求/响应、过滤器 |
| 控制台 | `references/console.md` | `yii\console\Controller`、`actionX`、参数、`ExitCode`、定时任务 |
| ActiveRecord | `references/active-record.md` | `tableName`、`rules`、`hasOne/hasMany`、CRUD、查询构造、eager loading |
| 迁移 | `references/migration.md` | `Migration` 类、`createTable`、字段类型、`safeUp/safeDown` |
| 校验 | `references/validation.md` | 内置校验器、`rules()`、`scenarios()`、自定义校验器、AJAX 校验 |
| 视图 | `references/views.md` | `render`/`renderPartial`、布局、`Html` 转义、`ActiveForm`、`ListView`、AssetBundle |
| URL 管理与路由 | `references/url-manager.md` | `enablePrettyUrl`、URL 规则、`Url::to()`、`GroupUrlRule`、REST URL 规则 |
| 鉴权与 RBAC | `references/auth-and-rbac.md` | `Yii::$app->user`、`AccessControl`、`DbManager`、角色/权限/规则 |
| REST API | `references/rest-api.md` | `ActiveController`、`fields()`、内容协商、HttpBasic/Bearer/QueryParam 认证、限流、版本化、错误处理 |
| 缓存 | `references/cache.md` | `yii\caching\Cache`、`getOrSet`、查询缓存、依赖、片段/页面缓存 |
| 事件 | `references/events.md` | `on`/`off`、`trigger`、事件常量、全局事件、类级事件 |
| 依赖注入 | `references/dependency-injection.md` | `Yii::$container`、`set/setSingleton`、Service Locator、构造/属性/方法注入 |
| 行为 | `references/behaviors.md` | `Behavior` 类、`events()`、`attachBehavior`、Timestamp/Blameable/Sluggable/Attribute |
| 日志 | `references/logging.md` | `Logger`、targets、级别、`Yii::info/error`、性能分析 |
| 辅助类 | `references/helpers.md` | `ArrayHelper`、`Html`、`Url`、`StringHelper`、`FileHelper` |
| 国际化 | `references/i18n.md` | `Yii::t`、消息源、`php`/`db`、区域、格式化 |
| 邮件 | `references/mailer.md` | `yii\swiftmailer\Mailer`、`compose`/`send`、模板、附件 |
| 互斥锁 | `references/mutex.md` | `Mutex` 组件、`acquire/release`、防止并发竞争 |
| 队列 | `references/queue.md` | `yii\queue`、Job、push/run worker、重试与失败 |
| Gii 代码生成 | `references/gii.md` | 配置、Model/CRUD/Controller/Module/Extension 生成器、命令行用法、自定义模板 |
| 扩展 | `references/extensions.md` | Composer 包、`yii2-extension` 类型、别名、注册组件 |

## 约束

### 必须做
- 通过模型 `rules()` 校验所有外部输入，再 `validate()` + `save()`。
- 用参数绑定查询数据库（`where(['col' => $val])`、`User::findOne($id)`），杜绝字符串拼接 SQL。
- 输出时一律 `Html::encode()` 富文本用 `HtmlPurifier::process()`，避免 XSS。
- 列表查询用 `with()` 做 eager loading，避免 N+1。
- 在 `behaviors()` 中声明过滤器（`VerbFilter`、`AccessControl`）和模型行为（Timestamp、Blameable）。
- 把可配置值放进 `Yii::$app->params`，不要硬编码。
- 在 `config/` 中登记自定义组件，用 `Yii::$app->xxx` 或 DI 容器访问，避免 `new` 散落。
- 优先用 Gii 生成骨架再改造，而不是手写样板。
- REST 控制器禁用 cookie/session，使用 `HttpBearerAuth`/`QueryParamAuth` 等无状态认证。
- 保持控制器薄、业务下沉到模型/Service/组件。

### 禁止做
- 字符串拼接 SQL（SQL 注入风险）。
- 在视图中写业务逻辑或直接查询数据库。
- 在控制器中 `echo`/`print`；必须 `return` 响应或 `render` 视图。
- 漏掉 `with()` 导致 N+1。
- 明文存储密码/敏感数据（密码用 `password_hash`/`password_verify` 或 `yii\base\Security`）。
- 跳过 `rules()` 直接 `save()`。
- 在生产环境开启 Gii 或 `YII_DEBUG`。
- 在控制台任务中假设有 `Yii::$app->user`（控制台无会话）。
- 修改框架 vendor 目录下的文件（用 behavior/event 扩展，而非改核心）。
- 硬编码数据库连接、缓存等配置。

## 校验检查点

在每一步用下列命令确认正确性后再继续：

| 阶段 | 命令 | 预期结果 |
|------|------|----------|
| 写完迁移 | `./yii migrate/up` | 迁移应用、表结构正确 |
| 路由/URL | 浏览器或 `curl` 访问美化 URL | 命中正确控制器/动作，无 404 |
| 生成代码后 | `./yii gii/... --interactive=0` 预览 | 文件落盘且可访问 |
| 模型校验 | `$model->validate()` 单测 | 校验规则按预期触发 |
| RBAC | `Yii::$app->user->can('perm')` | 返回布尔与预期一致 |
| REST 接口 | `curl -H "Accept: application/json" /resource` | 返回 JSON、状态码正确、含 `X-Pagination-*` 头 |
| 提交前 | `./vendor/bin/phpcs`（PSR-12）或项目 lint | 0 错误 |

## 知识范围

Yii2 2.0.45、PHP 7.4+/8.x、ActiveRecord、MVC、`urlManager` 与美化 URL、Form 模型与 `rules()`、`ActiveForm`、AssetBundle、`AccessControl`/RBAC（`DbManager`）、`yii\rest\ActiveController`、缓存（`yii\caching`）、事件、DI 容器、行为（Timestamp/Blameable/Sluggable/Attribute）、日志、互斥锁、`yii\queue`、Gii 生成器、i18n、SwiftMailer、Codeception/PHPUnit。
