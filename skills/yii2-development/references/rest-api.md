# Yii2 REST API

Yii2 ships a fully featured REST toolkit under the `yii\rest` namespace. With very little code you
get JSON output, content negotiation, pagination, rate limiting, authentication and standard CRUD
endpoints.

## Quick Start

Create a controller extending `yii\rest\ActiveController` and declare the model class:

```php
namespace app\controllers;

use yii\rest\ActiveController;

class CountryController extends ActiveController
{
    public $modelClass = 'app\models\Country';
}
```

Add a URL rule so requests reach the controller:

```php
// config/web.php
'urlManager' => [
    'enablePrettyUrl' => true,
    'enableStrictParsing' => true,
    'showScriptName' => false,
    'rules' => [
        ['class' => 'yii\rest\UrlRule', 'controller' => 'country'],
    ],
],
```

This single declaration exposes the following endpoints:

| Method    | URL              | Action    | Purpose                       |
|-----------|------------------|-----------|-------------------------------|
| GET       | `/countries`     | `index`   | List (paginated)              |
| HEAD      | `/countries`     | `index`   | Headers for list              |
| POST      | `/countries`     | `create`  | Create new resource           |
| GET       | `/countries/123` | `view`    | Return one resource           |
| HEAD      | `/countries/123` | `view`    | Headers for one resource      |
| PATCH     | `/countries/123` | `update`  | Partial update                |
| PUT       | `/countries/123` | `update`  | Full update                   |
| DELETE    | `/countries/123` | `delete`  | Delete                        |
| OPTIONS   | `/countries`     | `options` | Allowed verbs (CORS preflight)|

## Resource Classes (Model `fields()`)

Any model implementing `yii\base\Arrayable` can be serialised. `ActiveRecord` already does via the
`yii\rest\Serializer`. Override `fields()` and `extraFields()` to control output:

```php
namespace app\models;

use yii\db\ActiveRecord;

class User extends ActiveRecord
{
    public function fields()
    {
        return [
            'id',
            'username',
            'email',
            'registered_at' => function () {
                return date('c', $this->created_at);
            },
        ];
    }

    public function extraFields()
    {
        return ['profile', 'posts'];
    }
}
```

Request `?expand=profile,posts` to include extra fields; `?fields=id,email` to narrow the base set.

## Content Negotiation

`yii\filters\ContentNegotiator` runs on every `ActiveController` response. It parses the `Accept`
header and defaults to `application/json`. Enable XML by widening the supported formats:

```php
public function behaviors()
{
    $behaviors = parent::behaviors();
    $behaviors['contentNegotiator']['formats'] = [
        'application/json' => Response::FORMAT_JSON,
        'application/xml'  => Response::FORMAT_XML,
    ];
    return $behaviors;
}
```

## Authentication

Disable the session/cookie-based `authenticator` that ships with `ActiveController` (REST should be
stateless), then attach one of the REST auth filters:

```php
use yii\filters\auth\HttpBearerAuth;
use yii\filters\auth\HttpBasicAuth;
use yii\filters\auth\QueryParamAuth;

public function behaviors()
{
    $behaviors = parent::behaviors();
    $behaviors['authenticator'] = [
        'class' => HttpBearerAuth::class,
        // 'class' => HttpBasicAuth::class,    // send user:token as Basic
        // 'class' => QueryParamAuth::class,   // ?access-token=xxxx in URL
    ];
    $behaviors['authenticator']['only'] = ['create', 'update', 'delete'];
    return $behaviors;
}
```

For `HttpBasicAuth`, the username is ignored and the password is treated as the access token;
implement `User::findIdentityByAccessToken()` to validate it.

## Rate Limiting

Implement `RateLimitInterface` on your identity model and Yii automatically enforces limits via
`yii\filters\RateLimiter` (wired into `ActiveController`):

```php
use yii\web\IdentityInterface;
use yii\filters\RateLimitInterface;

class User extends ActiveRecord implements IdentityInterface, RateLimitInterface
{
    public function getRateLimit($request, $action)
    {
        return [100, 600]; // 100 requests per 600 seconds
    }

    public function loadAllowance($request, $action)
    {
        return [$this->allowance, $this->allowance_updated_at];
    }

    public function saveAllowance($request, $action, $allowance, $timestamp)
    {
        $this->allowance = $allowance;
        $this->allowance_updated_at = $timestamp;
        $this->save();
    }
}
```

Headers `X-Rate-Limit-Limit`, `X-Rate-Limit-Remaining`, and `X-Rate-Limit-Reset` are sent on every
response, and a 429 status is returned when the budget is exhausted.

## Versioning

Keep backwards compatibility by versioning modules or URL prefixes:

```php
'modules' => [
    'v1' => ['class' => 'app\api\v1\Module'],
    'v2' => ['class' => 'app\api\v2\Module'],
],

'urlManager' => [
    'rules' => [
        ['class' => 'yii\rest\UrlRule',
         'controller' => ['v1/users' => 'v1/user', 'v2/users' => 'v2/user']],
    ],
],
```

Accept-version selection via the `Accept` header (`application/json; version=v2`) is another common
convention.

## Error Handling

REST responses use HTTP status codes plus a consistent JSON body:

```json
{
    "name": "Not Found",
    "message": "Object not found: 123",
    "code": 0,
    "status": 404,
    "type": "yii\\web\\NotFoundHttpException"
}
```

Throw standard HTTP exceptions from actions and Yii formats them automatically:

```php
use yii\web\NotFoundHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\UnprocessableEntityHttpException;

throw new NotFoundHttpException('Object not found: ' . $id);
throw new ForbiddenHttpException('You are not allowed to perform this action.');
throw new UnprocessableEntityHttpException('Validation failed');
```

Configure `Response::on BEFORE_SEND` if you need to wrap errors in a custom envelope (for example a
`{success, data, errors}` shape).

## Customising Actions

Disable actions you do not need, or override the action classes:

```php
public function actions()
{
    $actions = parent::actions();

    unset($actions['delete']);                 // disable deletion
    $actions['index']['prepareDataProvider'] = function ($action) {
        return new ActiveDataProvider([
            'query' => User::find()->where(['status' => 1]),
            'pagination' => ['pageSize' => 20],
        ]);
    };

    return $actions;
}
```

Add a custom action alongside the defaults:

```php
public function actionSearch($keyword)
{
    return User::find()
        ->where(['like', 'username', $keyword])
        ->all();
}
```

Then declare it in the URL rule:

```php
'rules' => [
    [
        'class' => 'yii\rest\UrlRule',
        'controller' => 'user',
        'extraPatterns' => ['GET search' => 'search'],
    ],
],
```
