---
name: php-psr-coding-standards
description: PHP-FIG 规范与 Composer 工程基础，含 PSR-1/12/4 自动加载与编码规范。
category: design
language: php
source: github.com/Jeffallan/claude-skills
---

# PHP PSR 编码规范与 Composer 工程基础

本 skill 面向现代 PHP 8.3+ 工程化开发，聚焦 PHP-FIG 规范（PSR-1 基础编码、PSR-12 编码风格、PSR-4 自动加载）、Composer 依赖与 autoloader，以及配套的现代语言特性与质量保障手段（PHPStan level 9、PHPUnit/Pest）。目标是让任何 PHP 项目在编码风格、命名空间映射、依赖管理与静态分析层面都符合社区共识。

## 核心工作流

1. **分析架构** — 确认 PHP 版本、框架、依赖与既有模式。
2. **设计模型** — 创建带类型的领域模型、值对象、DTO。
3. **实现** — 编写 `declare(strict_types=1)`、全类型声明、PSR-12 风格的代码，配合 DI 与仓储。
4. **加固** — 加入输入校验、鉴权、XSS/SQL 注入防护。
5. **验证** — 先跑 `vendor/bin/phpstan analyse --level=9`，全部通过后再继续；再跑 `vendor/bin/phpunit` 或 `vendor/bin/pest`，覆盖率 ≥80%。两者都干净才算交付。

## 约束

### 必须做
- 声明严格类型 `declare(strict_types=1)`。
- 为所有属性、参数、返回值加类型声明。
- 遵循 PSR-12 编码规范。
- 交付前跑 PHPStan level 9。
- 适用处使用 readonly 属性。
- 复杂逻辑补 PHPDoc。
- 用类型化请求校验所有用户输入。
- 用依赖注入，避免全局状态。

### 禁止做
- 漏掉类型声明（不要用 mixed）。
- 明文存储密码（用 bcrypt/argon2）。
- 写有注入风险的 SQL。
- 在控制器里混业务逻辑。
- 硬编码配置（用 .env）。
- 没跑测试和静态分析就交付。
- 在生产代码里用 var_dump。

## PSR-4 自动加载要点

PSR-4 把命名空间映射到文件路径。`composer.json` 中 `autoload.psr-4` 的键是命名空间前缀，值是相对于项目根的源码目录：

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "src/",
            "Tests\\": "tests/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    }
}
```

修改 autoload 配置后必须执行 `composer dump-autoload`。类 `App\Domain\User\UserService` 对应文件 `src/Domain/User/UserService.php`，类名与文件名（含大小写）必须一致。

## 编码模板

每次完整实现应交付：一个类型化实体/DTO、一个 Service 类、一个测试。基线结构如下。

### Readonly DTO / 值对象

```php
<?php

declare(strict_types=1);

namespace App\DTO;

final readonly class CreateUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
        );
    }
}
```

### 构造函数注入的 Service

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\DTO\CreateUserDTO;
use App\Models\User;
use App\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;

final class UserService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    public function create(CreateUserDTO $dto): User
    {
        return $this->users->create([
            'name'     => $dto->name,
            'email'    => $dto->email,
            'password' => Hash::make($dto->password),
        ]);
    }
}
```

### 枚举（PHP 8.1+）

```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum UserStatus: string
{
    case Active   = 'active';
    case Inactive = 'inactive';
    case Banned   = 'banned';

    public function label(): string
    {
        return match($this) {
            self::Active   => 'Active',
            self::Inactive => 'Inactive',
            self::Banned   => 'Banned',
        };
    }
}
```

## 输出顺序

实现一个功能时按此顺序交付：
1. 领域模型（实体、值对象、枚举）
2. Service/Repository 类
3. Controller/API 端点
4. 测试文件（PHPUnit/Pest）
5. 架构决策的简要说明

## references 索引

| 主题 | 参考文件 | 何时加载 |
|------|----------|----------|
| PSR 规范与 Composer | `references/psr-and-composer.md` | PSR-1/12 编码风格、PSR-4 自动加载映射、composer.json 配置、脚本与版本约束 |
| 现代 PHP 特性 | `references/modern-php-features.md` | strict types、enum、readonly、attributes、first-class callable、match、Fibers、never 类型 |
| 测试与质量 | `references/testing-quality.md` | PHPUnit/Pest、Data Provider、PHPStan level 9 配置、Mockery、覆盖率与 CI 工具链 |

## 校验检查点

| 阶段 | 命令 | 预期结果 |
|------|------|----------|
| 改 autoload 后 | `composer dump-autoload` | 无错误，类可被解析 |
| 静态分析 | `vendor/bin/phpstan analyse --level=9` | 0 错误 |
| 测试 | `vendor/bin/phpunit` / `vendor/bin/pest` | 全绿，覆盖率 ≥80% |
| 风格 | `vendor/bin/php-cs-fixer fix` 或 `vendor/bin/pint` | PSR-12 通过 |

## 知识范围

PHP 8.3+、PSR-1/12/4、PER-CS、Composer、PHPStan、Psalm、PHPUnit、Pest、Xdebug、PHP-CS-Fixer、Laravel/Symfony 框架基线。
