# AGENTS.md - Development Guidelines

## Build/Lint/Test Commands

### Go Backend
```bash
go build ./...              # Build project
go test ./...               # Run all tests
go test -run TestName ./path/to/package  # Run single test
go test -v -run TestName ./internal/tracker  # Verbose single test
go test -cover ./...        # Run with coverage
go vet ./...                # Vet code
gofmt -w .                  # Format
goimports -w .              # Fix imports
go mod tidy                 # Tidy dependencies
go run ./cmd/app            # Run app
make run                    # Run via Makefile
```

### JavaScript Frontend
```bash
# Navigate to javascript directory
cd javascript

# Install dependencies
npm install

# Build tracker script (outputs to web/static/)
npm run build

# Development server with hot reload
npm run dev

# Run tests (Vitest)
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage

# Lint
npm run lint
```

## Code Style Guidelines

### Go Backend

#### Imports
Group: stdlib, third-party, internal. Never use dot imports.

```go
import (
    "context"
    "fmt"
    "time"

    "github.com/gorilla/mux"

    "github.com/dGilli/prassionate/internal/config"
)
```

#### Naming Conventions
- **Packages**: lowercase, single word
- **Exported**: PascalCase (`Server`, `TrackEvent`)
- **Unexported**: camelCase (`server`, `trackEvent`)
- **Interfaces**: `-er` suffix (`Tracker`, `Storer`)
- **Constants**: MixedCaps
- **Error variables**: `Err` prefix (`ErrNotFound`)

#### Error Handling
Always wrap errors with context:
```go
if err != nil {
    return fmt.Errorf("failed to track event: %w", err)
}
```

#### Types
- Prefer concrete types for return values
- Define interfaces where they are used
- Use struct tags for JSON/YAML

#### Testing
```go
func TestTrackEvent(t *testing.T) {
    tests := []struct {
        name    string
        event   Event
        wantErr bool
    }{
        {"valid pageview", Event{Type: "pageview"}, false},
        {"invalid event", Event{}, true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            err := TrackEvent(tt.event)
            if (err != nil) != tt.wantErr {
                t.Errorf("TrackEvent() error = %v", err)
            }
        })
    }
}
```

### JavaScript Frontend

#### Code Style
- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use async/await for asynchronous code
- CamelCase for variables/functions, PascalCase for classes

#### Error Handling
```javascript
try {
    await sendTrackingData(data);
} catch (error) {
    console.error('Tracking failed:', error);
    // Fail silently - tracking should not break user experience
}
```

#### Module Pattern
Use IIFE to avoid global namespace pollution:
```javascript
(function(window, document) {
    'use strict';
    // Tracker implementation
})(window, document);
```

### Project Structure
```
.
├── cmd/
│   └── app/              # Main application entry
├── internal/
│   ├── api/              # HTTP handlers
│   ├── tracker/          # Tracking logic
│   ├── storage/          # Data persistence
│   └── config/           # Configuration
├── web/
│   ├── static/           # Static assets (tracker.js)
│   └── templates/        # HTML templates
├── javascript/           # TypeScript tracker source
│   ├── tracker.ts        # Main tracker module
│   ├── tracker.test.ts   # Tests
│   ├── vite.config.ts    # Vite configuration
│   └── package.json      # JS dependencies
```

## Security Guidelines
- Never commit secrets or API keys
- Sanitize all user inputs
- Use parameterized queries for DB
- Validate tracker requests (CORS, API keys)
- Respect DoNotTrack header
- Anonymize IP addresses by default

## Git
- Conventional commits format
- Single logical change per commit
- Rebase instead of merge
