# Project Structure and Testing

Native `github.com/gin-gonic/gin`. Covers a recommended directory layout, dependency injection
into handlers, httptest-based testing with table-driven cases, hot reload with `air`, and
graceful shutdown.

## 1. Recommended directory structure

Follow the standard Go layout (`cmd/` + `internal/`) and split internal code by layer within a
domain. Keep `main.go` thin: it should only wire dependencies and start the server.

```
myapp/
├── cmd/
│   └── server/
│       └── main.go              # entry: build router, inject deps, run
├── internal/
│   ├── config/
│   │   └── config.go            # env loading (os.Getenv / viper)
│   ├── models/
│   │   └── user.go              # domain structs (DB + DTO)
│   ├── services/
│   │   ├── user_service.go      # business logic
│   │   └── user_service_test.go
│   ├── handlers/
│   │   ├── user_handler.go      # HTTP layer: bind -> call service -> respond
│   │   └── user_handler_test.go
│   ├── middleware/
│   │   ├── auth.go
│   │   └── recover.go
│   └── routes/
│       └── routes.go            # assemble gin.Engine from handlers + middleware
├── migrations/                  # DB migrations (sql/ goose / golang-migrate)
├── go.mod
├── go.sum
├── .air.toml                    # hot reload config
├── Dockerfile
└── Makefile
```

Key principles:

- **Thin handlers, thick services.** Handlers bind input, call a service, and write the
  response. Business rules, external calls, and DB access live in `services/`.
- **Domain over layer-first packages.** As the app grows, split by domain
  (`internal/user/`, `internal/order/`) each with its own handlers/services/models, rather
  than one giant `handlers/` package. This avoids circular imports and keeps cohesion high.
- **`internal/` enforces privacy.** Nothing outside the module can import `internal/`, which
  is exactly what you want for server code.

## 2. Dependency injection

Inject dependencies through constructors so handlers depend on interfaces, not concrete
types. This makes handlers trivially testable with fakes.

Define a service interface (often in the same package as the handler, or in `services/`):

```go
// internal/services/user_service.go
package services

import "myapp/internal/models"

type UserRepository interface {
	FindByID(id string) (*models.User, error)
	Create(u *models.User) error
}

type UserService struct {
	repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Get(id string) (*models.User, error) {
	if id == "" {
		return nil, ErrInvalidID
	}
	return s.repo.FindByID(id)
}
```

The handler depends on the service (interface or concrete struct — interface when you want to
fake it in tests):

```go
// internal/handlers/user_handler.go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"myapp/internal/models"
	"myapp/internal/response"
)

type UserGetter interface {
	Get(id string) (*models.User, error)
}

type UserHandler struct {
	svc UserGetter
}

func NewUserHandler(svc UserGetter) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) Get(c *gin.Context) {
	u, err := h.svc.Get(c.Param("id"))
	if err != nil {
		c.Error(err)
		return
	}
	response.OK(c, u)
}
```

Assemble everything in `main.go`:

```go
// cmd/server/main.go
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"myapp/internal/handlers"
	"myapp/internal/middleware"
	"myapp/internal/routes"
	"myapp/internal/services"
)

func main() {
	repo := services.NewDBUserRepo(os.Getenv("DSN"))
	svc := services.NewUserService(repo)
	userH := handlers.NewUserHandler(svc)

	r := routes.NewRouter(userH, middleware.AuthRequired())
	if err := runGraceful(r, ":8080"); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
```

```go
// internal/routes/routes.go
package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"myapp/internal/handlers"
	"myapp/internal/middleware"
	"myapp/internal/response"
)

func NewRouter(userH *handlers.UserHandler, auth gin.HandlerFunc) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.HandleMethodNotAllowed = true

	r.NoRoute(func(c *gin.Context) {
		c.AbortWithStatusJSON(http.StatusNotFound,
			response.Response{Code: 404, Message: "not found"})
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")
	api.Use(auth)
	{
		api.GET("/users/:id", userH.Get)
	}

	return r
}
```

## 3. Testing with httptest

Use `net/http/httptest.NewRecorder()` and `router.ServeHTTP` to exercise the full middleware +
routing stack without opening a network port. This is the canonical Gin testing approach.

```go
// internal/handlers/user_handler_test.go
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"myapp/internal/models"
)

// fakeUserGetter implements UserGetter for tests.
type fakeUserGetter struct {
	user *models.User
	err  error
}

func (f *fakeUserGetter) Get(id string) (*models.User, error) {
	return f.user, f.err
}

func newRouter(svc UserGetter) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/users/:id", (&UserHandler{svc: svc}).Get)
	return r
}

func TestUserHandler_Get_OK(t *testing.T) {
	svc := &fakeUserGetter{user: &models.User{ID: "1", Name: "Alice"}}
	r := newRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/users/1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp struct {
		Code int `json:"code"`
		Data struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid json: %v", err)
	}
	if resp.Data.Name != "Alice" {
		t.Fatalf("expected Alice, got %s", resp.Data.Name)
	}
}
```

### Table-driven tests

Cover the normal path, validation errors, and not-found with one table:

```go
func TestUserHandler_Get(t *testing.T) {
	cases := []struct {
		name       string
		id         string
		svc        UserGetter
		wantStatus int
		wantCode   int
	}{
		{
			name:       "found",
			id:         "1",
			svc:        &fakeUserGetter{user: &models.User{ID: "1", Name: "Alice"}},
			wantStatus: http.StatusOK,
			wantCode:   0,
		},
		{
			name:       "not found",
			id:         "999",
			svc:        &fakeUserGetter{err: errors.New("not found")},
			wantStatus: http.StatusInternalServerError,
			wantCode:   500,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r := newRouter(tc.svc)
			req := httptest.NewRequest(http.MethodGet, "/users/"+tc.id, nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != tc.wantStatus {
				t.Fatalf("status: want %d, got %d", tc.wantStatus, w.Code)
			}
			var resp response.Response
			_ = json.Unmarshal(w.Body.Bytes(), &resp)
			if resp.Code != tc.wantCode {
				t.Fatalf("code: want %d, got %d", tc.wantCode, resp.Code)
			}
		})
	}
}
```

### Testing JSON body binding

For POST handlers, build the request body with `bytes.NewReader` and set Content-Type:

```go
func TestCreateUser_BadJSON(t *testing.T) {
	r := newRouter(&fakeUserGetter{})
	req := httptest.NewRequest(http.MethodPost, "/users",
		bytes.NewReader([]byte(`{"email":"not-an-email"}`)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}
```

## 4. Hot reload with air

[`air`](https://github.com/cosmtrek/air) rebuilds and restarts on file change. Initialize a
config in the project root:

```sh
go install github.com/cosmtrek/air@latest
air init        # creates .air.toml
air             # run with watch
```

A minimal `.air.toml`:

```toml
root = "."
tmp_dir = "tmp"

[build]
  bin = "./tmp/main"
  cmd = "go build -o ./tmp/main ./cmd/server"
  delay = 1000
  exclude_dir = ["assets", "tmp", "vendor", "testdata"]
  exclude_regex = ["_test.go"]
  include_ext = ["go", "tpl", "tmpl", "html"]
  kill_delay = "0s"
  log = "build-errors.log"
  send_interrupt = false
  stop_on_error = true

[misc]
  clean_on_exit = true
```

Run `air` during development; it watches `.go` files, rebuilds `./cmd/server`, and restarts the
process on each save.

## 5. Graceful shutdown

`r.Run()` blocks until error and does not drain in-flight requests on SIGTERM. For production,
wrap the router in an `*http.Server` and call `Shutdown(ctx)` on interrupt. This is the pattern
from the official Gin docs.

```go
// cmd/server/main.go (runGraceful)
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func runGraceful(router *gin.Engine, addr string) error {
	srv := &http.Server{
		Addr:              addr,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Start in the background.
	errCh := make(chan error, 1)
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	// Wait for interrupt or server error.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	select {
	case err := <-errCh:
		return err
	case <-quit:
	}

	log.Println("shutting down server...")
	// Give in-flight requests a deadline to finish.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		// Returning the error is fine; the caller logs and exits.
		return err
	}
	log.Println("server exited")
	return nil
}
```

Notes:

- `http.ErrServerClosed` is returned by `ListenAndServe` after `Shutdown` is called and is
  **not** a real error — guard against it.
- Pick a `Shutdown` timeout that covers your slowest legitimate request; 5-10s is common.
- `ReadHeaderTimeout` should always be set to mitigate slowloris-style attacks.
- For zero-downtime deploys, combine graceful shutdown with a health-check endpoint that the
  load balancer polls; new connections stop arriving once the LB sees `/health` fail, then
  in-flight requests drain within the timeout.

## Common pitfalls

- **`r.Run()` in production**: no graceful shutdown, no timeouts. Always use `http.Server`
  with `ReadHeaderTimeout` and `Shutdown`.
- **Reaching across packages**: handlers importing `services` concrete types tightly couples
  them. Depend on a small interface defined where it's consumed.
- **Global state**: a package-level `var db *sql.DB` used directly in handlers prevents
  injecting a test double. Pass dependencies in via constructors.
- **Skipping the router in tests**: testing `handler.Get(c)` with a manually built `*gin.Context`
  skips middleware and routing. Prefer `router.ServeHTTP(w, req)` to test the real stack.
- **Not setting TestMode**: `gin.SetMode(gin.TestMode)` silences route-registration debug logs
  and disables console color, keeping test output clean.
