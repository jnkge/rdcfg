# Yii2 URL Manager & Routing

The `urlManager` application component is responsible for both parsing incoming requests into route
parameters and creating URLs from routes. It is configured under the `components` key of the
application configuration (`config/web.php`).

## Basic Configuration

```php
// config/web.php
'components' => [
    'urlManager' => [
        'enablePrettyUrl' => true,     // drop index.php?r=...
        'showScriptName' => false,     // hide index.php in output URLs
        'enableStrictParsing' => false, // when true, only declared rules match
        'cache' => 'cache',            // cache parsed rules for performance
        'rules' => [
            // rules listed here
        ],
    ],
],
```

To make `showScriptName => false` actually work you must also rewrite requests to `web/index.php`
in your web server (`.htaccess` for Apache, or the nginx `try_files` directive).

## URL Rules

A rule maps a pattern to a route. Rules can be declared as short strings, as arrays with options,
or as full rule class instances.

```php
'rules' => [
    // 1. Shorthand: '<pattern>' => '<route>'
    'posts' => 'post/index',
    'post/<id:\d+>' => 'post/view',
    'post/<id:\d+>/<title>' => 'post/view',

    // 2. Array form with extra options
    [
        'pattern' => 'post/<id:\d+>',
        'route' => 'post/view',
        'verb' => ['GET'],
        'suffix' => '.html',
    ],

    // 3. Custom rule class
    [
        'class' => 'app\components\CarUrlRule',
        'connectionID' => 'db',
    ],
],
```

### Rule option reference

| Option      | Purpose                                                                  |
|-------------|--------------------------------------------------------------------------|
| `pattern`   | The URL pattern with parameter placeholders like `<id:\d+>`.              |
| `route`     | The controller/action route the pattern maps to.                          |
| `verb`      | HTTP verbs this rule answers (`GET`, `POST`, etc.). Used by REST APIs.    |
| `suffix`    | URL suffix for this rule only (e.g. `.html`).                             |
| `mode`      | `UrlRule::CREATION_ONLY` to use the rule for create but not parse.        |
| `defaults`  | Default values for parameters not present in the URL.                     |
| `host`      | Host pattern, allows rules per subdomain.                                 |
| `class`     | Custom rule class (defaults to `yii\web\UrlRule`).                        |

### Parameter patterns

Placeholders in `pattern` use the form `<name:regex>`:

```php
'post/<id:\d+>'             // only digits
'post/<slug:[a-z-]+>'       // lowercase letters and hyphens
'posts/<page:\d+>/<sort>'   // multiple params
```

## Creating URLs

Never concatenate URLs by hand — always use the URL helper so rules and host info are honoured.

```php
use yii\helpers\Url;

// Relative URL using the default route
Url::to(['post/view', 'id' => 100]);

// Absolute URL (with host)
Url::to(['post/view', 'id' => 100], true);

// Canonical absolute URL honoring schema
Url::to(['post/view', 'id' => 100], 'https');

// A plain string is returned as-is (already a URL)
Url::to('@web/css/site.css');     // alias-based asset URL

// In a controller (shortcut via the request)
$url = Yii::$app->urlManager->createUrl(['post/view', 'id' => 100]);
$abs = Yii::$app->urlManager->createAbsoluteUrl(['post/view', 'id' => 100]);
```

`Url::to()` and `Url::toRoute()` accept `['controller/action', 'param' => value]` and pick the
first matching rule. When no rule matches, the fallback is the `r=` query string format.

## GroupUrlRule

Group rules together to share a common prefix, useful for modules or REST controllers:

```php
use yii\web\GroupUrlRule;
use yii\rest\UrlRule;

new GroupUrlRule([
    'prefix' => 'admin',
    'rules' => [
        'dashboard' => 'admin/dashboard/index',
        'users' => 'admin/user/index',
    ],
]);

// Equivalent config-array form
'rules' => [
    [
        'class' => 'yii\web\GroupUrlRule',
        'prefix' => 'admin',
        'rules' => [
            'dashboard' => 'dashboard/index',
            'users' => 'user/index',
        ],
    ],
],
```

## RESTful URL Rule

`yii\rest\UrlRule` maps a single resource declaration to all standard REST actions:

```php
'rules' => [
    [
        'class' => 'yii\rest\UrlRule',
        'controller' => 'user',
        'pluralize' => true,        // /users, /users/123
        'tokens' => [
            '{id}' => '<id:\\d[\\d,]*>',
        ],
        'extraPatterns' => [
            'POST search' => 'search',   // custom action
            'GET {id}/profile' => 'profile',
        ],
    ],
],
```

This single declaration creates `GET /users`, `POST /users`, `GET /users/123`,
`PUT/PATCH /users/123`, `DELETE /users/123`, plus `OPTIONS` for each.

## Strict Parsing

With `enableStrictParsing => true`, only URLs matching a declared rule are accepted; everything
else returns a 404. Combine this with a catch-all rule for a default route:

```php
'rules' => [
    '' => 'site/index',           // home page
    '<controller:[\w\-]+>/<action:[\w\-]+>' => '<controller>/<action>',
],
```

## Performance Notes

- Set `'cache' => 'cache'` on `urlManager` so parsed rules are cached instead of re-built per request.
- Order rules from most specific to least specific — the first match wins.
- Avoid overly broad regex patterns in `<param:regex>`; they slow parsing and risk ambiguity.
