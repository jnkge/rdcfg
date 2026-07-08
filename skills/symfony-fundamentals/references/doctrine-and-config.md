# Doctrine ORM, Bundles & Configuration

This reference complements `symfony-patterns.md` with Doctrine ORM entity mapping,
repositories, migrations, transaction management, and Symfony's environment-driven
configuration system (`.env`, `config/packages/<env>/`, parameters, bundles).

## Doctrine Entity with PHP 8 Attributes

Entities are plain PHP objects; Doctrine reads their attributes for mapping. Keep them
anemic — put business rules in services.

```php
<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
final class User
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private Uuid $id;

    #[ORM\Column(type: 'string', length: 180, unique: true)]
    private string $email;

    #[ORM\Column(type: 'string')]
    private string $password;

    #[ORM\Column(type: 'string', length: 20)]
    private string $status = 'active';

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: Post::class, orphanRemoval: true)]
    private \Doctrine\Common\Collections\Collection $posts;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->posts = new \Doctrine\Common\Collections\ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): self
    {
        $this->password = $password;
        return $this;
    }

    /**
     * @return \Doctrine\Common\Collections\Collection<int, Post>
     */
    public function getPosts(): \Doctrine\Common\Collections\Collection
    {
        return $this->posts;
    }

    public function addPost(Post $post): self
    {
        if (!$this->posts->contains($post)) {
            $this->posts->add($post);
            $post->setAuthor($this);
        }
        return $this;
    }
}
```

### Lifecycle callbacks

```php
#[ORM\PrePersist]
public function setCreatedAtValue(): void
{
    $this->createdAt = new \DateTimeImmutable();
}

#[ORM\PreUpdate]
public function setUpdatedAtValue(): void
{
    $this->updatedAt = new \DateTimeImmutable();
}
```

### Enums as columns (PHP 8.1+ / Doctrine 2.11+)

```php
enum UserStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
}

// In the entity
#[ORM\Column(enumType: UserStatus::class)]
private UserStatus $status = UserStatus::Active;

// Reading is type-safe: $user->status === UserStatus::Active
```

## Repository

```php
<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use App\Entity\UserStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 *
 * @method User|null find($id, $lockMode = null, $lockVersion = null)
 * @method User|null findOneBy(array $criteria, array $orderBy = null)
 * @method User[]    findAll()
 * @method User[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
final class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function save(User $user, bool $flush = false): void
    {
        $this->getEntityManager()->persist($user);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(User $user, bool $flush = false): void
    {
        $this->getEntityManager()->remove($user);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return User[]
     */
    public function findActive(): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.status = :status')
            ->setParameter('status', UserStatus::Active)
            ->orderBy('u.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByEmail(string $email): ?User
    {
        return $this->createQueryBuilder('u')
            ->where('u.email = :email')
            ->setParameter('email', $email)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
```

Bind the interface if you abstract behind one (see `symfony-patterns.md` services.yaml):

```yaml
# config/services.yaml
services:
    App\Repository\UserRepositoryInterface:
        class: App\Repository\UserRepository
```

## Migrations

```bash
# Inspect the diff between entities and the schema
php bin/console doctrine:schema:validate

# Generate a migration from the current mapping diff
php bin/console doctrine:migrations:diff

# Apply pending migrations
php bin/console doctrine:migrations:migrate

# Roll back the most recent migration
php bin/console doctrine:migrations:migrate prev

# Show current / available versions
php bin/console doctrine:migrations:status

# Execute a specific version (up or down)
php bin/console doctrine:migrations:execute --up 'App\Migrations\Version20240101000000'
```

A generated migration is a normal class you can edit:

```php
<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240101000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create users table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE users (
            id CHAR(36) NOT NULL,
            email VARCHAR(180) NOT NULL,
            password VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E9E7927C74 ON users (email)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE users');
    }
}
```

> Migrations MUST be idempotent-safe: never use `DROP` without a down(), and keep them
> reviewable before running in prod.

## EntityManager & Transactions

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

final readonly class RegistrationService
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $users,
    ) {}

    public function register(string $email, string $password): User
    {
        // Transactional closure: commits on return, rolls back on throw.
        return $this->em->wrapInTransaction(function () use ($email, $password): User {
            $user = new User();
            $user->setEmail($email)
                 ->setPassword(password_hash($password, PASSWORD_ARGON2ID));

            $this->users->save($user, flush: true);

            return $user;
        });
    }
}
```

Manual transaction control with pessimistic locking:

```php
$this->em->beginTransaction();
try {
    $account = $this->em->getRepository(Account::class)
        ->find($id, lockMode: LockMode::PESSIMISTIC_WRITE);

    $account->withdraw($amount);
    $this->em->flush();
    $this->em->commit();
} catch (\Throwable $e) {
    $this->em->rollback();
    throw $e;
}
```

## Querying with DQL and the QueryBuilder

```php
// DQL
$q = $this->em->createQuery(
    'SELECT u FROM App\Entity\User u WHERE u.status = :status ORDER BY u.createdAt DESC'
);
$q->setParameter('status', UserStatus::Active);
$users = $q->getResult();

// Paginator for list endpoints
use Doctrine\ORM\Tools\Pagination\Paginator;

$qb = $this->createQueryBuilder('u')
    ->where('u.status = :status')
    ->setParameter('status', UserStatus::Active)
    ->setFirstResult(($page - 1) * $limit)
    ->setMaxResults($limit);

$paginator = new Paginator($qb);
$total = count($paginator);
$items = iterator_to_array($paginator);
```

## Environment configuration

Symfony loads `.env` at boot, then layers environment-specific files. Precedence (highest
wins): real env vars > `.env.local` > `.env.<APP_ENV>.local` > `.env.<APP_ENV>` > `.env`.

```dotenv
# .env
APP_ENV=dev
APP_SECRET=changeme-in-production
DATABASE_URL="postgresql://app:!ChangeMe!@127.0.0.1:5432/app?serverVersion=15&charset=utf8"
MESSENGER_TRANSPORT_DSN=doctrine://default
MAILER_DSN=null://null
```

```dotenv
# .env.local  (gitignored; developer/machine specific overrides)
DATABASE_URL="postgresql://me:secret@127.0.0.1:5432/my_local_db"
```

```dotenv
# .env.prod.local  (gitignored; production secrets)
APP_SECRET=a-long-random-string
MAILER_DSN=smtp://user:pass@smtp.example.com:587
```

> Never commit `.env.local` or any `.env.*.local`. Commit `.env`, `.env.test`,
> `.env.dev`, `.env.prod`. Real production secrets belong in real environment variables.

## Environment-specific config (config/packages/<env>/)

`config/packages/` holds framework configuration per environment. A file under
`config/packages/dev/` overrides the same key for the `dev` environment.

```
config/
├── packages/
│   ├── doctrine.yaml          # applies to all envs
│   ├── framework.yaml
│   ├── routing.yaml
│   ├── dev/
│   │   └── monolog.yaml       # dev-only logging (debug handler)
│   ├── prod/
│   │   ├── monolog.yaml       # prod-only logging (stream/errors)
│   │   └── routing.yaml       # prod: error_controller disabled
│   └── test/
│       └── framework.yaml     # test: test=true, session mock
├── routes/
│   └── attributes.yaml        # loads PHP attributes for controllers
├── bundles.php                # which bundles are enabled per env
├── services.yaml              # service container defaults
└── preload.php
```

Example prod monolog that emails critical errors:

```yaml
# config/packages/prod/monolog.yaml
monolog:
    handlers:
        main:
            type: fingers_crossed
            action_level: error
            handler: nested
            excluded_http_codes: [403, 404, 405]
            buffer_size: 50
        nested:
            type: stream
            path: php://stderr
            level: debug
            formatter: monolog.formatter.json
        console:
            type: console
            process_psr_3_messages: false
            channels: ['!event', '!doctrine']
```

## Parameters & env() bindings

Parameters are resolved at compile time; `env()` reads environment variables lazily.
Combine with `resolve()` for indirection.

```yaml
# config/services.yaml
parameters:
    app.supported_locales: ['en', 'fr', 'de']
    app.upload_dir: '%kernel.project_dir%/var/uploads'
    app.cache_ttl: '%env(int:default:300:resolve:CACHE_TTL)%'

services:
    _defaults:
        bind:
            string $uploadDir: '%app.upload_dir%'
            array $supportedLocales: '%app.supported_locales%'

    App\Service\FileUploader:
        arguments:
            $targetDirectory: '%app.upload_dir%'
```

Injecting the parameter into a service:

```php
final readonly class FileUploader
{
    public function __construct(
        private string $targetDirectory,
    ) {}
}
```

## Bundles

A Bundle is a packaged feature (config + services + controllers + entities). Enable it in
`config/bundles.php`. Third-party bundles ship their own `Resources/config/`.

```php
<?php
// config/bundles.php
return [
    Symfony\Bundle\FrameworkBundle\FrameworkBundle::class => ['all' => true],
    Symfony\Bundle\TwigBundle\TwigBundle::class => ['all' => true],
    Symfony\Bundle\SecurityBundle\SecurityBundle::class => ['all' => true],
    Doctrine\Bundle\DoctrineBundle\DoctrineBundle::class => ['all' => true],
    Symfony\Bundle\MakerBundle\MakerBundle::class => ['dev' => true],
    Symfony\Bundle\WebProfilerBundle\WebProfilerBundle::class => ['dev' => true, 'test' => true],
];
```

Publish bundle assets / install assets (copies or symlinks `public/bundles/`):

```bash
php bin/console assets:install --symlink --relative
```

## Cache management

```bash
# Clear and rebuild the container cache for the current env
php bin/console cache:clear

# Warm up (REQUIRED before prod serves traffic; prod uses a compiled container)
php bin/console cache:warmup --env=prod

# Clear a specific pool
php bin/console cache:pool:clear cache.app
```

## Quick reference

| Area | Command / Location |
|------|--------------------|
| Validate mapping vs schema | `php bin/console doctrine:schema:validate` |
| Generate migration | `php bin/console doctrine:migrations:diff` |
| Run migrations | `php bin/console doctrine:migrations:migrate` |
| List routes | `php bin/console debug:router` |
| List services / params | `php bin/console debug:container`, `debug:container --env-vars` |
| List autowirable ids | `php bin/console debug:autowiring` |
| Clear cache | `php bin/console cache:clear` |
| Bundle registry | `config/bundles.php` |
| Per-env config | `config/packages/<env>/*.yaml` |
| Service defaults | `config/services.yaml` |
| Env file precedence | real env > `.env.local` > `.env.<ENV>.local` > `.env.<ENV>` > `.env` |
