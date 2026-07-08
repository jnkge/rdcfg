# PSR Standards & Composer

This reference consolidates the PHP-FIG coding standards (PSR-1, PSR-12) and the PSR-4
autoloading standard together with the Composer workflow that enforces them. Treat every
snippet below as the baseline for any new PHP project.

## PSR-1 — Basic Coding Standard

PSR-1 is the mandatory baseline. Files MUST:

- Use only `<?php` and `<?=]]>` tags.
- Use only UTF-8 (without BOM).
- Not produce side effects (output, changing ini settings, requiring files) AND declare
  things (classes, functions, constants) in the same file. Pick one.
- Namespaces and classes MUST follow PSR-4 autoloading.
- Class names are in `StudlyCaps` (a.k.a. `PascalCase`).
- Class constants are all upper case with underscores (`MAX_CONNECTIONS`).
- Method names are in `camelCase`.

```php
<?php
// GOOD — declaration only, no side effects
declare(strict_types=1);

namespace App\Domain\User;

final class UserRepository
{
    public const MAX_RESULTS = 100;

    public function findByEmail(string $email): ?User
    {
        // ...
    }
}
```

```php
<?php
// BAD — mixing side effects with declarations
namespace App\Domain;

require_once 'legacy.php';     // side effect
ini_set('display_errors', '1'); // side effect

class UserService { }          // declaration — violates PSR-1
```

## PSR-12 — Extended Coding Style

PSR-12 builds on PSR-1 and is the de-facto style enforced by PHP-CS-Fixer and Laravel Pint.
Key rules:

- Files MUST end with a single blank line.
- The closing `?>` tag MUST be omitted in files containing only PHP.
- Files MUST use only Unix LF line endings.
- Code MUST use an indent of 4 spaces, never tabs.
- All PHP files MUST use the long `<?php` tag and include `declare(strict_types=1)`.
- The `extends` and `implements` keywords go on the same line as the class name; long lists
  may be split with one interface per line, indented once.
- `final`, `abstract` and `readonly` modifiers go before visibility (`final public`).
- Type declarations come BEFORE the `&` for return-by-reference; nullable `?` attaches to
  the type; the `...` for variadic parameters comes AFTER the type.

```php
<?php

declare(strict_types=1);

namespace App\Domain\User;

use App\Entity\User;
use App\Repository\UserRepositoryInterface;
use Psr\Log\LoggerInterface;

final readonly class UserService
{
    public function __construct(
        private UserRepositoryInterface $users,
        private LoggerInterface $logger,
    ) {}

    /**
     * @param string[] $emails
     */
    public function notify(array $emails, string &$reference, ?int $retry = null): bool
    {
        foreach ($emails as $email) {
            // ...
        }

        return true;
    }
}
```

### Abstract / Final / Visibility ordering

```php
abstract class BaseModel
{
    abstract public function find(int $id): ?self;

    final public function exists(int $id): bool
    {
        return $this->find($id) !== null;
    }

    protected static function boot(): void
    {
    }
}
```

### Multi-line constructor arguments

When the argument list wraps, open the `(` on the declaration line, one argument per line
indented once, and close on its own line:

```php
final class Mailer
{
    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly ?string $apiKey = null,
    ) {}
}
```

### Match, control structures, and closures

PSR-12 requires braces on their own line for classes and functions, but control structures
(`if`, `for`, `while`) keep the opening brace on the same line. Closures put a space after
the `function` keyword and around `use`.

```php
$active = array_filter(
    $users,
    function (User $user) use ($threshold): bool {
        return $user->isActive() && $user->score() > $threshold;
    },
);

$status = match (true) {
    $score >= 90 => 'A',
    $score >= 80 => 'B',
    default      => 'C',
};
```

## PSR-4 — Autoloading Standard

PSR-4 maps a fully qualified class name to a filesystem path. The terminator of a
namespace prefix is `\\`, and the contiguous sub-namespace after the prefix maps directly
to a subdirectory. The class name maps to a file name ending in `.php`.

### composer.json autoload block

```json
{
    "name": "acme/shop",
    "type": "project",
    "require": {
        "php": ">=8.3"
    },
    "autoload": {
        "psr-4": {
            "Acme\\Shop\\": "src/",
            "Acme\\Shop\\Tests\\": "tests/"
        },
        "files": [
            "src/functions.php"
        ],
        "classmap": [
            "legacy/classes"
        ]
    },
    "autoload-dev": {
        "psr-4": {
            "Acme\\Shop\\Tests\\": "tests/"
        }
    }
}
```

Mapping result:

- `Acme\Shop\Domain\User\UserService` => `src/Domain/User/UserService.php`
- `Acme\Shop\Tests\Service\UserServiceTest` => `tests/Service/UserServiceTest.php`

> Class name and file name (including case) MUST match. On case-insensitive filesystems
> (Windows / macOS default) a mismatch appears to work locally and breaks on Linux CI.

### Re-dumping the autoloader

```bash
# After changing composer.json autoload section
composer dump-autoload

# Optimised autoloader for production (classmap conversion)
composer dump-autoload --optimize --classmap-authoritative

# During development — quick and forgiving
composer dump-autoload
```

## Composer workflow

### Version constraints

```json
{
    "require": {
        "php": "^8.3",
        "laravel/framework": "^11.0",
        "symfony/console": "^7.0",
        "doctrine/orm": "^3.0",
        "psr/log": "^3.0"
    },
    "require-dev": {
        "phpstan/phpstan": "^1.11",
        "phpunit/phpunit": "^11.0",
        "pestphp/pest": "^3.0",
        "laravel/pint": "^1.15"
    }
}
```

Constraint grammar:

- `^1.2.3` — caret: compatible up to `2.0.0` (semver, keeps the major).
- `~1.2.3` — tilde: compatible up to `1.3.0` (allows patch+minor).
- `1.2.3` — exact pin (only `1.2.3`).
- `>=1.2 <2.0` — range operators.
- `dev-main` — development branch (alias `@dev`, `dev-main#abc123` for a commit).
- `*` — any version (avoid in production requirements).

### Scripts

```json
{
    "scripts": {
        "test": "phpunit",
        "test:pest": "pest",
        "analyse": "phpstan analyse --level=9",
        "lint": "pint --test",
        "check": [
            "@lint",
            "@analyse",
            "@test"
        ]
    },
    "scripts-descriptions": {
        "check": "Run the full quality gate: lint + static analysis + tests"
    }
}
```

Run with `composer check`; pass extra args with `--`: `composer test -- --filter=UserService`.

## PSR-12 enforcement tooling

### Laravel Pint (PHP-CS-Fixer wrapper)

```php
// pint.json
{
    "preset": "psr12",
    "rules": {
        "declare_strict_types": true,
        "ordered_imports": { "sort_algorithm": "alpha" },
        "single_quote": true,
        "no_unused_imports": true,
        "final_class": true,
        "final_internal_class": true
    }
}
```

```bash
vendor/bin/pint                  # fix in place
vendor/bin/pint --test           # check only (CI mode)
vendor/bin/pint --dirty          # only changed files
```

### PHP-CS-Fixer (standalone)

```php
// .php-cs-fixer.dist.php
<?php

$finder = (new PhpCsFixer\Finder())
    ->in(__DIR__ . '/src')
    ->in(__DIR__ . '/tests')
    ->exclude('var');

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12'                      => true,
        '@PHP83Migration'             => true,
        'declare_strict_types'        => true,
        'strict_param'                => true,
        'strict_comparison'           => true,
        'native_function_invocation'  => ['include' => ['@all']],
        'no_unused_imports'           => true,
    ])
    ->setFinder($finder);
```

## PER-CS — PER Coding Style

PER-CS (PER-2.x at time of writing) is the successor to PSR-12 maintained by the PHP-FIG
PER group. It evolves the style guide in minor versions. PHP-CS-Fixer presets map directly:

- `@PER-CS` / `@PER-CS2.0` — latest PER-CS.
- `@PSR12` — the original frozen PSR-12.

New projects SHOULD target `@PER-CS`; legacy projects often stay on `@PSR12` for stability.
Both are PSR-12-compatible at the time of migration.

## Project layout baseline

A PSR-4-compliant application generally looks like:

```
my-app/
├── composer.json
├── composer.lock
├── phpunit.xml
├── phpstan.neon
├── pint.json
├── src/
│   ├── Controller/
│   ├── Domain/
│   │   └── User/
│   ├── Service/
│   ├── Repository/
│   └── Kernel.php
├── tests/
│   ├── Unit/
│   └── Feature/
└── var/          # cache, logs (gitignored)
```

The `Acme\Shop\` prefix in `autoload.psr-4` maps to `src/`, so every sub-namespace under
`Acme\Shop\` corresponds to a subdirectory of `src/`.

## Quick reference

| Standard | Scope | Tool |
|----------|-------|------|
| PSR-1    | Basic coding rules (tags, naming, side effects) | Manual / linters |
| PSR-12   | Code style (indent, braces, types) | Pint, PHP-CS-Fixer `@PSR12` |
| PER-CS   | Living successor of PSR-12 | PHP-CS-Fixer `@PER-CS` |
| PSR-4    | Class-to-file autoloading | Composer `dump-autoload` |
| PSR-3    | Logger interface | `psr/log` |
| PSR-11   | Container interface | `psr/container` |
| PSR-7/15/17 | HTTP messages, middleware, factories | `guzzlehttp/psr7`, etc. |

| Composer command | Purpose |
|------------------|---------|
| `composer install` | Install from `composer.lock` (reproducible) |
| `composer update` | Resolve latest versions into lock |
| `composer require pkg` | Add a production dependency |
| `composer require --dev pkg` | Add a dev dependency |
| `composer dump-autoload` | Regenerate the autoloader |
| `composer outdated` | List packages with newer releases |
| `composer audit` | Security advisories check |
| `composer check-platform-reqs` | Verify PHP extensions |
