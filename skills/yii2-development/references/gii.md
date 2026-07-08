# Yii2 Gii — Code Generator

Gii is Yii2's web-based and console-based code generator. It produces models, CRUD scaffolds,
controllers, modules, extensions and more from your existing database schema or templates, then lets
you preview and diff the result before writing files.

## Configuration

Gii is a developer tool — only enable it in dev environments:

```php
// config/web.php (and config/console.php for CLI use)
$config['bootstrap'][] = 'gii';
$config['modules']['gii'] = [
    'class' => 'yii\gii\Module',
    // restrict by IP for safety
    'allowedIPs' => ['127.0.0.1', '::1', '192.168.0.*'],
    // optional: custom generators
    'generators' => [
        // key must match the generator ID
    ],
];
```

For console access the same module must be bootstrapped in `console/config/main.php`.

## Web Interface

Visit `http://localhost/path/to/index.php?r=gii` (or `/gii` with pretty URLs) to open the generator
dashboard. Each generator presents a form with the most useful fields; filling the form and clicking
**Preview** shows every file that would be created, with a diff against the existing version if one
already exists. Tick the files and click **Generate** to write them.

## Available Generators

### Model Generator

Generates an `ActiveRecord` class from a database table.

- **Table Name** — the source table (with or without `{{%}}` prefix).
- **Model Class Name** — e.g. `User`.
- **Namespace** — defaults to `app\models`.
- **Base Class** — usually `yii\db\ActiveRecord`, can be a custom base.
- **Generate Relations** — `None`, `All relations`, or `Relations from current table` (uses schema
  foreign keys to add `hasOne`/`hasMany`).
- **Generate Labels from Comments** — pulls column comments into `attributeLabels()`.
- **Generate QueryModel** — also produces an `ActiveQuery` subclass for custom scopes.

Output: `models/User.php` (and optionally `models\UserQuery.php`).

### CRUD Generator

Generates a controller plus index/create/view/update/delete views wired to a model.

- **Model Class** — fully qualified, e.g. `app\models\User`.
- **Search Model Class** — usually `app\models\UserSearch`; generates a search form with filters.
- **Controller Class** — e.g. `app\controllers\UserController`.
- **View Path** — defaults to `@app/views/user`.
- **Base Controller Class** — `yii\web\Controller` or a project base.
- **Widget Used in Index Page** — `GridView` (default) or `ListView`.

Output: one controller, five view files (`index.php`, `view.php`, `_form.php`, `create.php`,
`update.php`), and the search model.

### Controller Generator

Stubs an empty controller with one action, useful as a starting point when you are not scaffolding
a full CRUD.

- **Controller Class** — e.g. `app\controllers\SiteController`.
- **Action IDs** — comma-separated, e.g. `index, about, contact`.
- **View Path** — where to create the view templates.

### Form Generator

Generates a `Model`-based form class plus its view. Useful for forms not backed by a single table
(e.g. login, contact).

- **Model Class** — an existing model providing the rules and labels.
- **View Name** — the view file path.
- **Scenario** — restricts the displayed attributes to one scenario.

### Module Generator

Scaffolds a whole module directory (`Module.php`, default controller, views, layouts).

- **Module ID** — e.g. `admin`.
- **Module Class** — e.g. `app\modules\admin\Module`.
- **Output Path** — where to create the module folder.

Remember to register the module in `config/web.php`:

```php
'modules' => ['admin' => ['class' => 'app\modules\admin\Module']],
```

### Extension Generator

Bootstraps a Composer-installable extension with `composer.json`, a `README`, an `AutoloadSource`
and a placeholder class. Useful when you are about to extract reusable code into its own package.

- **Extension Name** — `vendor/package`.
- **Namespace** — PSR-4 root, e.g. `vendor\package\`.
- **Type** — `yii2-extension`.
- **Keywords**, **License**, **Author**.

## Command-Line Usage

Gii runs in the console too — perfect for scripts, CI, or headless servers. The syntax is:

```
./yii gii/<generator-id> [options] [--interactive=0]
```

The IDs match the generators above: `model`, `crud`, `controller`, `form`, `module`, `extension`.

```bash
# Generate a model non-interactively
./yii gii/model --tableName=user --modelClass=User --ns=app\\models --overwrite=1 --interactive=0

# Generate CRUD
./yii gii/crud \
    --modelClass=app\\models\\User \
    --controllerClass=app\\controllers\\UserController \
    --searchModelClass=app\\models\\UserSearch \
    --viewPath=@app/views/user \
    --overwrite=1 --interactive=0

# Generate a controller with several actions
./yii gii/controller \
    --controllerClass=app\\controllers\\SiteController \
    --actions=index,about,contact
```

`--overwrite=1` overwrites existing files (default skips them). `--interactive=0` skips prompts —
useful in CI pipelines.

## Custom Generators / Templates

Override the default templates by registering a custom generator:

```php
'modules' => [
    'gii' => [
        'class' => 'yii\gii\Module',
        'generators' => [
            'model' => [
                'class'     => 'yii\gii\generators\model\Generator',
                'templates' => [
                    'myTemplate' => '@app/giiTemplates/model',
                ],
            ],
        ],
    ],
],
```

Place your `default.php` (and partials) in the templates directory and pick it from the
**Code Template** dropdown when generating.

## Tips

- Regenerate search and CRUD models after schema changes — Gii detects modified files and warns you.
- Always review the diff before overwriting; Gii preserves hand-written code only if you opt out.
- Add your own base ActiveRecord with project-wide scopes and point `Base Class` at it so generated
  models inherit conventions automatically.
- Do **not** enable Gii in production (`YII_ENV_DEV` check in the default config guards against this).
