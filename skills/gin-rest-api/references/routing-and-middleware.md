# Routing and Middleware

Native `github.com/gin-gonic/gin` (Gin 1.10+, requires Go 1.21+). This reference covers engine
creation, route definition, route groups, path parameters, and the middleware chain.

## 1. Engine: gin.Default() vs gin.New()

Gin's entry point is `*gin.Engine`, which implements `http.Handler`. Two constructors exist:

- `gin.Default()` returns an engine with `gin.Logger()` and `gin.Recovery()` already attached.
  Use it for quick starts and most services where standard logging + panic recovery is enough.
- `gin.New()` returns a bare engine with **no** middleware. Use it when you need full control
  over the middleware stack (custom log format, conditional logging, replacing Recovery behavior).

```go
package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Quick start: Logger + Recovery pre-attached.
	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	if err := r.Run(":8080"); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
```

Equivalent setup with `gin.New()`:

```go
r := gin.New()
r.Use(gin.Logger())
r.Use(gin.Recovery()) // never omit Recovery in production
```

Set the release mode for production to disable console color and debug route logs:

```go
gin.SetMode(gin.ReleaseMode) // call before creating the engine
```

## 2. Defining routes

Each HTTP verb has a method on `*gin.Engine` (and `*RouterGroup`): `GET, POST, PUT, PATCH,
DELETE, HEAD, OPTIONS`. `Any` registers all verbs. Handlers receive `*gin.Context`.

```go
router := gin.Default()

router.GET("/users", listUsers)
router.POST("/users", createUser)
router.PUT("/users/:id", updateUser)
router.DELETE("/users/:id", deleteUser)
router.Any("/health", healthCheck)
```

## 3. Path parameters: :param and *filepath

- `:param` matches a single path segment (e.g. `/user/:name` matches `/user/john` but not
  `/user/` or `/user`).
- `*action` (catch-all / wildcard) matches the rest of the path including leading slash and
  further segments (e.g. `/user/:name/*action` matches `/user/john/send`); the value begins
  with `/`.

```go
func main() {
	router := gin.Default()

	// /user/john -> "Hello john"
	router.GET("/user/:name", func(c *gin.Context) {
		name := c.Param("name")
		c.String(http.StatusOK, "Hello %s", name)
	})

	// /user/john/send -> "john is /send"
	// Also matches /user/john/ (redirects if no other route matches /user/john)
	router.GET("/user/:name/*action", func(c *gin.Context) {
		name := c.Param("name")
		action := c.Param("action")
		c.String(http.StatusOK, "%s is %s", name, action)
	})

	// Exact routes are resolved BEFORE param routes, regardless of definition order.
	// /user/groups is never captured by /user/:name.
	router.GET("/user/groups", func(c *gin.Context) {
		c.String(http.StatusOK, "available groups: [...]")
	})

	router.Run(":8080")
}
```

Query string and form helpers (no struct binding needed for one-off reads):

```go
router.GET("/welcome", func(c *gin.Context) {
	firstname := c.DefaultQuery("firstname", "Guest") // with default
	lastname := c.Query("lastname")                   // shortcut for c.Request.URL.Query().Get("lastname")
	c.String(http.StatusOK, "Hello %s %s", firstname, lastname)
})

router.POST("/form", func(c *gin.Context) {
	message := c.PostForm("message")
	nick := c.DefaultPostForm("nick", "anonymous")
	c.JSON(http.StatusOK, gin.H{"message": message, "nick": nick})
})
```

## 4. Route groups (RouterGroup)

`router.Group(prefix, middleware...)` returns a `*gin.Group` (a `RouterGroup`) that shares a
prefix and can carry its own middleware. Groups can be nested arbitrarily deep. Use them for
API versioning, feature areas, and applying auth/CORS to a subset of routes.

```go
func main() {
	router := gin.Default()

	// Versioned API groups.
	v1 := router.Group("/v1")
	{
		v1.POST("/login", loginEndpoint)
		v1.POST("/submit", submitEndpoint)
		v1.GET("/read", readEndpoint)
	}

	v2 := router.Group("/v2")
	{
		v2.POST("/login", loginEndpoint)
		v2.GET("/read", readEndpoint)
	}

	router.Run(":8080")
}
```

Middleware can be passed at group creation or attached with `.Use()`:

```go
authorized := router.Group("/", AuthRequired())
// equivalent to:
authorized := router.Group("/")
authorized.Use(AuthRequired())
```

Nested groups inherit the parent prefix and middleware, and may add their own:

```go
authorized := router.Group("/")
authorized.Use(AuthRequired())
{
	authorized.POST("/login", loginEndpoint)
	authorized.POST("/submit", submitEndpoint)

	// Nested group: /testing/analytics, also behind AuthRequired().
	testing := authorized.Group("testing")
	testing.GET("/analytics", analyticsEndpoint)
}
```

## 5. Middleware

A middleware is a `gin.HandlerFunc` that typically calls `c.Next()` to continue the chain and
optionally does work before/after the main handler. `c.Set(key, val)` shares data with later
handlers; `c.MustGet(key)` retrieves it (panics if missing — use `c.Get` when absence is
expected).

### Built-in middleware

- `gin.Logger()` — request logging to `gin.DefaultWriter` (os.Stdout by default).
- `gin.Recovery()` — recovers from panics, writes a 500, and prevents the process from
  crashing. Always keep it in production.
- `gin.BasicAuth(gin.Accounts{...})` — HTTP Basic auth; sets `gin.AuthUserKey` in context.

### Custom middleware

```go
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		t := time.Now()

		// Example: share a value with downstream handlers.
		c.Set("example", "12345")

		// Before request.
		c.Next()

		// After request.
		latency := time.Since(t)
		status := c.Writer.Status()
		log.Printf("status=%d latency=%s", status, latency)
	}
}

func main() {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), Logger())

	r.GET("/test", func(c *gin.Context) {
		// MustGet panics if the key is absent; only use it when the middleware
		// is guaranteed to have run.
		example := c.MustGet("example").(string)
		c.String(http.StatusOK, example)
	})

	r.Run(":8080")
}
```

### Custom Recovery behavior

`gin.CustomRecovery` lets you control what happens when a panic is caught:

```go
r := gin.New()
r.Use(gin.Logger())
r.Use(gin.CustomRecovery(func(c *gin.Context, recovered any) {
	if msg, ok := recovered.(string); ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": msg})
	}
	c.AbortWithStatus(http.StatusInternalServerError)
}))

r.GET("/panic", func(c *gin.Context) {
	panic("boom")
})
```

### Middleware scope

- **Global**: `r.Use(m1, m2)` — runs for every route.
- **Per-route**: `r.GET("/x", m1, m2, handler)` — runs only for that route.
- **Per-group**: `g.Use(m)` — runs for every route in the group (and nested groups).

### Goroutines inside middleware/handlers

Never use the original `*gin.Context` inside a goroutine — it is reused after the handler
returns. Always copy it with `c.Copy()`:

```go
r.GET("/long_async", func(c *gin.Context) {
	cCp := c.Copy() // read-only copy safe for goroutines
	go func() {
		time.Sleep(5 * time.Second)
		log.Println("done, path:", cCp.Request.URL.Path)
	}()
	c.String(http.StatusOK, "accepted")
})
```

## 6. NoRoute and NoMethod

`NoRoute` handles unmatched paths; `NoMethod` handles disallowed verbs when
`HandleMethodNotAllowed = true` (default false). Use them for consistent 404/405 JSON.

```go
r := gin.New()
r.Use(gin.Logger(), gin.Recovery())
r.HandleMethodNotAllowed = true

	r.NoRoute(func(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "resource not found"})
})

r.NoMethod(func(c *gin.Context) {
	c.JSON(http.StatusMethodNotAllowed, gin.H{"code": 405, "message": "method not allowed"})
})

r.GET("/items", listItems)
// POST /items -> 405 instead of 404
```

## 7. Putting it together

A typical service wires engine + global middleware + grouped, versioned, authenticated routes:

```go
func NewRouter(auth gin.HandlerFunc) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.HandleMethodNotAllowed = true

	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "not found"})
	})

	// Public routes.
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Authenticated v1 API.
	api := r.Group("/api/v1")
	api.Use(auth)
	{
		api.GET("/users", listUsers)
		api.GET("/users/:id", getUser)
		api.POST("/users", createUser)
	}

	return r
}
```

## Common pitfalls

- **Conflicting routes**: `/user/:name` and `/user/:id` on the same verb conflict (param name
  differs but shape is identical). Use one param name or distinct prefixes like `/users/:id`
  vs `/users/by-name/:name`.
- **Trailing slash**: by default Gin redirects `/user/john/` to `/user/john` when only the
  no-slash route is registered (`RedirectTrailingSlash`, on by default). Disable with
  `r.RedirectTrailingSlash = false` if you want strict matching.
- **Forgetting Recovery**: a `gin.New()` without `gin.Recovery()` means one panic kills the
  process. Always add it in production.
- **Reading body twice**: `c.ShouldBind` consumes `c.Request.Body`. To bind into multiple
  structs, use `c.ShouldBindBodyWith` / the `ShouldBindBodyWithJSON` shortcuts.
