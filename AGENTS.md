# AGENTS.md - Go Development Guidelines

## Build/Lint/Test Commands

```bash
# Build the project
go build ./...

# Run all tests
go test ./...

# Run a single test (replace TestName and ./path)
go test -run TestName ./path/to/package

# Run tests with coverage
go test -cover ./...

# Run tests with verbose output
go test -v ./...

# Lint with standard tools
gofmt -d .
govulncheck ./...
go vet ./...

# Format code
gofmt -w .
goimports -w .

# Tidy dependencies
go mod tidy

# Download dependencies
go mod download

# Run the application
go run ./cmd/app
```

## Code Style Guidelines

### Imports
- Group imports: stdlib, third-party, internal
- Use `goimports` for automatic formatting
- Never use dot imports
- Alias imports only when necessary for clarity

```go
import (
    "context"
    "fmt"
    "time"

    "github.com/pkg/errors"
    "github.com/sirupsen/logrus"

    "github.com/dGilli/prassionate/internal/config"
)
```

### Formatting
- Use `gofmt` - standard Go formatting
- Max line length: 100 characters (soft limit)
- Use tabs for indentation
- Add empty line between function/method definitions

### Naming Conventions
- **Packages**: lowercase, single word, no underscores
- **Exported**: PascalCase (e.g., `Server`, `HandleRequest`)
- **Unexported**: camelCase (e.g., `server`, `handleRequest`)
- **Interfaces**: `-er` suffix (e.g., `Reader`, `Writer`)
- **Constants**: MixedCaps or ALL_CAPS for exported
- **Variables**: Descriptive, avoid single letters except in loops
- **Error variables**: Prefix with `Err` (e.g., `ErrNotFound`)

### Types
- Prefer concrete types over interfaces for return values
- Define interfaces where they are used, not where they are implemented
- Use struct tags for JSON, YAML, DB fields
- Avoid `any` (interface{}) when possible

### Error Handling
- Always check errors immediately
- Use `fmt.Errorf` with `%w` to wrap errors
- Create sentinel errors for common cases
- Do not ignore errors with `_`

```go
if err != nil {
    return fmt.Errorf("failed to load config: %w", err)
}
```

### Functions
- Keep functions small and focused
- Return early to reduce nesting
- Use named return values for documentation in complex functions
- Accept interfaces, return concrete types

### Concurrency
- Always use context for cancellation
- Never leak goroutines
- Use `sync.WaitGroup` for coordination
- Protect shared state with mutexes or channels

### Testing
- Table-driven tests preferred
- Use `_test` package for black-box testing
- Mock external dependencies
- Test both happy path and error cases
- Use `t.Parallel()` for independent tests

```go
func TestFoo(t *testing.T) {
    tests := []struct {
        name     string
        input    string
        expected string
        wantErr  bool
    }{
        {"valid", "input", "output", false},
        {"invalid", "", "", true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            // test implementation
        })
    }
}
```

### Project Structure
```
.
├── cmd/           # Main applications
├── internal/      # Private packages
├── pkg/           # Public packages (optional)
├── api/           # API definitions
├── configs/       # Configuration files
├── scripts/       # Build scripts
├── go.mod
└── README.md
```

### Documentation
- Every exported symbol must have a doc comment
- Comments are complete sentences starting with the symbol name
- Include usage examples in README

### Dependencies
- Minimize external dependencies
- Pin to specific versions in go.mod
- Run `go mod tidy` before committing
- Use `go vet` and `govulncheck` for security

### Git
- Commit messages: conventional commits format
- Single logical change per commit
- No merge commits (rebase instead)

## Security
- Never commit secrets to the repository
- Use environment variables for configuration
- Validate all inputs
- Use prepared statements for SQL
- Sanitize user-generated content
