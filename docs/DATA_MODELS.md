# Data Models

MongoDB collections managed with Mongoose (`backend/src/models`). All documents have
`createdAt` / `updatedAt` timestamps and are serialised with `id` instead of `_id`.

## Conventions

| Rule        | Detail                                                                              |
| ----------- | ----------------------------------------------------------------------------------- |
| SKU         | Trimmed and upper-cased; letters, digits, `-`, `_`; max 64 chars (`TEE-001`)        |
| Daily dates | `SalesHistory.date` and `StockSnapshot.date` are normalised to **midnight UTC**     |
| Units       | Whole numbers, never negative                                                       |
| Money       | Never negative (single shop currency assumed)                                       |
| Discount    | `discountPct`, 0–100                                                                |

## Collections

### User

| Field      | Type   | Notes                                           |
| ---------- | ------ | ----------------------------------------------- |
| `name`     | String | required                                        |
| `email`    | String | required, unique, lower-cased                   |
| `password` | String | bcrypt hash (Section 3); `select: false`, never returned in JSON |
| `role`     | String | `admin` \| `user` (default `user`)              |

### Product

| Field       | Type     | Notes             |
| ----------- | -------- | ----------------- |
| `sku`       | String   | required, unique  |
| `name`      | String   | required          |
| `createdBy` | ObjectId | → User (optional) |

### SalesHistory (collection `saleshistory`)

One row per SKU per day. Index: unique `{ sku, date }`, plus `{ date }`.

| Field         | Type   | Notes              |
| ------------- | ------ | ------------------ |
| `sku`         | String | required           |
| `date`        | Date   | required, UTC day  |
| `unitsSold`   | Number | required, int ≥ 0  |
| `price`       | Number | optional, ≥ 0      |
| `discountPct` | Number | 0–100, default 0   |

Whether a day was part of a past flash sale is derived from `SaleEvent` date ranges.

### StockSnapshot

Index: unique `{ sku, date }`, plus `{ date }`. `unitsAvailable = 0` marks a **stockout day**.

| Field            | Type   | Notes             |
| ---------------- | ------ | ----------------- |
| `sku`            | String | required          |
| `date`           | Date   | required, UTC day |
| `unitsAvailable` | Number | required, int ≥ 0 |

### SaleEvent

A past or upcoming flash sale. Index: `{ startDate, endDate }`, `{ products }`.

| Field           | Type     | Notes                                           |
| --------------- | -------- | ----------------------------------------------- |
| `name`          | String   | required                                        |
| `startDate`     | Date     | required                                        |
| `endDate`       | Date     | required, ≥ `startDate`                         |
| `discountPct`   | Number   | 0–100                                           |
| `plannedSpend`  | Number   | ≥ 0, default 0 — **the only spend used by forecasts/backtests** |
| `actualSpend`   | Number   | ≥ 0, `null` until known — kept separate         |
| `campaignLabel` | String   | e.g. influencer / campaign name                 |
| `products`      | [String] | linked SKUs, no duplicates                      |
| `createdBy`     | ObjectId | → User                                          |

Virtual: `durationDays`.

### ForecastRun

One execution of the forecasting service. Index: `{ saleEvent, createdAt: -1 }`.

| Field              | Type     | Notes                                                 |
| ------------------ | -------- | ----------------------------------------------------- |
| `saleEvent`        | ObjectId | required → SaleEvent                                  |
| `createdBy`        | ObjectId | → User                                                |
| `status`           | String   | `completed` \| `failed`                               |
| `methodVersion`    | String   | e.g. `baseline-similar-sales-v1`                      |
| `inputs`           | Object   | snapshot of dates, discount, planned spend, SKUs      |
| `config`           | Mixed    | lookback window, tolerances, optional spend flag      |
| `assumptions`      | [String] | human-readable assumptions shown on the dashboard     |
| `dataQualityFlags` | [String] | e.g. "demand possibly understated"                    |
| `errorMessage`     | String   | set when `status = failed`                            |

### Forecast

Per-SKU result within a run. Index: unique `{ forecastRun, sku }`, `{ saleEvent, sku }`, `{ sku }`.

| Field                         | Type     | Notes                                               |
| ----------------------------- | -------- | --------------------------------------------------- |
| `forecastRun`, `saleEvent`    | ObjectId | required                                            |
| `sku`                         | String   | required                                            |
| `status`                      | String   | `ok` \| `not_enough_data`                           |
| `low`, `expected`, `high`     | Number   | ≥ 0; required and ordered when `status = ok`, else `null` |
| `unitsAvailable`              | Number   | stock compared against                              |
| `riskLevel`                   | String   | `low` \| `medium` \| `high` \| `null`               |
| `expectedRunOutTime`          | Date     | run-out time in the high case (`null` if none)      |
| `baselineDailyUnits`          | Number   | baseline used                                       |
| `upliftRatio`                 | Number   | uplift applied                                      |
| `similarSalesUsed`            | Number   | number of similar past sales                        |
| `assumptions`, `dataQualityFlags` | [String] |                                                 |

### Actual

Post-sale results. Index: unique `{ saleEvent, sku }`, `{ sku }`.

| Field              | Type     | Notes                                       |
| ------------------ | -------- | ------------------------------------------- |
| `sku`              | String   | required                                    |
| `saleEvent`        | ObjectId | required                                    |
| `forecast`         | ObjectId | → Forecast compared against                 |
| `actualUnits`      | Number   | required, int ≥ 0                           |
| `stockoutOccurred` | Boolean  | default `false`                             |
| `errorMeasures`    | Object   | `error` (expected − actual), `absoluteError`, `withinRange`, `warningCorrect`, `unitsShort`, `unitsLeftOver` |

Aggregate measures (MAE, bias, WAPE) are computed per sale from these rows in Section 9.

