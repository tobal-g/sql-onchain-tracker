# CLAUDE.md

This file provides guidance for Claude Code when working with this repository.

## Project Overview

W3G Onchain Service is a blockchain portfolio management system with:
- **Backend**: NestJS REST API for portfolio tracking, wallet sync, and price data
- **Frontend**: React dashboard for portfolio visualization

## Quick Commands

### Backend (root directory)

```bash
# Development
npm run start:dev          # Watch mode with hot reload

# Testing
npm test                   # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report

# Build & Production
npm run build              # Build to dist/
npm run start:prod         # Run production build

# Code Quality
npm run lint               # ESLint
npm run format             # Prettier
```

### Frontend (frontend/ directory)

```bash
cd frontend
npm run dev                # Development server (port 5173)
npm run build              # Production build
npm run lint               # ESLint
```

## Project Structure

```
├── src/                              # Backend (NestJS)
│   ├── main.ts                       # Entry point, CORS, Swagger
│   ├── app.module.ts                 # Root module
│   ├── database/database.module.ts   # PostgreSQL pool (Global)
│   ├── guards/api-key.guard.ts       # x-api-key authentication
│   ├── portfolio/                    # Zapper API integration
│   ├── sync/                         # Wallet sync to database
│   └── modules/
│       ├── yahoo-finance/            # Stock/CEDEAR price sync
│       └── manual-entry/             # CRUD for assets, positions, etc.
├── frontend/                         # React dashboard
│   └── src/
│       ├── pages/                    # Dashboard, Custodians, Positions, etc.
│       ├── components/               # Layout, common components
│       ├── hooks/                    # usePortfolio hook
│       └── api/client.ts             # Axios client
└── test/                             # E2E tests
```

## Key Patterns

### Backend

- **Module Pattern**: Each feature is a NestJS module with controller, service, and DTOs
- **Global Database**: `DatabaseModule` is global, inject with `@Inject(DATABASE_POOL)`
- **API Key Guard**: Use `@UseGuards(ApiKeyGuard)` for protected endpoints
- **Caching**: Portfolio endpoints use 90s cache via `@nestjs/cache-manager`

### Frontend

- **Data Fetching**: Use TanStack Query (React Query) for all API calls
- **Styling**: Tailwind CSS utility classes
- **Routing**: React Router v7 with pages in `src/pages/`

## Database

PostgreSQL via Neon.tech with tables:
- `assets` - Master asset list
- `custodians` - Wallets and brokers
- `positions` - Holdings (asset + custodian + quantity)
- `price_history` - Daily price snapshots
- `asset_types` - Asset classification

## External APIs

| API | Purpose | Rate Limiting |
|-----|---------|---------------|
| Zapper GraphQL | Crypto balances | SYNC_RATE_LIMIT_MS (default 1000ms) |
| Yahoo Finance | Stock/CEDEAR prices | 500ms between requests |
| DolarAPI | CCL rate for ARS-USD | On-demand |

## Environment Variables

Required:
- `ZAPPER_API_KEY` - Zapper API key
- `DATABASE_URL` - PostgreSQL connection string

Optional:
- `SYNC_API_KEY` - Protects sync endpoints (if set)
- `CORS_ORIGIN` - Frontend origin (default: http://localhost:5173)
- `CACHE_TTL` - Cache TTL in seconds (default: 90)

## Common Tasks

### Adding a new API endpoint

1. Create/update controller in appropriate module
2. Create DTO for request/response validation
3. Implement service method
4. Add Swagger decorators for documentation

### Adding a new frontend page

1. Create page component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add nav link in `frontend/src/components/layout/Sidebar.tsx`

### Running sync manually

```bash
# Sync wallet positions from Zapper
curl -X POST http://localhost:3000/sync/portfolio -H "x-api-key: YOUR_KEY"

# Sync stock prices from Yahoo Finance
curl -X POST http://localhost:3000/sync/stocks -H "x-api-key: YOUR_KEY"
```

## Testing

- Unit tests: `*.spec.ts` files alongside source
- E2E tests: `test/app.e2e-spec.ts`
- Run `npm test` for unit tests, `npm run test:e2e` for E2E

## Code Style

- TypeScript strict mode
- ESLint + Prettier for formatting
- Class-based services with dependency injection
- DTOs with class-validator decorators
