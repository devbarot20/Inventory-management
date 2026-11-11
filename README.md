# Inventory Demand Forecaster for Flash Sales

An end-to-end MVP web application designed for e-commerce shops to estimate **product demand** for upcoming flash sales (with planned TikTok influencer campaigns) as an **assumptions-driven Low / Expected / High scenario range**, compare demand against available stock, surface actionable **Low / Medium / High stockout-risk warnings**, and retrospectively track **forecast vs actual sales accuracy**.

> [!IMPORTANT]
> **Causality & Data Integrity Notice**:
> Forecasts are scenario estimates derived from historical baseline sales, similar past sales uplifts, and stated operational assumptions. They are not guaranteed. The system strictly keeps `plannedSpend` and `actualSpend` separate: ad spend is never treated as a direct causal driver of sales, and backtests never leak post-sale actuals.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS, Recharts |
| **Backend** | Node.js (v20+), Express.js (JavaScript REST API) |
| **Database** | MongoDB with Mongoose |
| **Security & Validation** | Helmet, Express Rate Limit, Zod, JWT (`jsonwebtoken`), Bcryptjs |
| **Testing & Tooling** | Jest, Supertest, MongoDB Memory Server, ESLint, Prettier |
| **Version Control** | Git + GitHub (`main`, `dev`, `feature/*` branches with Conventional Commits) |

---

## Architecture & Directory Structure

```
.
├── backend/
│   ├── scripts/
│   │   ├── backtest.js          # Time-ordered backtesting CLI script
│   │   └── seed.js              # Idempotent DB seed script with realistic demo data
│   ├── src/
│   │   ├── config/              # Environment config and MongoDB connection
│   │   ├── controllers/         # Request handlers (auth, products, sales, forecast, actuals)
│   │   ├── middleware/          # Security (Helmet, RateLimit), Auth (JWT), Validation, Error handling
│   │   ├── models/              # Mongoose schemas (User, Product, SaleEvent, Forecast, Actual, etc.)
│   │   ├── routes/              # Express API routers mounted under /api
│   │   ├── services/            # Business logic & domain services
│   │   │   ├── forecast/        # Baseline estimation, similar sale matching, spend adjustment, risk
│   │   │   ├── comparison.service.js # Forecast vs actual comparison & error metrics (MAE, WAPE)
│   │   │   └── backtest.service.js   # Time-ordered backtest evaluation engine
│   │   ├── app.js               # Express app factory (used by server and test runner)
│   │   └── server.js            # HTTP server entry point (Port 5001)
│   └── tests/                   # 14 Jest test suites (116 tests, in-memory MongoDB)
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.js          # Overview landing & feature navigation hub
│       │   ├── dashboard/       # E5: Forecast Dashboard with Recharts bar chart & risk table
│       │   ├── actuals/         # E6: Forecast vs Actuals comparison, KPIs & CSV/manual entry
│       │   ├── sales/           # E2: Flash sales planner & influencer campaign planning
│       │   ├── products/        # E1: Product catalogue & stock snapshot management
│       │   └── import/          # E1: Multi-file CSV import with row-by-row error reporting
│       ├── components/          # Reusable UI widgets (Navbar, Card, Table, RiskBadge, Charts)
│       └── lib/                 # JWT token storage and API fetch helpers
├── sample-data/                 # Ready-to-upload CSV files for manual and automated testing
│   ├── products.csv
│   ├── sales_history.csv
│   ├── stock_snapshots.csv
│   └── actuals.csv
└── docs/                        # Specifications, schema docs, and architecture reference
```

---

---

## Accounts, Plans & Data Privacy

- **Per-user data isolation**: products, stock snapshots, sales history, flash sales, forecasts and actuals are owned by the user who created them. Every read and write is scoped to the signed-in user, and other users' records return `404`. SKUs are unique per user.
- **Plans** (no payment yet; switch freely on `/pricing`):

  | Plan | Products | Campaigns | CSV import |
  | :--- | :--- | :--- | :--- |
  | Starter (default) | 25 | 3 | No |
  | Growth | 250 | 25 | Yes |
  | Scale | Unlimited | Unlimited | Yes |

  Limits are enforced by the API (`403` with `details.code` of `PLAN_LIMIT` or `PLAN_FEATURE`). `GET /api/auth/usage` returns the current plan and usage.
- **Password reset**: `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`. Links are valid for 1 hour and single-use. Set `RESEND_API_KEY` (and `MAIL_FROM`, `APP_URL`) to send real emails; without it the link is printed in the server log.
- **Email verification**: new accounts must confirm their email (`POST /api/auth/verify-email`, `POST /api/auth/resend-verification`) before using data routes, which otherwise return `403` with `details.code` `EMAIL_NOT_VERIFIED`. It is enforced automatically when `RESEND_API_KEY` is set (override with `EMAIL_VERIFICATION=true|false`), so a missing email setup never locks users out. Accounts created before the feature, and anyone who completes a password reset, count as verified.
- **Existing data from before isolation** can be assigned to one account with `node scripts/claimLegacyData.js user@example.com` (run from `backend/`).
- **Stockout risk alerts & notifications**: Live bell indicator in the Navbar (`GET /api/forecast/alerts`) lists active stockout hazards across all campaigns with quick navigation. Automated email alerts via Resend/mailer notify when a forecast run reveals high-risk items.
- **Forecasting visualisations**: Interactive toggle between Grouped Bar chart and Shaded Confidence Band (Low to High demand range, expected demand line, available stock).
- **Actuals lifecycle management**: Clear all recorded actuals or delete specific SKU entries (`DELETE /api/actuals/:saleEventId` and `DELETE /api/actuals/:saleEventId/:sku`) with automatic metric re-computation.
- **Export**: the dashboard's "Export CSV" downloads the SKU restock plan for the selected sale.
- **CI**: `.github/workflows/ci.yml` runs backend tests and frontend lint + build on every push.

---

## Prerequisites

- **Node.js** `v20.x` or higher
- **npm** `v10.x` or higher
- **MongoDB** (local service or MongoDB Atlas cluster)

---

## Quick Start (Run in 3 Steps)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/devbarot20/Inventory-management.git
cd Inventory-management

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment & Seed Data

Copy example environment variables:

```bash
# In backend/
cd backend
cp .env.example .env

# In frontend/
cd ../frontend
cp .env.example .env.local
cd ..
```

> [!NOTE]
> On macOS, port `5000` is reserved by AirPlay Receiver. The backend defaults to port `5001` and the frontend connects via `http://localhost:5001/api`.

**Seed Database with Demo Data:**

```bash
cd backend
npm run seed
```

This instantly creates:
- Demo accounts `admin@shop.com` and `manager@shop.com` (password `password123`, local development only). All demo data below belongs to `admin@shop.com`, because every record is private to its owner
- 8 Products across Apparel, Drinkware, and Accessories
- 90 days of normal sales history with natural variance
- Current stock snapshots
- 2 Completed past flash sales with recorded actuals (ready for `/actuals`)
- 1 Upcoming flash sale with pre-computed scenario forecasts (ready for `/dashboard`)

### 3. Launch Development Servers

**Terminal 1 — Backend API:**
```bash
cd backend
npm run dev
# Running on http://localhost:5001 (Health check: http://localhost:5001/api/health)
```

**Terminal 2 — Frontend Web App:**
```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Reference

| Variable | Location | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `backend/.env` | `development` | Environment mode (`development`, `test`, `production`) |
| `PORT` | `backend/.env` | `5001` | Express HTTP server port (avoids AirPlay 5000 conflict) |
| `CORS_ORIGIN` | `backend/.env` | `http://localhost:3000` | Allowed origin for frontend requests |
| `MONGODB_URI` | `backend/.env` | `mongodb://127.0.0.1:27017/inventory_forecaster` | MongoDB connection string |
| `JWT_SECRET` | `backend/.env` | `dev_jwt_secret_key_change_in_production_32chars` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | `backend/.env` | `7d` | JWT session token lifespan |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | `http://localhost:5001/api` | API endpoint base URL |

---

## Forecasting Algorithm & Methodology

The forecasting service operates through four transparent, deterministic stages without unexplainable black-box machine learning:

```
[Normal Sales History] ──> [1. Baseline Calculation] (Trimmed mean, sales & stockouts excluded)
                                   │
[Past Similar Sales]   ──> [2. Uplift Estimation] (Duration, discount & stockout filtering)
                                   │
                                   ▼
                       [3. Scenario Bounds] (Low / Expected / High range)
                                   │
[Stock Snapshots]      ──> [4. Risk & Run-Out] (High / Medium / Low + run-out timestamp)
```

### 1. Baseline Calculation
- Analyzes daily sales up to 90 days strictly prior to the upcoming sale start date.
- **Exclusion Filters**: Automatically filters out previous flash sale dates and stockout days (days where stock reached 0) to avoid artificially depressed baselines.
- Calculates a 10% trimmed mean of daily sales (or median if sample size is small) to resist anomalous spikes.
- Requires at least 7 valid normal days; otherwise flags `not_enough_data`.

### 2. Similar-Sale Uplift Matching
- Searches historical flash sales completed before the target sale date.
- Filters candidates based on configurable similarity tolerances:
  - Duration difference within $\pm 1.5$ days.
  - Discount difference within $\pm 15\%$.
  - Excludes past sales that suffered stockouts (which would understate true uplift).
- Calculates the uplift multiplier: $\text{Uplift} = \frac{\text{Sale Daily Average}}{\text{Normal Daily Baseline}}$.
- If multiple similar sales exist, calculates the average uplift and scenario spread ($[\text{low}, \text{high}]$ bounds). If no similar sales exist, applies transparent fallback ranges ($[1.2\times, 1.5\times, 2.0\times]$) and flags the assumption.

### 3. Scenario Demand Bounds
- $\text{Expected Demand} = \text{round}(\text{Baseline Daily Units} \times \text{Expected Uplift} \times \text{Duration Days})$
- $\text{Low Demand} = \text{round}(\text{Baseline Daily Units} \times \text{Low Uplift} \times \text{Duration Days})$
- $\text{High Demand} = \text{round}(\text{Baseline Daily Units} \times \text{High Uplift} \times \text{Duration Days})$

### 4. Stockout Risk Classification & Run-Out Timing
Compares the latest available stock snapshot with forecasted scenarios:
- **Low Risk**: $\text{Available Stock} \ge \text{High Demand}$ (Stock covers peak demand scenario).
- **Medium Risk**: $\text{Expected Demand} \le \text{Available Stock} < \text{High Demand}$ (Covers expected demand, but vulnerable if sale spikes).
- **High Risk**: $\text{Available Stock} < \text{Expected Demand}$ (Stockout anticipated during normal expected volume).
- **Expected Run-Out Time**: Calculated along the high-demand curve:
  $$\text{Run-Out Date} = \text{Sale Start Date} + \left( \frac{\text{Available Stock}}{\text{High Demand}} \times \text{Duration Days} \right)$$

---

## Forecast vs Actual Evaluation (E6)

After a flash sale concludes, actual units sold and actual ad spend can be recorded via manual form or CSV upload:
- **Mean Absolute Error (MAE)**: $\frac{1}{n} \sum_{i=1}^n |\text{expected}_i - \text{actual}_i|$
- **Weighted Absolute Percentage Error (WAPE)**: $\frac{\sum |\text{expected}_i - \text{actual}_i|}{\sum \text{actual}_i} \times 100\%$
- **Forecast Bias**: $\frac{\sum (\text{expected}_i - \text{actual}_i)}{\sum \text{actual}_i} \times 100\%$
  - Positive bias indicates over-forecasting; negative bias indicates under-forecasting.
- **Within-Range Coverage**: Percentage of SKUs where $\text{low}_i \le \text{actual}_i \le \text{high}_i$.
- **Stockout Warning Accuracy**: Validates whether high/medium risk alerts accurately corresponded to observed stockout events.
- **Actual Spend Tracking**: Recorded post-sale to track spend vs budget, maintaining strict separation from planned spend.

---

## Time-Ordered Backtesting Script

The backtesting script executes a strict time-ordered historical simulation across past flash sales:
- **Zero Future Data Leakage**: For each historical sale $S_k$, only sales and stock data recorded strictly before $S_k.\text{startDate}$ are accessible.
- **Naive Baseline Benchmark**: Compares model accuracy against a naive flat baseline ($\text{baselineDailyUnits} \times \text{durationDays}$) to verify whether uplift matching actually beats a steady-state assumption.

### Running the Backtest CLI

```bash
# Run against current MongoDB database:
cd backend
npm run backtest

# Run with self-contained benchmark dataset (3 historical sales, 90 days history):
npm run backtest -- --sample
```

**Example Terminal Output:**
```
================================================================================
              INVENTORY DEMAND FORECASTER - BACKTEST RUNNER (E7)                
================================================================================
SALE EVENT BREAKDOWN:
--------------------------------------------------------------------------------
Sale Name                   Window            SKUs  Actual  Naive MAE  Model MAE   Improvement  Within Range
------------------------------------------------------------------------------------------------------------
Labor Day 48h Flash Sale    09-05→09-07          2     162       54 u       41 u       +24.07%            0%
Fall Equinox Promo          09-25→09-27          3     152    33.67 u       20 u       +40.60%            0%

================================================================================
                         OVERALL BACKTEST PERFORMANCE                           
================================================================================
Evaluated Flash Sales:     2 of 3
Total SKU Forecasts:       5
Total Units Demanded:      314 units
--------------------------------------------------------------------------------
Naive Baseline MAE:        41.8 units
Model Forecast MAE:        28.4 units
MAE Error Reduction:       +32.06% improvement
--------------------------------------------------------------------------------
Naive Baseline WAPE:       66.56%
Model Forecast WAPE:       45.22%
WAPE Error Reduction:      +32.06% improvement
================================================================================
```

---

## Sample CSV Formats

Pre-formatted CSV templates are located in [`sample-data/`](file:///Users/devbarot/Downloads/RICOZ-Intern/project01/sample-data):

### 1. Products (`products.csv`)
```csv
sku,name
TSHIRT-BLK-M,Classic Black T-Shirt (Medium)
HOODIE-GRY-L,Premium Fleece Hoodie (Large)
MUG-WHT-01,Ceramic Coffee Mug (12oz)
```

### 2. Historical Daily Sales (`sales_history.csv`)
```csv
sku,date,unitsSold,price,discountPct
TSHIRT-BLK-M,2026-09-01,12,25.00,0
TSHIRT-BLK-M,2026-09-02,10,25.00,0
MUG-WHT-01,2026-09-01,16,15.00,0
```

### 3. Stock Snapshots (`stock_snapshots.csv`)
```csv
sku,date,unitsAvailable
TSHIRT-BLK-M,2026-11-01,85
HOODIE-GRY-L,2026-11-01,45
MUG-WHT-01,2026-11-01,210
```

### 4. Post-Sale Actuals (`actuals.csv`)
```csv
sku,actualUnits,stockoutOccurred
TSHIRT-BLK-M,92,true
HOODIE-GRY-L,44,false
MUG-WHT-01,98,false
```

---

## REST API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | Public | Service health & database connectivity check |
| `POST` | `/api/auth/register` | Rate-limited | Register new user account |
| `POST` | `/api/auth/login` | Rate-limited | Login and receive signed JWT |
| `GET` | `/api/auth/me` | JWT | Get current authenticated user details |
| `GET` | `/api/products` | Public | List catalogue products with current stock |
| `POST` | `/api/products` | JWT | Create a new catalog product |
| `GET` | `/api/stock` | Public | Get stock snapshots history |
| `POST` | `/api/stock` | JWT | Record a stock snapshot |
| `POST` | `/api/import/csv` | JWT | Bulk CSV import (products, sales, or snapshots) |
| `GET` | `/api/sales` | Public | List flash sale events and campaign plans |
| `POST` | `/api/sales` | JWT | Create a flash sale event |
| `GET` | `/api/forecast/latest/:saleId` | Public | Get latest forecast run and scenario estimates |
| `POST` | `/api/forecast/run/:saleId` | JWT | Execute forecasting engine for a flash sale |
| `GET` | `/api/actuals/comparison/:saleId` | Public | Get forecast vs actual error metrics (MAE, WAPE) |
| `POST` | `/api/actuals/:saleId` | JWT | Record actual units sold and actual ad spend |
| `POST` | `/api/actuals/import/:saleId` | JWT | Import actual results via CSV upload |

---

## Verification & Automated Test Commands

### Backend Tests & Code Quality
```bash
cd backend
npm test                # Runs 14 test suites (112 tests) in-memory
npm run lint            # ESLint static analysis
npm run format:check    # Prettier formatting verification
npm run backtest        # CLI time-ordered backtest evaluation
```

### Frontend Build & Code Quality
```bash
cd frontend
npm run lint            # Next.js ESLint verification
npm run build           # Production Turbopack build & SSG prerender test
```

---

## Non-Goals & Stated Limitations

To maintain a lean, robust, and transparent MVP, the following are deliberately out of scope:
- **No live TikTok Ads or Shopify API sync**: Eliminates external sync fragility, credential exposure, and network flakiness. All data ingestion is file- and REST-driven.
- **No black-box Deep Learning / AI models**: Predictions use explainable statistical baselines and uplift ratios with traceable assumptions.
- **No automated purchase order generation**: Warnings assist human inventory planners; they do not automatically execute financial transactions.
- **No billing or payment processing**: Clean operational focus on forecasting and inventory analytics.

---

## Roadmap Completion Status

1. [x] **Section 1**: Repository and project setup (Next.js + Express + Git structure)
2. [x] **Section 2**: Database and Mongoose data models (`Product`, `SalesHistory`, `StockSnapshot`, `SaleEvent`, `Forecast`, `Actual`)
3. [x] **Section 3**: Authentication and authorization (JWT, bcrypt, roles, error middleware)
4. [x] **Section 4**: Product and stock management (E1: Catalogue, snapshots, and CSV import)
5. [x] **Section 5**: Flash sale event and campaign planning (E2: Dates, discounts, planned spend, SKUs)
6. [x] **Section 6**: Forecasting service core (E3: Baseline trimmed mean, similar-sale uplift matching)
7. [x] **Section 7**: Forecast API and stockout-risk warnings (E3, E4: Run engine, risk levels, run-out times)
8. [x] **Section 8**: Interactive Forecast Dashboard (E5: Recharts visualization, KPI cards, scenario table)
9. [x] **Section 9**: Forecast vs actual comparison (E6: MAE, WAPE, Bias, Within-Range, Warning accuracy)
10. [x] **Section 10**: Time-ordered backtesting script (E7: Temporal isolation, naive baseline benchmark)
11. [x] **Section 11**: Security hardening and API testing (Helmet, rate limiting, error auditing)
12. [x] **Section 12**: Documentation, sample data, and release polish
