# Prassionate

Privacy-focused web analytics platform written in Go.

## Quick Start

```bash
# Run backend
make run

# Or directly
go run ./cmd/app
```

## Usage

Add the tracker to your website:

```html
<script src="http://your-server/static/tracker.js"></script>
<script>
  prassionate.track('pageview');
</script>
```

## Roadmap

- [ ] Implement db data storage
- [ ] Run it in production
