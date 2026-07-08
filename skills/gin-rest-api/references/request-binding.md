# Request Binding and Validation

Native `github.com/gin-gonic/gin`. Gin binds request data (JSON, XML, YAML, TOML, form, query,
URI, header) into structs and validates via `go-playground/validator/v10`.

## 1. Should-bind vs Must-bind (bind)

Gin provides two families of binding methods. **Always prefer the `Should` family.**

| Family | Methods | Behavior on error |
|--------|---------|-------------------|
| Must bind | `Bind`, `BindJSON`, `BindXML`, `BindQuery`, `BindYAML`, `BindHeader`, `BindTOML` | Aborts the request with `c.AbortWithError(400, err)`, sets `Content-Type: text/plain`. You lose control of the response shape and cannot override the status. |
| Should bind | `ShouldBind`, `ShouldBindJSON`, `ShouldBindXML`, `ShouldBindQuery`, `ShouldBindYAML`, `ShouldBindHeader`, `ShouldBindTOML`, `ShouldBindUri` | Returns the error; the developer decides how to respond (status, shape, logging). |

Why avoid `Bind*`: it auto-writes a 400 with `text/plain` content type, and any later attempt
to set the status triggers `[GIN-debug] [WARNING] Headers were already written`. With
`ShouldBind*` you return your own structured error response.

## 2. Binding tags

Set the tag matching the source you bind from. A single struct can carry multiple tags so it
can be reused across JSON / form / query:

```go
type Login struct {
	User     string `form:"user" json:"user" xml:"user" binding:"required"`
	Password string `form:"password" json:"password" xml:"password" binding:"required"`
}
```

- `json:"name"` — JSON field name (for `ShouldBindJSON`).
- `form:"name"` — query string / form field (for `ShouldBindQuery`, `ShouldBind` form).
- `uri:"name"` — path parameter (for `ShouldBindUri`).
- `header:"Name"` — request header (for `ShouldBindHeader`).
- `binding:"..."` — validation rules (see below). `binding:"-"` skips validation.
- `time_format:"2006-01-02"`, `time_utc:"1"` — for `time.Time` fields.

## 3. Binding JSON, query, and form

```go
func main() {
	router := gin.Default()

	// JSON body: {"user":"manu","password":"123"}
	router.POST("/loginJSON", func(c *gin.Context) {
		var body Login
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return // always return after a bind failure
		}
		c.JSON(http.StatusOK, gin.H{"status": "logged in", "user": body.User})
	})

	// Query string: /login?user=manu&password=123
	router.GET("/login", func(c *gin.Context) {
		var q Login
		if err := c.ShouldBindQuery(&q); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"user": q.User})
	})

	// HTML form (application/x-www-form-urlencoded or multipart): user=manu&password=123
	router.POST("/loginForm", func(c *gin.Context) {
		var form Login
		// ShouldBind infers the binder from Content-Type (JSON/XML/Form).
		if err := c.ShouldBind(&form); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"user": form.User})
	})

	router.Run(":8080")
}
```

A `required` field that is empty (or missing) fails validation and returns an error:

```sh
$ curl -X POST localhost:8080/loginJSON -H 'content-type: application/json' -d '{"user":"manu"}'
{"error":"Key: 'Login.Password' Error:Field validation for 'Password' failed on the 'required' tag"}
```

## 4. Binding URI (path parameters)

Path params are bound with `ShouldBindUri` and the `uri` tag:

```go
type Person struct {
	ID   string `uri:"id" binding:"required,uuid"`
	Name string `uri:"name" binding:"required"`
}

router.GET("/:name/:id", func(c *gin.Context) {
	var p Person
	if err := c.ShouldBindUri(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"name": p.Name, "id": p.ID})
})
```

## 5. Binding headers

```go
type ReqHeader struct {
	Rate   int    `header:"Rate"`
	Domain string `header:"Domain"`
}

router.GET("/", func(c *gin.Context) {
	var h ReqHeader
	if err := c.ShouldBindHeader(&h); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"rate": h.Rate, "domain": h.Domain})
})
// curl -H "rate:300" -H "domain:music" 127.0.0.1:8080/
```

## 6. Validation rules (go-playground/validator)

Gin uses `go-playground/validator/v10`. Common tags:

| Tag | Meaning |
|-----|---------|
| `required` | non-zero value |
| `min=3,max=20` | length / numeric bounds |
| `email` | RFC 5322 email |
| `url` | absolute URL |
| `uuid` | UUID v4 |
| `oneof=admin user guest` | value in set |
| `gtefield=CheckIn` | greater-or-equal to another field |
| `dive` | validate elements of a slice/map |
| `-` | skip validation entirely |

```go
type CreateUser struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=64"`
	Role     string `json:"role" binding:"required,oneof=admin user guest"`
	Tags     []string `json:"tags" binding:"omitempty,dive,required"`
}
```

## 7. Custom validators

Register a validator function on the engine's validator instance. Cast
`binding.Validator.Engine()` to `*validator.Validate`:

```go
package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

type Booking struct {
	CheckIn  time.Time `form:"check_in" binding:"required,bookabledate" time_format:"2006-01-02"`
	CheckOut time.Time `form:"check_out" binding:"required,gtfield=CheckIn" time_format:"2006-01-02"`
}

var bookableDate validator.Func = func(fl validator.FieldLevel) bool {
	date, ok := fl.Field().Interface().(time.Time)
	if !ok {
		return true
	}
	return time.Now().Before(date) // must be a future date
}

func main() {
	route := gin.Default()

	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("bookabledate", bookableDate)
	}

	route.GET("/bookable", func(c *gin.Context) {
		var b Booking
		if err := c.ShouldBindWith(&b, binding.Query); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "booking dates are valid"})
	})

	route.Run(":8085")
}
```

```sh
$ curl "localhost:8085/bookable?check_in=2030-04-16&check_out=2030-04-17"
{"message":"booking dates are valid"}
$ curl "localhost:8085/bookable?check_in=2030-03-10&check_out=2030-03-09"
{"error":"...CheckOut' failed on the 'gtfield' tag"}
$ curl "localhost:8085/bookable?check_in=2000-03-09&check_out=2000-03-10"
{"error":"...CheckIn' failed on the 'bookabledate' tag"}
```

## 8. File uploads

Set `router.MaxMultipartMemory` to cap in-memory parsing (default 32 MiB). The parsed body
above this limit spills to temp files.

### Single file

`file.Filename` is client-supplied and **must not** be trusted for the destination path —
strip path components or generate a new name to avoid directory traversal.

```go
func main() {
	router := gin.Default()
	router.MaxMultipartMemory = 8 << 20 // 8 MiB

	router.POST("/upload", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
			return
		}

		// Safe destination: never use file.Filename directly in production.
		dst := filepath.Join("./uploads", "upload-"+uuid.NewString()+filepath.Ext(file.Filename))
		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "save failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"saved": dst, "size": file.Size})
	})

	router.Run(":8080")
}
```

```sh
curl -X POST http://localhost:8080/upload -F "file=@/path/to/test.zip"
```

### Multiple files

```go
router.POST("/upload", func(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid multipart form"})
		return
	}
	files := form.File["upload[]"]

	for _, file := range files {
		dst := filepath.Join("./uploads", "upload-"+uuid.NewString())
		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"uploaded": len(files)})
})
```

```sh
curl -X POST http://localhost:8080/upload \
  -F "upload[]=@/path/to/test1.zip" \
  -F "upload[]=@/path/to/test2.zip"
```

### Binding multipart form to a struct

A `*multipart.FileHeader` field binds from form data, letting you mix text fields and files:

```go
type ProfileForm struct {
	Name   string                `form:"name" binding:"required"`
	Avatar *multipart.FileHeader `form:"avatar" binding:"required"`
	// Avatars []*multipart.FileHeader `form:"avatar" binding:"required"` // multiple
}

router.POST("/profile", func(c *gin.Context) {
	var form ProfileForm
	if err := c.ShouldBind(&form); err != nil {
		c.String(http.StatusBadRequest, "bad request: %v", err)
		return
	}
	if err := c.SaveUploadedFile(form.Avatar, "./uploads/"+form.Avatar.Filename); err != nil {
		c.String(http.StatusInternalServerError, "save failed")
		return
	}
	c.String(http.StatusOK, "ok, name=%s", form.Name)
})
```

## 9. Binding the body multiple times

`ShouldBind` consumes `c.Request.Body` and cannot be called twice for JSON/XML/MsgPack/ProtoBuf.
For Query/Form/FormPost/FormMultipart it is safe to call repeatedly. To bind the body into more
than one struct, use `ShouldBindBodyWith` (stores the body in the context) or the typed shortcuts:

```go
func handler(c *gin.Context) {
	var a FormA
	if err := c.ShouldBindBodyWith(&a, binding.JSON); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var b FormB
	if err := c.ShouldBindBodyWithJSON(&b); err != nil { // reuses cached body
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// ...
}
```

`ShouldBindBodyWith` has a small performance cost (it caches the body in context), so only use
it when you genuinely need to bind the body more than once.

## Common pitfalls

- **Missing tag for the source**: binding JSON into a struct with only `form:` tags silently
  leaves fields empty. Always tag every field for every source it may bind from.
- **`required` on zero values**: `0`, `""`, `false` are zero values and fail `required`. For
  numeric fields where `0` is valid, omit `required` or use a pointer.
- **Pointer fields**: `*int` bound from `0` historically caused issues; prefer non-pointer with
  `omitempty` or validate explicitly.
- **Nested structs**: each nested struct field must also carry `binding:"required"` on its own
  fields for them to be validated.
- **Trusting filename**: using `file.Filename` directly in `SaveUploadedFile` is a path-traversal
  risk. Always sanitize or generate a new name.
