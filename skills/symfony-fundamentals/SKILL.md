---
name: symfony-fundamentals
description: Symfony 组件化开发基础，含 Service Container、Bundle、Doctrine 与配置环境。
category: framework
language: php
source: github.com/Jeffallan/claude-skills
---

# Symfony 组件化开发基础

本 skill 面向 Symfony 7+ 与 PHP 8.3+ 的组件化开发，覆盖 Service Container 与依赖注入、Bundle 与配置环境、Doctrine ORM、事件系统、Console 命令、Voter 鉴权与 Messenger 异步消息。Symfony 的核心思想是"一切皆服务、由容器装配、按环境配置、用 attribute 声明路由与约束"。

## 核心思想

- **Service Container**：所有对象都是服务，通过构造函数注入装配，`services.yaml` 用 autowire/autoconfigure 自动注册。
- **Bundle / 组件复用**：Symfony 把功能拆成可独立复用的组件（HttpFoundation、Console、Messenger、Validator…），一个应用就是一组组件与 Bundle 的组合。
- **配置环境**：`.env` + `config/packages/<env>/` 按环境（dev/prod/test）覆盖参数，配置本身是 PHP/YAML。
- **Doctrine**：实体 + 映射 + Repository 抽象数据访问，em（EntityManager）由容器注入。
- **Attribute 驱动**：路由、约束、鉴权、消息处理器全部用 PHP 8 attribute 声明，而非注解字符串。

## 核心工作流

1. **分析架构** — 确认 Symfony 版本、已装 Bundle、PHP 版本与依赖。
2. **设计领域** — 创建类型化实体、DTO、值对象（Doctrine 映射 + Validator 约束）。
3. **实现服务** — 写 Service / Repository，构造函数注入依赖，遵循 PSR-12 与 strict types。
4. **暴露接口** — 用 `#[Route]` + `#[MapRequestPayload]` + `#[IsGranted]` 声明控制器。
5. **验证** — 跑 `php bin/console cache:clear`、PHPStan level 9、PHPUnit；通过后再交付。

## 约束

### 必须做
- 声明 `declare(strict_types=1)`，所有属性/参数/返回值加类型。
- 用构造函数注入 + autowire，避免 `Container::get()` / service locator 滥用。
- 控制器只做编排：解析请求、调 service、返回 Response，业务逻辑放 Service。
- 用 attribute 声明路由、约束、鉴权（Symfony 7 默认）。
- 实体保持贫血，业务规则放 Service。
- 用 Voter 做细粒度授权，用 Firewall / 角色做粗粒度。
- 按环境管理配置，敏感值放 `.env.local`（不入库）。
- 长任务走 Messenger，不要在请求生命周期内同步阻塞。

### 禁止做
- 在控制器里写业务逻辑 / 直接操作 EntityManager 的持久化细节。
- 用 `$container->get(...)` 拉服务（破坏 DI、难以测试）。
- 把环境变量直接硬编码进服务（走 `param`/`env()` 绑定）。
- 在实体里注入服务或写副作用。
- 跳过 Voter 直接在控制器里 `if ($user->isAdmin())`。
- 忽略 `cache:clear` 与 `cache:warmup`（prod 必须预热）。

## 代码模板基线

每次完整实现应交付：类型化实体（Doctrine 映射）、Repository、Service、Controller（attribute 路由 + DTO 校验）、Voter（如有授权需求）、Console Command（如有 CLI 需求）、单元测试。

### 带校验的 DTO

```php
<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateUserRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Email]
        public string $email,

        #[Assert\NotBlank]
        #[Assert\Length(min: 8, max: 100)]
        public string $password,

        #[Assert\Choice(choices: ['admin', 'user', 'moderator'])]
        public string $role = 'user',
    ) {}
}
```

### Attribute 路由的控制器

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\CreateUserRequest;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users', name: 'api_users_')]
final class UserController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(
        #[MapRequestPayload] CreateUserRequest $request
    ): JsonResponse {
        $user = $this->userService->createUser(
            $request->email,
            $request->password
        );

        return $this->json($user, Response::HTTP_CREATED, [], [
            'groups' => ['user:read'],
        ]);
    }
}
```

## references 索引

| 主题 | 参考文件 | 何时加载 |
|------|----------|----------|
| Symfony 模式 | `references/symfony-patterns.md` | Service Container/DI、services.yaml、Controller + attribute、事件订阅器、Console、Voter、Messenger |
| Doctrine 与配置环境 | `references/doctrine-and-config.md` | 实体映射、Repository、迁移、EntityManager 事务、.env、环境覆盖、Bundle 配置与参数绑定 |

## 校验检查点

| 阶段 | 命令 | 预期结果 |
|------|------|----------|
| 改配置后 | `php bin/console cache:clear` | 缓存重建无错误 |
| prod 部署前 | `php bin/console cache:warmup --env=prod` | 预热成功 |
| Doctrine 映射 | `php bin/console doctrine:schema:validate` | 映射与 DB 一致 |
| 静态分析 | `vendor/bin/phpstan analyse --level=9` | 0 错误 |
| 测试 | `php bin/phpunit` | 全绿 |

## 知识范围

Symfony 7+、PHP 8.3+、Service Container、Bundle、Doctrine ORM、Migrations、Validator、Messenger、Console、Voter、Security/Firewall、Twig、Cache、Workflow、Serializer groups、`.env` 与多环境配置。
