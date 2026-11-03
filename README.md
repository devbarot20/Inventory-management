# Inventory Demand Forecaster for Flash Sales

An MVP web app that helps a shop estimate **units demand per product** for an upcoming flash sale
(with planned TikTok influencer spend) as a **low / expected / high range**, compare it with
available stock, and show a **Low / Medium / High stockout-risk** warning. After the sale, the
forecast can be compared with actual sales.

> [!IMPORTANT]
> Forecasts are **estimates** based on past data and stated assumptions. They are not guaranteed
> to be accurate, and the app does **not** claim that ad spend causes sales.

## Tech stack

| Layer           | Technology                                                  |
| --------------- | ----------------------------------------------------------- |
| Frontend        | Next.js (App Router), Tailwind CSS, Recharts                |
| Backend         | Node.js + Express.js (REST API, forecasting in JavaScript)  |
| Database        | MongoDB with Mongoose                                       |
| Quality         | ESLint + Prettier, Jest + Supertest                         |
| Version control | Git + GitHub (`main`, `dev`, `feature/*` branches)          |

## Project structure

```
.
├── backend/              Express API
│   ├── src/
│   │   ├── config/       Environment + MongoDB connection
│   │   ├── controllers/  Request handlers
│   │   ├── models/       Mongoose models (see docs/DATA_MODELS.md)
│   │   ├── routes/       Route definitions (mounted under /api)
│   │   ├── app.js        Express app factory (used by server + tests)
│   │   └── server.js     HTTP server entry point
│   └── tests/            Jest + Supertest tests (in-memory MongoDB)
├── frontend/             Next.js app (App Router, src/ directory)
│   └── src/
│       ├── app/          Pages and layouts
│       ├── components/   Reusable UI components
│       └── lib/          API client helpers
└── docs/                 Additional documentation
```

## Prerequisites

- Node.js **20+** and npm
- MongoDB (local or Atlas) — required from Section 2 onward

## Getting started

### 1. Clone

```bash
git clone https://github.com/devbarot20/Inventory-management.git
cd Inventory-management
```

### 2. Start MongoDB

Local install via Homebrew (macOS):

```bash
brew services start mongodb-community@7.0   # stop with: brew services stop mongodb-community@7.0
```

Or use a MongoDB Atlas connection string in `MONGODB_URI`.

### 3. Backend (Express API)

```bash
cd backend
cp .env.example .env      # adjust values if needed
npm install
npm run dev               # http://localhost:5001/api/health
```

The API connects to MongoDB on startup and exits with a clear message if it cannot.

### 4. Frontend (Next.js)

In a second terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

The home page calls `GET /api/health` and shows whether the API is **Online** or **Offline**, and
the database connection state.

## Environment variables

| File                   | Variable              | Default                      | Purpose                   |
| ---------------------- | --------------------- | ---------------------------- | ------------------------- |
| `backend/.env`         | `NODE_ENV`            | `development`                | Runtime environment       |
| `backend/.env`         | `PORT`                | `5001`                       | API port                  |
| `backend/.env`         | `CORS_ORIGIN`         | `http://localhost:3000`      | Allowed frontend origin   |
| `backend/.env`         | `MONGODB_URI`         | `mongodb://127.0.0.1:27017/inventory_forecaster` | MongoDB connection (required in production) |
| `backend/.env`         | `JWT_SECRET`          | _(set in production)_        | JWT signing secret                              |
| `backend/.env`         | `JWT_EXPIRES_IN`      | `7d`                         | JWT validity expiration                         |
| `frontend/.env.local`  | `NEXT_PUBLIC_API_URL` | `http://localhost:5001/api`  | Base URL of the API                             |

Secrets live only in `.env` files, which are git-ignored. Only `.env.example` files are committed.

> [!NOTE]
> The API uses port **5001** because on macOS port 5000 is taken by the AirPlay Receiver
> (Control Center). If you change `PORT`, update `NEXT_PUBLIC_API_URL` and restart the frontend.

## Scripts

| Location    | Command                 | Description                     |
| ----------- | ----------------------- | ------------------------------- |
| `backend/`  | `npm run dev`           | Start API with file watching    |
| `backend/`  | `npm start`             | Start API                       |
| `backend/`  | `npm test`              | Run Jest tests (uses an in-memory MongoDB) |
| `backend/`  | `npm run lint`          | ESLint                          |
| `backend/`  | `npm run format`        | Prettier (write)                |
| `frontend/` | `npm run dev`           | Start Next.js dev server        |
| `frontend/` | `npm run build`         | Production build                |
| `frontend/` | `npm run lint`          | ESLint                          |
| `frontend/` | `npm run format`        | Prettier (write)                |

## Git workflow

- `main` — stable releases
- `dev` — integration branch
- `feature/NN-name` — one branch per section, merged into `dev` after approval
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `chore:`, `test:`, `docs:`)

## Roadmap

1. ✅ Repository and project setup
2. ✅ Database and data models
3. ✅ Authentication and authorization
4. ✅ Product and stock management (E1)
5. ✅ Sale event and campaign plan (E2)
6. Forecasting service (E3)
7. Forecast API and stockout-risk warning (E3, E4)
8. Dashboard (E5)
9. Forecast vs actual comparison (E6)
10. Backtesting script
11. Testing, security and cleanup
12. Documentation and final polish

