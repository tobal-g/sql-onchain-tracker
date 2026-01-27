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
│   ├── auth/                         # JWT authentication
│   │   ├── auth.module.ts            # Auth module (Global)
│   │   ├── auth.controller.ts        # Login/logout/refresh endpoints
│   │   ├── auth.service.ts           # JWT token management
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts     # JWT Bearer token guard
│   │   │   └── jwt-or-apikey.guard.ts # JWT or x-api-key guard
│   │   └── dto/                      # Auth DTOs
│   ├── guards/api-key.guard.ts       # Legacy x-api-key guard
│   ├── portfolio/                    # Zapper API integration (public)
│   ├── sync/                         # Wallet sync to database
│   └── modules/
│       ├── yahoo-finance/            # Stock/CEDEAR price sync
│       ├── zerion/                   # Fallback price source (SKY, etc.)
│       └── manual-entry/             # CRUD for assets, positions, etc.
│           ├── controllers/          # 6 controllers (assets, custodians, etc.)
│           ├── services/             # Business logic
│           └── dto/                  # Data transfer objects
├── frontend/                         # React dashboard
│   └── src/
│       ├── pages/                    # Login, Dashboard, Custodians, etc.
│       ├── components/               # Layout, auth, common components
│       ├── contexts/                 # AuthContext
│       ├── hooks/                    # usePortfolio hook
│       └── api/                      # client.ts, auth.ts
└── test/                             # E2E tests
```

## Key Patterns

### Backend

- **Module Pattern**: Each feature is a NestJS module with controller, service, and DTOs
- **Global Database**: `DatabaseModule` is global, inject with `@Inject(DATABASE_POOL)`
- **Global Auth**: `AuthModule` is global, guards available everywhere
- **Authentication Guards**:
  - `JwtAuthGuard` - Requires JWT Bearer token (manual entry endpoints)
  - `JwtOrApiKeyGuard` - Accepts JWT OR x-api-key header (sync endpoints)
  - No guard - Public endpoints (portfolio queries)
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
- `transactions` - Buy/sell records for cost basis tracking

## PnL Feature

The `GET /portfolio/pnl` endpoint provides profit/loss analysis:
- Cost basis calculation using Average Cost method
- Unrealized/realized P&L per asset
- APY calculation based on holding period
- Positions aggregated by asset (summed across custodians)
- **Important**: Transactions do NOT modify positions - they only record cost basis data

## Authentication

**JWT-based authentication** for frontend access:
- Password login at `POST /auth/login` (password hashed with bcrypt)
- Refresh token support at `POST /auth/refresh`
- Logout at `POST /auth/logout`
- Refresh tokens stored in httpOnly cookies

**Guard Types:**
- **JwtAuthGuard** - JWT Bearer token only (manual entry endpoints)
- **JwtOrApiKeyGuard** - JWT Bearer token OR x-api-key header (sync endpoints)
- **No auth** - Public read-only (portfolio queries)

**Development Mode:**
- If `AUTH_PASSWORD_HASH` not set, all JWT-protected endpoints are open
- If `SYNC_API_KEY` not set, sync endpoints use JWT only (or open if no auth)

## External APIs

| API | Purpose | Rate Limiting |
|-----|---------|---------------|
| Zapper GraphQL | Crypto balances | SYNC_RATE_LIMIT_MS (default 1000ms) |
| Zerion | Fallback prices (e.g., SKY token) | On-demand during sync |
| Yahoo Finance | Stock/CEDEAR prices | 500ms between requests |
| DolarAPI | CCL rate for ARS-USD | On-demand |

## Environment Variables

**Required:**
- `ZAPPER_API_KEY` - Zapper API key

**For Database Features (sync, manual entry):**
- `DATABASE_URL` - PostgreSQL connection string

**For JWT Authentication (frontend login):**
- `AUTH_PASSWORD_HASH` - Bcrypt hash of password (if not set, auth is disabled)
- `JWT_SECRET` - Secret for signing JWTs (default: dev-secret)

**Optional:**
- `SYNC_API_KEY` - API key for sync endpoints (alternative to JWT)
- `ZERION_API_KEY` - Zerion API key (base64) for fallback prices
- `CORS_ORIGIN` - Frontend origin (default: http://localhost:5173)
- `CACHE_TTL` - Cache TTL in seconds (default: 90)
- `JWT_ACCESS_EXPIRY` - Access token expiry (default: 15m)
- `JWT_REFRESH_EXPIRY` - Refresh token expiry (default: 7d)
- `DATABASE_SCHEMA` - PostgreSQL schema (default: public)

## Common Tasks

### Adding a new API endpoint

1. Create/update controller in appropriate module
2. Create DTO for request/response validation
3. Implement service method
4. Add appropriate guard (`@UseGuards(JwtAuthGuard)` or `@UseGuards(JwtOrApiKeyGuard)`)
5. Add Swagger decorators (`@ApiBearerAuth('JWT-auth')`, `@ApiOperation`, etc.)

### Adding a new frontend page

1. Create page component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Wrap with `<ProtectedRoute>` if auth required
4. Add nav link in `frontend/src/components/layout/Sidebar.tsx`

### Running sync manually

```bash
# Option 1: With API key (for automation)
curl -X POST http://localhost:3000/sync/portfolio -H "x-api-key: YOUR_KEY"
curl -X POST http://localhost:3000/sync/prices/stocks -H "x-api-key: YOUR_KEY"

# Option 2: With JWT Bearer token (for user access)
curl -X POST http://localhost:3000/sync/portfolio -H "Authorization: Bearer YOUR_TOKEN"

# Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "your-password"}'
```

### Generating password hash for AUTH_PASSWORD_HASH

```bash
# Generate bcrypt hash for password
node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
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
