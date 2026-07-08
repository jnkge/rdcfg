# Response and Error Handling

Native `github.com/gin-gonic/gin`. Covers response rendering, a unified response envelope,
centralized error handling with middleware, the abort chain, and Server-Sent Events (SSE).

## 1. Response rendering

`*gin.Context` offers renderers for the common content types. Each sets status, Content-Type,
and writes the body:

| Method | Content-Type | Notes |
|--------|--------------|-------|
| `c.JSON(code, obj)` | application/json | Uses `encoding/json`; escapes HTML by default. |
| `c.PureJSON(code, obj)` | application/json | No HTML escaping; for already-trusted raw output. |
| `c.AsciiJSON(code, obj)` | application/json | Escapes non-ASCII to \uXXXX. |
| `c.SecureJSON(code, obj)` | application/json | Wraps arrays in an object to prevent JSON hijacking when configured. |
| `c.JSONP(code, obj)` | application/javascript | Reads `?callback=` query and wraps the payload. |
| `c.XML(code, obj)` | application/xml | |
| `c.YAML(code, obj)` | application/x-yaml | |
| `c.TOML(code, obj)` | application/toml | |
| `c.String(code, fmt, args...)` | text/plain | |
| `c.Data(code, contentType, bytes)` | custom | Raw bytes. |
| `c.File(path)` | by extension | Serves a file with http.ServeFile. |
| `c.FileAttachment(path, name)` | by extension | Like File but sets Content-Disposition to attachment. |
| `c.DataFromReader(code, size, ct, reader, extraHeaders)` | custom | Stream from an io.Reader. |

`gin.H` is a shortcut for `map[string]any`:

```go
r.GET("/someJSON", func(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "hey", "status": http.StatusOK})
})
```

You can also pass any struct; Gin marshals it using the struct's tags:

```go
type User struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

r.GET("/users/:id", func(c *gin.Context) {
	u := User{ID: 1, Name: "Alice"}
	c.JSON(http.StatusOK, u)
})
```

Serving files and downloads:

```go
r.GET("/file", func(c *gin.Context) {
	c.File("./assets/report.pdf")
})

r.GET("/download", func(c *gin.Context) {
	c.FileAttachment("./assets/report.pdf", "monthly-report.pdf")
})

r.GET("/reader", func(c *gin.Context) {
	f, _ := os.Open("./assets/big.bin")
	defer f.Close()
	c.DataFromReader(http.StatusOK, -1, "application/octet-stream", f, nil)
})
```

Redirects:

```go
r.GET("/old", func(c *gin.Context) {
	c.Redirect(http.StatusMovedPermanently, "/new")
})
r.POST("/form", func(c *gin.Context) {
	c.Redirect(http.StatusFound, "/success") // 302 for POST->GET
})
```

## 2. Unified response envelope

Adopt one consistent shape for every API response so clients can parse uniformly. A common
pattern:

```go
package response

type Response struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Response{Code: 0, Message: "ok", Data: data})
}

func Fail(c *gin.Context, httpStatus, code int, msg string) {
	c.JSON(httpStatus, Response{Code: code, Message: msg})
}
```

Use it in handlers instead of ad-hoc `gin.H`:

```go
r.GET("/users/:id", func(c *gin.Context) {
	u, err := userService.Get(c.Param("id"))
	if err != nil {
		response.Fail(c, http.StatusNotFound, 10001, "user not found")
		return
	}
	response.OK(c, u)
})
```

## 3. Centralized error handling middleware

Gin's `c.Error(err)` records errors on the context without aborting (it does not write a
response). A terminal middleware reads `c.Errors` after `c.Next()` and produces a single
structured error response. This keeps handlers focused on the happy path.

```go
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next() // run the handler first

		if len(c.Errors) == 0 {
			return
		}

		err := c.Errors.Last().Err
		// Optionally map error types to HTTP status codes.
		status := http.StatusInternalServerError
		var appErr *AppError
		if errors.As(err, &appErr) {
			status = appErr.HTTPStatus
		}

		c.JSON(status, response.Response{
			Code:    status,
			Message: err.Error(),
		})
	}
}
```

Handlers then push errors instead of writing responses themselves:

```go
type AppError struct {
	HTTPStatus int
	Code       int
	Message    string
}

func (e *AppError) Error() string { return e.Message }

func NewBadRequest(msg string) *AppError {
	return &AppError{HTTPStatus: http.StatusBadRequest, Code: 400, Message: msg}
}

r.GET("/items/:id", func(c *gin.Context) {
	item, err := svc.Get(c.Param("id"))
	if err != nil {
		c.Error(NewBadRequest("item not found")) // recorded, not written
		return
	}
	response.OK(c, item)
})
```

Attach the middleware globally, after the recovery middleware:

```go
r := gin.New()
r.Use(gin.Logger(), gin.Recovery(), ErrorHandler())
```

## 4. The abort chain

`c.Abort()` stops the middleware chain so no subsequent handlers run. The two idiomatic
patterns:

**Preferred — single call, atomic status + body:**

```go
r.GET("/secret", AuthRequired(), func(c *gin.Context) {
	if !hasPermission(c) {
		c.AbortWithStatusJSON(http.StatusForbidden, response.Response{
			Code: 403, Message: "forbidden",
		})
		return
	}
	// ...
})
```

**Avoid — Abort then separate JSON (can produce "Headers already written" warnings):**

```go
// Not recommended
c.Abort()
c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"}) // status may already be set
```

Other abort variants:

- `c.AbortWithStatus(code)` — set status only, no body.
- `c.AbortWithError(code, err)` — set status and record the error (calls `c.Error`); no body.
  Prefer `c.AbortWithStatusJSON` when you want to send a JSON body.

A typical auth middleware aborts early on failure:

```go
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.Response{
				Code: 401, Message: "missing token",
			})
			return
		}
		claims, err := parseToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.Response{
				Code: 401, Message: "invalid token",
			})
			return
		}
		c.Set("userID", claims.UserID)
		c.Next()
	}
}
```

## 5. Server-Sent Events (SSE)

Gin provides `c.SSEvent(name, message)` to write an SSE event and `c.Stream(step)` to loop
until the client disconnects. SSE is backed by `github.com/gin-contrib/sse`.

Set the SSE headers explicitly, then stream:

```go
func main() {
	router := gin.Default()

	router.GET("/stream", func(c *gin.Context) {
		// Required SSE headers.
		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")
		c.Writer.Header().Set("Transfer-Encoding", "chunked")

		c.Stream(func(w io.Writer) bool {
			// Send an event named "time" with the current timestamp.
			c.SSEvent("time", gin.H{"now": time.Now().Format(time.RFC3339)})
			// Return true to keep streaming, false to close the connection.
			time.Sleep(time.Second)
			return true
		})
	})

	router.Run(":8080")
}
```

`c.Stream` monitors `c.Writer.CloseNotify()` internally and returns when the client
disconnects, so the loop exits cleanly.

### Broadcasting to multiple clients

A fan-out pattern uses a broker with per-client channels. Each SSE handler registers a client,
and a producer goroutine pushes messages:

```go
type Broker struct {
	clients    map[chan string]bool
	register   chan chan string
	unregister chan chan string
	messages   chan string
}

func NewBroker() *Broker {
	b := &Broker{
		clients:    make(map[chan string]bool),
		register:   make(chan chan string),
		unregister: make(chan chan string),
		messages:   make(chan string, 256),
	}
	go b.run()
	return b
}

func (b *Broker) run() {
	for {
		select {
		case c := <-b.register:
			b.clients[c] = true
		case c := <-b.unregister:
			if _, ok := b.clients[c]; ok {
				delete(b.clients, c)
				close(c)
			}
		case msg := <-b.messages:
			for c := range b.clients {
				select {
				case c <- msg:
				default: // drop if client is slow
				}
			}
		}
	}
}

func (b *Broker) SSEHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")

		client := make(chan string, 8)
		b.register <- client

		defer func() { b.unregister <- client }()

		// Notify the broker when the client disconnects so cleanup happens promptly.
		notify := c.Writer.CloseNotify()
		go func() { <-notify; b.unregister <- client }()

		c.Stream(func(w io.Writer) bool {
			if msg, ok := <-client; ok {
				c.SSEvent("message", msg)
				return true
			}
			return false
		})
	}
}
```

Note: `c.Writer.CloseNotify()` is deprecated in net/http in favor of `c.Request.Context()`,
but Gin's `c.Stream` still uses it internally and it remains the documented way to detect
client disconnect within SSE handlers.

## 6. Putting it together

```go
func NewRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), ErrorHandler())
	r.HandleMethodNotAllowed = true

	r.NoRoute(func(c *gin.Context) {
		c.AbortWithStatusJSON(http.StatusNotFound,
			response.Response{Code: 404, Message: "not found"})
	})

	api := r.Group("/api/v1")
	api.Use(AuthRequired())
	{
		api.GET("/items/:id", func(c *gin.Context) {
			item, err := svc.Get(c.Param("id"))
			if err != nil {
				c.Error(err)
				return
			}
			response.OK(c, item)
		})
	}

	r.GET("/stream", broker.SSEHandler())
	return r
}
```

## Common pitfalls

- **Writing after abort**: once `c.Abort()` runs, later middleware is skipped. Calling
  `c.JSON` in a later middleware (not the aborting one) will not execute. Write the response
  in the same place you abort.
- **Double status set**: `c.JSON` calls `c.Status(code)` internally. Calling `c.Status(code)`
  then `c.JSON(code, ...)` is fine, but mixing `c.AbortWithError` (which sets a status) with a
  later `c.JSON` can trigger header-already-written warnings.
- **Flushing SSE**: `c.SSEvent` does not flush by itself in all setups; `c.Stream` handles
  flushing per iteration. If you emit events outside `c.Stream`, call `c.Writer.Flush()`.
- **JSON HTML escaping**: `c.JSON` escapes `<`, `>`, `&` by default. Use `c.PureJSON` when
  serving already-sanitized HTML strings inside JSON.
- **Error vs response**: `c.Error(err)` only records the error; it does not write a response.
  Without a terminal middleware that reads `c.Errors`, the client gets an empty 200.
