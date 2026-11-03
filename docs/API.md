# API Notes

Base URL: `http://localhost:5001/api`

All responses are JSON.

## Error Handling

Standard error format:

```json
{
  "error": {
    "message": "Human-readable message"
  }
}
```

Validation error format (HTTP 400):

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address"
      }
    ]
  }
}
```

Standard HTTP status codes used:
- `200 OK`: Request succeeded
- `201 Created`: Resource created
- `400 Bad Request`: Input validation failed or malformed JSON
- `401 Unauthorized`: Missing or invalid JWT authentication token
- `403 Forbidden`: Role does not have required permissions
- `404 Not Found`: Route or entity not found
- `409 Conflict`: Duplicate unique key (e.g. email or SKU)
- `500 Internal Server Error`: Unexpected server exception

---

## Health

### `GET /api/health`

Liveness and database connectivity check. No authentication required.

**200 OK**

```json
{
  "status": "ok",
  "service": "inventory-forecaster-api",
  "environment": "development",
  "database": "connected",
  "uptimeSeconds": 12,
  "timestamp": "2026-11-03T07:15:00.000Z"
}
```

---

## Authentication & Authorization

All authenticated requests must include the header:
```http
Authorization: Bearer <jwt_token>
```

### `POST /api/auth/register`

Register a new user account. Passwords are saved with bcrypt hashing.

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "role": "user"
}
```
* `role` is optional (defaults to `"user"`, choices: `"user"`, `"admin"`).

**201 Created:**

```json
{
  "user": {
    "id": "6727289b...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "createdAt": "2026-11-03T07:15:00.000Z",
    "updatedAt": "2026-11-03T07:15:00.000Z"
  },
  "token": "eyJhbGciOi..."
}
```

### `POST /api/auth/login`

Authenticate with email and password to receive a JWT.

**Request Body:**

```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**200 OK:**

```json
{
  "user": {
    "id": "6727289b...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOi..."
}
```

### `GET /api/auth/me`

Retrieve current authenticated user profile. Requires valid token.

**Headers:**
`Authorization: Bearer <token>`

**200 OK:**

```json
{
  "user": {
    "id": "6727289b...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  }
}
```

### `GET /api/auth/admin-check`

Verify administrative permissions. Requires valid token and `admin` role. Returns 403 Forbidden for non-admins.

**Headers:**
`Authorization: Bearer <token>`

**200 OK:**

```json
{
  "ok": true,
  "message": "Admin access granted",
  "user": { ... }
}
```
