# Yii2 Behaviors

Behaviors are reusable units of behavior that can be attached to any `Component` instance (models,
controllers, application components, etc.). They let you mix methods and event handlers into a class
without modifying it, which is a clean alternative to multiple inheritance.

## Defining a Behavior

A behavior extends `yii\base\Behavior`. Declare the events it reacts to via `events()`, and add any
public method you want callable on the owner:

```php
namespace app\behaviors;

use yii\base\Behavior;
use yii\base\Event;

class TimestampBehavior extends Behavior
{
    public $createdAtAttribute = 'created_at';
    public $updatedAtAttribute = 'updated_at';

    // Events the behavior subscribes to on the owner.
    public function events()
    {
        return [
            \yii\db\ActiveRecord::EVENT_BEFORE_INSERT => 'beforeInsert',
            \yii\db\ActiveRecord::EVENT_BEFORE_UPDATE => 'beforeUpdate',
        ];
    }

    public function beforeInsert(Event $event)
    {
        $owner = $this->owner;
        $now = time();
        $owner->{$this->createdAtAttribute} = $now;
        $owner->{$this->updatedAtAttribute} = $now;
    }

    public function beforeUpdate(Event $event)
    {
        $this->owner->{$this->updatedAtAttribute} = time();
    }

    // A custom method callable on the owner as if it were defined there.
    public function touch()
    {
        $this->owner->{$this->updatedAtAttribute} = time();
        $this->owner->updateAttributes([$this->updatedAtAttribute]);
    }
}
```

## Attaching Behaviors

### Declaratively (via `behaviors()`)

Override `behaviors()` on any component. This is the most common pattern, especially for models:

```php
namespace app\models;

use yii\db\ActiveRecord;
use app\behaviors\TimestampBehavior as MyTimestampBehavior;

class Post extends ActiveRecord
{
    public function behaviors()
    {
        return [
            // anonymous, keyed by class
            MyTimestampBehavior::class,

            // named, allows later retrieval by name
            'timestamp' => [
                'class' => MyTimestampBehavior::class,
                'createdAtAttribute' => 'created',
                'updatedAtAttribute' => 'updated',
            ],
        ];
    }
}
```

### Imperatively at runtime

Attach or detach on any `Component` via `attachBehavior()` / `attachBehaviors()`:

```php
$post = new Post();
$post->attachBehavior('timestamp', MyTimestampBehavior::class);
$post->attachBehaviors([
    'timestamp' => MyTimestampBehavior::class,
    'another'   => AnotherBehavior::class,
]);

// remove by name
$post->detachBehavior('timestamp');

// or call a behavior method directly through the owner
$post->touch();
```

When a method is invoked on the owner, Yii first checks the owner's own methods, then walks its
behaviors; calling `$post->touch()` runs `TimestampBehavior::touch()` with `$this->owner` set to
`$post`.

## Built-in Behaviors

Yii2 bundles a set of behaviors for the most common model concerns. They all live under
`yii\behaviors\` (ActiveRecord-specific ones) and `yii\db\*`.

### TimestampBehavior

Sets `created_at` / `updated_at` automatically on insert and update:

```php
use yii\behaviors\TimestampBehavior;

public function behaviors()
{
    return [
        [
            'class' => TimestampBehavior::class,
            'attributes' => [
                ActiveRecord::EVENT_BEFORE_INSERT => ['created_at', 'updated_at'],
                ActiveRecord::EVENT_BEFORE_UPDATE => ['updated_at'],
            ],
            // If the columns are integer, the default (time()) is fine.
            // For datetime columns, supply a callable:
            'value' => function () { return date('Y-m-d H:i:s'); },
        ],
    ];
}
```

### BlameableBehavior

Sets `created_by` / `updated_by` to the current user id:

```php
use yii\behaviors\BlameableBehavior;

public function behaviors()
{
    return [
        [
            'class' => BlameableBehavior::class,
            'createdByAttribute' => 'created_by',
            'updatedByAttribute' => 'updated_by',
            'value' => function () {
                return Yii::$app->user ? Yii::$app->user->id : null;
            },
        ],
    ];
}
```

### SluggableBehavior

Generates a unique URL-friendly slug from one or more attributes:

```php
use yii\behaviors\SluggableBehavior;

public function behaviors()
{
    return [
        [
            'class' => SluggableBehavior::class,
            'attribute' => 'title',
            'slugAttribute' => 'slug',
            // generate unique slug, appending -2, -3, etc. on collision
            'ensureUnique' => true,
            'uniqueValidator' => ['targetClass' => Post::class],
            'immutable' => true,        // do not change slug once set
            'value' => null,            // null = use Inflector::slug()
        ],
    ];
}
```

### AttributeBehavior

Assigns a value to one or more attributes on a chosen event. Useful for any custom touch:

```php
use yii\behaviors\AttributeBehavior;

public function behaviors()
{
    return [
        [
            'class' => AttributeBehavior::class,
            'attributes' => [
                ActiveRecord::EVENT_BEFORE_INSERT => 'revision',
            ],
            'value' => function () {
                return 'r' . date('YmdHis');
            },
        ],
    ];
}
```

### AttributeTypecastBehavior

Keeps AR column values cast to their declared schema type (e.g. integer columns hold `int`, not
string) — useful when you populate models from arrays or JSON:

```php
use yii\behaviors\AttributeTypecastBehavior;

public function behaviors()
{
    return [
        'typecast' => [
            'class' => AttributeTypecastBehavior::class,
            'typecastAfterValidate' => true,
            'typecastBeforeSave'    => true,
            'typecastAfterFind'     => true,
        ],
    ];
}
```

## Event Binding Cheatsheet

| Behavior concern      | Event constant                                  |
|-----------------------|-------------------------------------------------|
| Before insert         | `ActiveRecord::EVENT_BEFORE_INSERT`             |
| After insert          | `ActiveRecord::EVENT_AFTER_INSERT`              |
| Before update         | `ActiveRecord::EVENT_BEFORE_UPDATE`             |
| After update          | `ActiveRecord::EVENT_AFTER_UPDATE`              |
| Before delete         | `ActiveRecord::EVENT_BEFORE_DELETE`             |
| After delete          | `ActiveRecord::EVENT_AFTER_DELETE`              |
| Model validation      | `Model::EVENT_BEFORE_VALIDATE` / `AFTER_*`      |

Behaviors subscribe to events declared in `events()`; the handler receives a `yii\base\Event` (or a
subclass like `yii\db\AfterSaveEvent`) whose `sender` is the owner.

## Pitfalls

- Behaviors only attach to objects extending `yii\base\Component`. Plain `yii\base\BaseObject`
  instances do not support behaviors.
- A method defined on the owner always shadows the same-named behavior method — there is no implicit
  fallthrough when the owner already has the method.
- When configuring behaviors declaratively, returning a fresh array on every `behaviors()` call is
  fine; Yii caches the merged result internally.
- For ActiveRecord, behavior attributes are not validated unless you list them in `rules()` or mark
  them `safe` for the relevant scenario.
