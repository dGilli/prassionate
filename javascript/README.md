# Prassionate Tracker (JavaScript/TypeScript)

Privacy-focused web analytics tracker built with TypeScript and Vite.

## Development Workflow

To test the tracker with the Go backend:

### 1. Start the Go Server

```bash
# In project root
go run ./cmd/app
```

The Go server runs on port 8080 and provides:
- `POST /api/track` - Receives tracking events
- `GET /static/tracker.iife.js` - The compiled tracker script

### 2. Start Vite Dev Server

```bash
# In javascript directory
cd javascript
npm install  # if not already done
npm run dev
```

The Vite dev server runs on port 5173 and serves:
- `index.html` - Test page with buttons to trigger tracking events
- Hot reload for tracker.ts changes

### 3. Test the Integration

1. Open http://localhost:5173 (Vite dev server)
2. Click the buttons on the test page
3. Watch the Go server terminal - you should see the tracking events logged

## Build for Production

```bash
npm run build
```

This outputs to `../web/static/`:
- `tracker.iife.js` - For direct browser use
- `tracker.js` - ES module
- `tracker.umd.cjs` - UMD format

## Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Usage on Websites

```html
<script src="http://your-server:8080/static/tracker.iife.js"></script>
<script>
  prassionate.track('pageview');
  prassionate.track('button_click', { button: 'signup' });
</script>
```

## API

- `prassionate.track(event, properties)` - Track custom events
- `prassionate.trackGoal(id, value)` - Track goal conversions
- `prassionate.trackEcommerce(orderId, revenue, products)` - Track ecommerce

## Configuration

Via data attributes:

```html
<script 
  src="http://localhost:8080/static/tracker.iife.js"
  data-endpoint="http://localhost:8080/api/track"
  data-site-id="my-site"
></script>
```
