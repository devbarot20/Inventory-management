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

---

## Products & Stock Management (E1)

### `GET /api/products`

List products, sorted alphabetically by SKU. Includes current stock snapshot availability.

**Query Parameters:**
- `search` (optional): Filter by SKU or product name.

**200 OK:**

```json
{
  "products": [
    {
      "id": "67272...",
      "sku": "TEE-BLK-S",
      "name": "Black T-Shirt Small",
      "currentStock": {
        "unitsAvailable": 120,
        "date": "2026-11-01T00:00:00.000Z"
      }
    }
  ]
}
```

### `GET /api/products/:id`

Retrieve product details by database ID or SKU, including recent stock history and sales history.

### `POST /api/products`

Create a new product. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "sku": "HOODIE-GRY-L",
  "name": "Grey Hoodie Large"
}
```

**201 Created:** Returns `{ "product": { ... } }`

### `PUT /api/products/:id`

Update an existing product's SKU or name. Requires authentication.

### `DELETE /api/products/:id`

Delete a product. Requires authentication.

### `POST /api/stock`

Record or update a stock snapshot for a specific SKU on a date.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "sku": "HOODIE-GRY-L",
  "date": "2026-11-03",
  "unitsAvailable": 85
}
```

---

## CSV Import (E1)

### `POST /api/import/csv`

Upload a CSV file (`multipart/form-data`) or provide raw CSV text (`application/json`) with row-level validation.

**Headers:** `Authorization: Bearer <token>`

**Supported Types:**
- `products`: Headers: `sku,name`
- `sales_history`: Headers: `sku,date,unitsSold,price,discountPct`
- `stock_snapshots`: Headers: `sku,date,unitsAvailable`

**JSON Request (Raw text):**
```json
{
  "type": "products",
  "csvText": "sku,name\nTEE-001,White Tee\nTEE-002,Black Tee"
}
```

**Multipart Request:**
- `type`: `products` | `sales_history` | `stock_snapshots`
- `file`: CSV file

**200 OK Report:**
```json
{
  "type": "products",
  "totalRows": 5,
  "successCount": 4,
  "processedCount": 4,
  "rejectedCount": 1,
  "rejectedRows": [
    {
      "row": 3,
      "data": { "sku": "bad sku!", "name": "Shirt" },
      "reason": "Invalid SKU format"
    }
  ]
}
```

---

## Flash Sale Events & Campaigns (E2)

### `GET /api/sales`

List all flash sales ordered by start date (newest first). Includes computed duration in days and live status (`upcoming`, `active`, `completed`).

**200 OK:**

```json
{
  "saleEvents": [
    {
      "id": "6727...",
      "name": "Black Friday 2026",
      "startDate": "2026-11-27T00:00:00.000Z",
      "endDate": "2026-11-29T00:00:00.000Z",
      "durationDays": 2,
      "status": "upcoming",
      "discountPct": 35,
      "plannedSpend": 1500,
      "actualSpend": null,
      "campaignLabel": "TikTok @creator Campaign",
      "products": ["TEE-01", "CAP-01"],
      "productCount": 2,
      "createdAt": "2026-11-03T07:30:00.000Z"
    }
  ]
}
```

### `GET /api/sales/:id`

Retrieve details for a single flash sale, including enriched stock availability for all linked SKUs.

### `POST /api/sales`

Create a new flash sale. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "Weekend TikTok Flash Drop",
  "startDate": "2026-11-14T00:00:00Z",
  "endDate": "2026-11-15T00:00:00Z",
  "discountPct": 25,
  "plannedSpend": 800,
  "campaignLabel": "TikTok Creator Collaboration",
  "products": ["TEE-BLK-S", "TEE-BLK-M"]
}
```

*Note: `plannedSpend` and `actualSpend` are maintained as strictly separate fields. Forecasts use `plannedSpend` exclusively.*

**201 Created:** Returns `{ "saleEvent": { ... } }`

### `PUT /api/sales/:id`

Update a flash sale or record `actualSpend` post-sale. Requires authentication.

### `DELETE /api/sales/:id`

Delete a flash sale. Requires authentication.
