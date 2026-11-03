# API Notes

Base URL: `http://localhost:5001/api`

All responses are JSON. Errors use the shape:

```json
{ "error": { "message": "Human-readable message" } }
```

## Health

### `GET /api/health`

Liveness check. No authentication.

**200 OK**

```json
{
  "status": "ok",
  "service": "inventory-forecaster-api",
  "environment": "development",
  "uptimeSeconds": 12,
  "timestamp": "2026-11-03T06:40:00.000Z"
}
```

_More endpoints will be documented as they are added in later sections._

