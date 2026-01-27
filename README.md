# w3g-onchain-service

A blockchain portfolio management REST API built with NestJS that provides comprehensive wallet analytics, portfolio tracking, and automated database synchronization across multiple blockchain networks. It aggregates data from the Zapper Protocol via GraphQL and Yahoo Finance API to deliver real-time information about token balances, DeFi positions, NFT holdings, claimable rewards, portfolio totals, and stock/CEDEAR prices. Includes a React dashboard for portfolio visualization.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Portfolio Endpoints](#portfolio-endpoints)
  - [Manual Entry Endpoints](#manual-entry-endpoints)
  - [Sync Endpoints](#sync-endpoints)
- [Database Schema](#database-schema)
- [Frontend Dashboard](#frontend-dashboard)
- [Integration Examples](#integration-examples)
- [Supported Chains](#supported-chains)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Future Feature Considerations](#future-feature-considerations)

---

## Overview

This service enables Web3 applications to display detailed wallet portfolio information through a clean REST API interface. It acts as a middleware layer between your application and the Zapper GraphQL API, while also providing automated synchronization to a PostgreSQL database for persistent tracking of positions and prices.

### Primary Use Cases

1. **Portfolio Querying**: Real-time wallet analytics via REST API
2. **Database Synchronization**: Automated daily sync of wallet holdings to PostgreSQL for historical tracking and analysis
3. **Price History**: Daily price snapshots for all tracked assets (crypto via Zapper, stocks/CEDEARs via Yahoo Finance)
4. **Manual Portfolio Management**: Track assets, custodians, positions, and transactions via CRUD endpoints
5. **Dashboard Visualization**: React frontend for portfolio overview with charts and data visualization

### Key Capabilities

- **Cached responses** (90-second TTL) to reduce external API calls
- **Type-safe DTOs** with validation
- **Simplified REST endpoints** instead of raw GraphQL queries
- **Aggregated portfolio views** across multiple chains
- **Multi-wallet support** including both EVM (Ethereum, Base, Polygon, etc.) and Bitcoin wallets
- **PostgreSQL integration** via Neon.tech for persistent data storage
- **API key authentication** for protected endpoints
- **Rate limiting** to respect external API quotas

---

## Core Features

### 1. Portfolio API Module
Provides read-only REST endpoints to query wallet portfolios in real-time:
- Token balances across networks
- DeFi application positions (lending, staking, liquidity pools)
- NFT holdings with metadata and valuations
- Claimable rewards and airdrops
- Position breakdown by type (SUPPLIED, BORROWED, CLAIMABLE, etc.)

### 2. Sync Module
Automated synchronization of wallet holdings to PostgreSQL:
- Fetches all tracked wallets from database
- Queries Zapper API for each wallet
- Upserts positions and daily prices
- Supports both EVM and Bitcoin wallets
- Rate-limited to prevent API throttling
- Protected by optional API key authentication

### 3. Database Module
PostgreSQL connection management:
- Connection pooling via `pg` library
- SSL support for Neon.tech
- Global module pattern for shared database access

### 4. Manual Entry Module
Full CRUD operations for manual portfolio management:
- **Assets**: Master list of trackable assets with symbol, name, and type
- **Custodians**: Wallets and brokers holding assets
- **Positions**: Current holdings (quantity per asset per custodian)
- **Transactions**: Transaction logging for cost basis tracking (does not modify positions)
- **Portfolio PnL**: Profit/Loss calculation with cost basis, unrealized/realized gains, and APY
- **Asset Types**: Asset classification (Crypto, Stock, CEDEAR, etc.)
- **Portfolio Summary**: Aggregated portfolio overview with breakdowns

### 5. Yahoo Finance Module
Stock and CEDEAR price synchronization:
- Fetches prices for assets with `price_api_source = 'yahoofinance'`
- Supports CEDEAR detection (tickers ending with `.BA`)
- Converts ARS prices to USD using CCL rate from DolarAPI
- Daily price history updates

### 6. Zerion Module
Fallback price source for tokens Zapper cannot track:
- Integrated into `/sync/portfolio` endpoint
- Fetches prices for assets with `price_api_source = 'zerion'`
- Uses Zerion's `/fungibles/{id}` endpoint for price data
- Gracefully skips if `ZERION_API_KEY` not configured

### 7. Authentication Module
JWT-based authentication for frontend access:
- Login/logout/refresh endpoints (`/auth/login`, `/auth/logout`, `/auth/refresh`)
- JWT access tokens with Bearer auth
- Refresh tokens stored in httpOnly cookies
- Bcrypt password hashing
- **JwtAuthGuard**: Protects manual entry endpoints (requires Bearer token)
- **JwtOrApiKeyGuard**: Protects sync endpoints (accepts Bearer token OR x-api-key)
- Optional in development (if `AUTH_PASSWORD_HASH` not set, auth is disabled)

### 8. Frontend Dashboard
React-based portfolio visualization:
- Portfolio overview with total value and statistics
- Charts: allocation by type, by custodian, top holdings
- Pages for managing custodians, positions, assets, and transactions
- Real-time data fetching with React Query

---

## Technologies

### Backend Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | NestJS | 11.x | Progressive Node.js framework |
| Language | TypeScript | 5.7.x | Type-safe development |
| HTTP Client | Axios | 1.12.x | GraphQL requests to Zapper |
| Database | PostgreSQL | - | Data persistence (via Neon.tech) |
| DB Client | pg | 8.16.x | PostgreSQL connection |
| Caching | cache-manager | 7.x | In-memory response caching |
| Validation | class-validator | 0.14.x | DTO validation |
| Documentation | Swagger/OpenAPI | 11.x | API documentation |
| Config | @nestjs/config | 4.x | Environment configuration |
| Price Data | yahoo-finance2 | 3.11.x | Stock and CEDEAR price fetching |

### Frontend Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | React | 19.x | UI library |
| Language | TypeScript | 5.9.x | Type-safe development |
| Build Tool | Vite | 7.x | Fast build tooling |
| Routing | React Router | 7.x | Client-side routing |
| Data Fetching | TanStack Query | 5.x | Server state management |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Charting | Recharts | 3.6.x | Data visualization |

### External APIs

| API | Purpose |
|-----|---------|
| Zapper Protocol | Blockchain portfolio data via GraphQL |
| Yahoo Finance | Stock and CEDEAR prices |
| DolarAPI | CCL exchange rate for ARS-USD conversion |

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              w3g-onchain-service                                   │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │ Auth Module  │  │  Portfolio  │  │Sync Module  │  │Manual Entry │  │  Yahoo  ││
│  │   (Global)   │  │   Module    │  │             │  │   Module    │  │ Finance ││
│  │ • JWT Login  │  │• Zapper API │  │• Wallet Sync│  │• Assets     │  │ Module  ││
│  │ • Logout     │  │• Caching    │  │• Price Sync │  │• Custodians │  │• Stocks ││
│  │ • Refresh    │  │• Public     │  │• Protected  │  │• Positions  │  │• CEDEARs││
│  │ • Guards     │  │             │  │             │  │• Protected  │  │         ││
│  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬────┘│
│         │                 │                 │                 │              │     │
│         │                 │                 │                 │              │     │
│         └─────────────────┴─────────────────┴─────────────────┴──────────────┘     │
│                                             │                                      │
│                                             ▼                                      │
│                    ┌────────────────────────────────────────────────┐             │
│                    │       Database Module (Global)                 │             │
│                    │       PostgreSQL Pool • SSL/Neon.tech          │             │
│                    └────────────────────────────────────────────────┘             │
│                                                                                    │
├───────────────────────────────────────────────────────────────────────────────────┤
│                              External Services                                     │
├─────────────────┬──────────────────┬─────────────────┬────────────────────────────┤
│  Zapper GraphQL │  Yahoo Finance   │   DolarAPI      │   PostgreSQL (Neon)        │
│  Crypto Data    │  Stock Prices    │   CCL Rate      │   Portfolio DB             │
└─────────────────┴──────────────────┴─────────────────┴────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React)                                      │
├───────────────────────────────────────────────────────────────────────────────────┤
│  Login │ Dashboard │ Custodians │ Positions │ Assets │ Transactions               │
│  ────────────────────────────────────────────────────────────────────             │
│  React 19 • TanStack Query • Tailwind CSS • Recharts • AuthContext                │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Portfolio API Flow**:
   - Client → REST API → PortfolioController → PortfolioService → Zapper GraphQL → Response (cached)

2. **Sync Flow**:
   - Scheduler (n8n) → POST /sync/portfolio → SyncController → SyncService
   - SyncService → PostgreSQL (get wallets) → Zapper API (get balances) → PostgreSQL (upsert)

---

## Project Structure

```
├── src/                                  # Backend source code (NestJS)
│   ├── main.ts                           # Application entry point
│   ├── app.module.ts                     # Root module
│   ├── app.controller.ts                 # Health check endpoint (GET /)
│   ├── database/
│   │   └── database.module.ts            # PostgreSQL connection pool (Global)
│   ├── auth/                             # Authentication module (Global)
│   │   ├── auth.module.ts                # JWT auth configuration
│   │   ├── auth.controller.ts            # Login/logout/refresh endpoints
│   │   ├── auth.service.ts               # JWT token management
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         # JWT Bearer token guard
│   │   │   └── jwt-or-apikey.guard.ts    # JWT or x-api-key guard
│   │   └── dto/                          # Auth DTOs
│   ├── guards/
│   │   └── api-key.guard.ts              # Legacy x-api-key guard
│   ├── portfolio/
│   │   ├── portfolio.module.ts           # Portfolio feature module
│   │   ├── portfolio.controller.ts       # 7 REST endpoints for Zapper queries
│   │   ├── portfolio.service.ts          # GraphQL queries to Zapper API
│   │   └── dto/
│   │       └── portfolio.dto.ts          # 25+ Data Transfer Objects
│   ├── sync/
│   │   ├── sync.module.ts                # Sync feature module
│   │   ├── sync.controller.ts            # POST /sync/portfolio endpoint
│   │   ├── sync.service.ts               # Wallet sync logic
│   │   └── dto/
│   │       └── sync-response.dto.ts      # Sync response DTOs
│   └── modules/
│       ├── yahoo-finance/
│       │   ├── yahoo-finance.module.ts   # Yahoo Finance module
│       │   ├── yahoo-finance.controller.ts # POST /sync/prices/stocks endpoint
│       │   ├── yahoo-finance.service.ts  # Stock/CEDEAR price fetching
│       │   └── dto/
│       ├── zerion/
│       │   ├── zerion.module.ts          # Zerion module
│       │   └── zerion.service.ts         # Fallback price fetching
│       └── manual-entry/
│           ├── manual-entry.module.ts    # Manual entry feature module
│           ├── controllers/
│           │   ├── assets.controller.ts
│           │   ├── custodians.controller.ts
│           │   ├── positions.controller.ts
│           │   ├── transactions.controller.ts
│           │   ├── asset-types.controller.ts
│           │   └── portfolio-summary.controller.ts
│           ├── services/                 # Business logic for each controller
│           └── dto/                      # Data transfer objects
├── frontend/                             # React frontend
│   ├── src/
│   │   ├── main.tsx                      # React entry point
│   │   ├── App.tsx                       # Root component with routing
│   │   ├── pages/
│   │   │   ├── Login.tsx                 # Login page
│   │   │   ├── Dashboard.tsx             # Portfolio overview with charts
│   │   │   ├── Custodians.tsx
│   │   │   ├── Positions.tsx
│   │   │   ├── Assets.tsx
│   │   │   └── Transactions.tsx
│   │   ├── components/
│   │   │   ├── layout/                   # Layout and Sidebar
│   │   │   ├── auth/                     # ProtectedRoute component
│   │   │   ├── common/                   # LoadingSpinner, Toast, ErrorBoundary
│   │   │   └── positions/                # Position-related components
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx           # Authentication context
│   │   ├── hooks/
│   │   │   └── usePortfolio.ts           # Portfolio data fetching hook
│   │   ├── api/
│   │   │   ├── client.ts                 # Axios HTTP client
│   │   │   └── auth.ts                   # Auth API calls
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript types
│   │   └── utils/                        # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── test/                                 # E2E tests
└── prds-and-docs/                        # Product requirement documents
```

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd w3g-onchain-service

# Install dependencies
yarn install

# Or with npm
npm install
```

---

## Configuration

Create a `.env` file in the project root with the following variables:

```env
# ============================================
# ZAPPER API CONFIGURATION (Required)
# ============================================
ZAPPER_API_KEY=your_zapper_api_key_here

# Optional: Override Zapper endpoint (defaults to https://public.zapper.xyz/graphql)
# ZAPPER_API_URL=https://public.zapper.xyz/graphql

# ============================================
# DATABASE CONFIGURATION (Required for sync)
# ============================================
# Neon.tech PostgreSQL connection string
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# ============================================
# SERVER CONFIGURATION (Optional)
# ============================================
# Server port (defaults to 3000)
PORT=3000

# Cache TTL in seconds (defaults to 90)
CACHE_TTL=90

# ============================================
# SYNC CONFIGURATION (Optional)
# ============================================
# API key for sync endpoint authentication
# Leave unset in development for open access
SYNC_API_KEY=your_secret_sync_api_key

# Delay between wallet syncs in milliseconds (defaults to 1000)
# Helps prevent Zapper API rate limiting
SYNC_RATE_LIMIT_MS=1000

# ============================================
# ZERION API CONFIGURATION (Optional)
# ============================================
# API key for Zerion API (base64 encoded)
# Used as fallback price source for tokens Zapper can't track
# Set price_api_source='zerion' on assets that need it
ZERION_API_KEY=your_zerion_api_key_base64

# ============================================
# CORS CONFIGURATION (Optional)
# ============================================
# Frontend origin for CORS (defaults to http://localhost:5173)
CORS_ORIGIN=http://localhost:5173
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZAPPER_API_KEY` | Yes | - | API key for Zapper GraphQL API |
| `ZAPPER_API_URL` | No | `https://public.zapper.xyz/graphql` | Zapper API endpoint |
| `DATABASE_URL` | For sync/manual entry | - | PostgreSQL connection string |
| `DATABASE_SCHEMA` | No | `public` | PostgreSQL schema name |
| `AUTH_PASSWORD_HASH` | No | - | Bcrypt hash of password (if unset, auth is disabled) |
| `JWT_SECRET` | No | `dev-secret-change-in-production` | Secret for signing JWT tokens |
| `JWT_ACCESS_EXPIRY` | No | `15m` | JWT access token expiry (e.g., 15m, 1h, 7d) |
| `JWT_REFRESH_EXPIRY` | No | `7d` | JWT refresh token expiry |
| `SYNC_API_KEY` | No | - | API key for sync endpoints (alternative to JWT) |
| `SYNC_RATE_LIMIT_MS` | No | `1000` | Delay between wallet syncs |
| `ZERION_API_KEY` | No | - | Zerion API key (base64) for fallback price source |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Frontend origin for CORS |
| `PORT` | No | `3000` | Server port |
| `CACHE_TTL` | No | `90` | Cache TTL in seconds |

---

## Running the Service

```bash
# Development (watch mode)
yarn start:dev

# Production build
yarn build
yarn start:prod

# Debug mode
yarn start:debug
```

The server runs on `http://localhost:3000` by default.

---

## API Reference

### Health Check

```http
GET /
```

Returns "Hello World!" for liveness checks.

**Response:** `200 OK`
```
Hello World!
```

---

### Authentication Endpoints

**Authentication:** Not required (public endpoints)

#### Login

```http
POST /auth/login
```

Authenticate with password and receive JWT access token.

**Request Body:**
```json
{
  "password": "your-password"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Note:** Refresh token is automatically set as httpOnly cookie.

**Status Codes:**
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid password

---

#### Refresh Token

```http
POST /auth/refresh
```

Refresh access token using the refresh token cookie.

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Status Codes:**
- `200 OK` - Token refreshed
- `401 Unauthorized` - Invalid or missing refresh token

---

#### Logout

```http
POST /auth/logout
```

Clear authentication tokens.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Portfolio Endpoints

**Authentication:** Not required (public read-only endpoints)

All portfolio endpoints accept a wallet address as a URL parameter. Supports both EVM addresses (`0x...`) and Bitcoin addresses (`bc1...`).

#### Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `chainIds` | number[] | Filter by chain IDs (e.g., 1=Ethereum, 8453=Base, 137=Polygon) |
| `first` | number | Pagination limit (default: 25) |
| `minBalanceUSD` | number | Minimum USD balance filter |

---

#### Token Balances

```http
GET /portfolio/:address/tokens
```

Returns token balances across networks.

**Response:**
```json
{
  "totalBalanceUSD": 251379.08,
  "totalCount": 6443,
  "byToken": [
    {
      "symbol": "ETH",
      "tokenAddress": "0x0000000000000000000000000000000000000000",
      "balance": 10.5,
      "balanceUSD": 31298.93,
      "price": 2980.85,
      "name": "Ethereum",
      "imgUrlV2": "https://...",
      "network": { "name": "Base" }
    }
  ]
}
```

---

#### DeFi App Positions

```http
GET /portfolio/:address/apps
```

Returns DeFi application positions (lending, staking, liquidity pools, etc.).

**Response:**
```json
{
  "totalBalanceUSD": 4410.54,
  "byApp": [
    {
      "balanceUSD": 1500.00,
      "app": {
        "displayName": "Aave V3",
        "slug": "aave-v3",
        "imgUrl": "https://...",
        "description": "...",
        "url": "https://app.aave.com",
        "category": { "name": "Lending" }
      },
      "network": { "name": "Ethereum", "chainId": 1 },
      "positionBalances": [...]
    }
  ]
}
```

---

#### NFT Holdings

```http
GET /portfolio/:address/nfts
```

Returns NFT holdings with metadata and estimated valuations.

**Response:**
```json
{
  "totalBalanceUSD": 62906.44,
  "totalTokensOwned": "150",
  "byToken": [
    {
      "lastReceived": 1673456789,
      "token": {
        "tokenId": "1234",
        "name": "Cool NFT #1234",
        "description": "...",
        "estimatedValue": { "valueUsd": 5000.00 },
        "collection": { "name": "Cool Collection", "address": "0x..." },
        "mediasV3": { "images": { "edges": [...] } }
      }
    }
  ]
}
```

---

#### Portfolio Totals

```http
GET /portfolio/:address/totals
```

Returns aggregated portfolio values across all asset types.

**Response:**
```json
{
  "tokenBalances": {
    "totalBalanceUSD": 225590.10,
    "byNetwork": [
      { "network": { "name": "Base", "chainId": 8453 }, "balanceUSD": 221754.19 }
    ]
  },
  "appBalances": {
    "totalBalanceUSD": 4410.54,
    "byNetwork": [...]
  },
  "nftBalances": {
    "totalBalanceUSD": 62906.44,
    "byNetwork": [...]
  },
  "totalPortfolioValue": 292907.08
}
```

---

#### Claimable Tokens

```http
GET /portfolio/:address/claimables
```

Returns tokens available to claim (rewards, airdrops, incentives).

**Response:**
```json
{
  "totalClaimableUSD": 150.25,
  "claimables": [
    {
      "app": { "displayName": "Uniswap", "slug": "uniswap" },
      "network": { "name": "Ethereum", "chainId": 1 },
      "address": "0x...",
      "balanceUSD": 75.00,
      "claimableTokens": [
        { "metaType": "CLAIMABLE", "token": { "symbol": "UNI", "balance": 10.5 } }
      ]
    }
  ]
}
```

---

#### Position Breakdown

```http
GET /portfolio/:address/breakdown
```

Returns breakdown by position types.

**Response:**
```json
{
  "totalCount": 3,
  "byMetaType": [
    { "metaType": "SUPPLIED", "positionCount": 5, "balanceUSD": 10000.00 },
    { "metaType": "BORROWED", "positionCount": 2, "balanceUSD": 3000.00 },
    { "metaType": "CLAIMABLE", "positionCount": 3, "balanceUSD": 150.25 }
  ]
}
```

---

#### Complete Portfolio

```http
GET /portfolio/:address
```

Returns complete portfolio overview (all data above in a single response). Executes all queries in parallel for optimal performance.

**Response:**
```json
{
  "tokens": { ... },
  "apps": { ... },
  "nfts": { ... },
  "totals": { ... },
  "claimables": { ... },
  "breakdown": { ... }
}
```

---

### Manual Entry Endpoints

**Authentication:** Required - JWT Bearer token via `Authorization: Bearer <token>` header

**Development Mode:** If `AUTH_PASSWORD_HASH` is not set in environment, authentication is disabled and all endpoints are open.

All manual entry endpoints use `JwtAuthGuard` for authentication.

#### Assets

```http
GET /assets
GET /assets?symbol=BTC
POST /assets
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assets` | List all assets (optional symbol filter) |
| POST | `/assets` | Create new asset |

**Create Asset Request:**
```json
{
  "symbol": "BTC",
  "name": "Bitcoin",
  "asset_type_id": 1,
  "price_api_source": "zapper",
  "api_identifier": "btc"
}
```

#### Custodians

```http
GET /custodians
POST /custodians
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/custodians` | List all custodians |
| POST | `/custodians` | Create new custodian |

**Create Custodian Request:**
```json
{
  "name": "Ledger Nano X",
  "type": "hardware_wallet",
  "description": "Main cold storage",
  "wallet_address": "0x..."
}
```

**Custodian Types:** `hardware_wallet`, `software_wallet`, `broker`, `exchange`, `multisig_wallet`

#### Positions

```http
GET /positions
GET /positions?asset_id=1&custodian_id=2
POST /positions
POST /positions/cash
DELETE /positions/:id
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/positions` | List positions (optional asset_id, custodian_id filters) |
| POST | `/positions` | Upsert position (create or update) |
| POST | `/positions/cash` | Quick cash position update |
| DELETE | `/positions/:id` | Delete position |

**Upsert Position Request:**
```json
{
  "asset_id": 1,
  "custodian_id": 2,
  "quantity": 1.5
}
```

#### Transactions

```http
GET /transactions
POST /transactions
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | List all transactions |
| POST | `/transactions` | Log transaction for cost basis tracking |

#### Asset Types

```http
GET /asset-types
POST /asset-types
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/asset-types` | List asset types |
| POST | `/asset-types` | Create asset type |

#### Portfolio Summary

```http
GET /portfolio/summary
```

Returns aggregated portfolio overview with:
- Total value in USD
- Breakdown by asset type
- Breakdown by custodian
- Top holdings
- Last updated timestamp

**Response:**
```json
{
  "totalValueUsd": 125000.50,
  "byAssetType": [
    { "name": "Crypto", "valueUsd": 100000, "percentage": 80 }
  ],
  "byCustodian": [
    { "name": "Ledger", "valueUsd": 75000, "percentage": 60 }
  ],
  "topHoldings": [
    { "symbol": "BTC", "name": "Bitcoin", "valueUsd": 50000 }
  ],
  "lastUpdated": "2026-01-20T12:00:00.000Z"
}
```

#### Portfolio PnL (Profit & Loss)

```http
GET /portfolio/pnl
GET /portfolio/pnl?asset_id=8
GET /portfolio/pnl?include_zero_positions=true
```

Returns profit/loss data aggregated by asset, including:
- Cost basis using Average Cost method
- Unrealized P&L (current value vs cost basis)
- Realized P&L (from sell transactions)
- APY (annualized return)
- Summary totals across all positions

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `asset_id` | number | Filter by specific asset |
| `include_zero_positions` | boolean | Include fully sold positions (default: false) |

**Response:**
```json
{
  "summary": {
    "total_cost_basis_usd": 600000,
    "total_current_value_usd": 801000,
    "total_unrealized_pnl_usd": 200000,
    "total_unrealized_pnl_percent": 33.33,
    "total_realized_pnl_usd": 25000,
    "positions_with_cost_basis": 2,
    "positions_without_cost_basis": 1
  },
  "positions": [
    {
      "asset_id": 1,
      "symbol": "BTC",
      "asset_name": "Bitcoin",
      "asset_type": "Cryptocurrency",
      "current_quantity": 10,
      "current_price_usd": 50000,
      "current_value_usd": 500000,
      "has_cost_basis": true,
      "cost_basis": {
        "total_cost_usd": 400000,
        "avg_cost_per_unit": 40000,
        "total_qty_bought": 10
      },
      "unrealized_pnl": {
        "amount_usd": 100000,
        "percent": 25
      },
      "realized_pnl": null,
      "performance": {
        "apy": 25,
        "holding_days": 365,
        "first_buy_date": "2025-01-26"
      }
    },
    {
      "asset_id": 3,
      "symbol": "AIRDROP",
      "asset_name": "Airdrop Token",
      "asset_type": "Cryptocurrency",
      "current_quantity": 1000,
      "current_price_usd": 1,
      "current_value_usd": 1000,
      "has_cost_basis": false,
      "cost_basis": null,
      "unrealized_pnl": null,
      "realized_pnl": null,
      "performance": null
    }
  ],
  "generated_at": "2026-01-26T12:00:00.000Z"
}
```

**Notes:**
- Positions are aggregated by asset (summed across all custodians)
- Positions without transaction history show `has_cost_basis: false`
- APY is null for positions held less than 1 day
- Transactions do NOT modify positions - they only record cost basis data

---

### Sync Endpoints

**Authentication:** Required - JWT Bearer token OR x-api-key header

**Accepted Authentication Methods:**
1. **JWT Bearer Token:** `Authorization: Bearer <token>` (user authentication)
2. **API Key:** `x-api-key: <key>` header (service/automation authentication)

**Development Mode:** If neither `AUTH_PASSWORD_HASH` nor `SYNC_API_KEY` is set, authentication is disabled.

All sync endpoints use `JwtOrApiKeyGuard` for flexible authentication.

#### Sync All Portfolios

```http
POST /sync/portfolio
```

Fetches all wallets from the database, queries Zapper API for each, and updates positions and prices. Designed to be called by a scheduler (e.g., n8n) for daily synchronization.

**Authentication Headers (choose one):**
| Header | Description |
|--------|-------------|
| `Authorization: Bearer <token>` | JWT access token from login |
| `x-api-key: <key>` | API key from `SYNC_API_KEY` env var |

**Response:**
```json
{
  "success": true,
  "syncedAt": "2026-01-14T21:30:00.000Z",
  "summary": {
    "walletsProcessed": 5,
    "positionsUpdated": 12,
    "pricesUpdated": 8,
    "errors": []
  }
}
```

**Error Response (partial failure):**
```json
{
  "success": false,
  "syncedAt": "2026-01-14T21:30:00.000Z",
  "summary": {
    "walletsProcessed": 3,
    "positionsUpdated": 6,
    "pricesUpdated": 4,
    "errors": [
      "Wallet 0x123...abc: Zapper API rate limited (429)",
      "Wallet bc1q...xyz: Unknown token SKY (0x...) - skipping"
    ]
  }
}
```

**Sync Logic:**
1. Query PostgreSQL for all custodians with `wallet_address IS NOT NULL`
2. For each wallet:
   - Determine type (BTC if starts with `bc1`, EVM otherwise)
   - Call Zapper API for token balances
   - Call Zapper API for DeFi app balances (EVM only)
   - Match tokens to assets table by `api_identifier` or `symbol`
   - Upsert positions (asset_id, custodian_id, quantity)
   - Upsert price history (asset_id, price_usd, price_date)
3. Apply rate limiting between wallet calls
4. Return summary

---

#### Sync Stock Prices

```http
POST /sync/prices/stocks
```

Fetches stock and CEDEAR prices from Yahoo Finance API and updates price history.

**Authentication Headers (choose one):**
| Header | Description |
|--------|-------------|
| `Authorization: Bearer <token>` | JWT access token from login |
| `x-api-key: <key>` | API key from `SYNC_API_KEY` env var |

**Response:**
```json
{
  "success": true,
  "syncedAt": "2026-01-20T12:00:00.000Z",
  "summary": {
    "assetsProcessed": 15,
    "pricesUpdated": 15,
    "errors": []
  }
}
```

**Sync Logic:**
1. Query assets where `price_api_source = 'yahoofinance'`
2. For each asset:
   - Fetch price from Yahoo Finance using ticker symbol
   - If CEDEAR (ticker ends with `.BA`), fetch CCL rate from DolarAPI
   - Convert ARS to USD using CCL rate for CEDEARs
   - Upsert daily price to price_history table
3. Apply rate limiting (500ms between requests)
4. Return summary

---

## Database Schema

The service connects to an existing PostgreSQL database (Neon.tech) with the following schema:

### Tables

```sql
-- Asset types classification
CREATE TABLE asset_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Master list of trackable assets
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    asset_type_id INTEGER REFERENCES asset_types(id),
    price_api_source TEXT,      -- 'zapper', 'alphavantage', 'manual'
    api_identifier TEXT,        -- lowercase token address for Zapper matching
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets and brokers
CREATE TABLE custodians (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,         -- 'hardware_wallet', 'software_wallet', 'broker', 'exchange', 'multisig_wallet'
    description TEXT,
    wallet_address TEXT,        -- NULL for brokers, lowercase for wallets
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current holdings (quantity per asset per custodian)
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    custodian_id INTEGER REFERENCES custodians(id),
    quantity NUMERIC(20,8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asset_id, custodian_id)
);

-- Daily price snapshots
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    price_usd NUMERIC(20,8) NOT NULL,
    price_date DATE NOT NULL,
    source TEXT,                -- 'zapper', 'alphavantage', 'manual'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asset_id, price_date)
);
```

### Asset Matching Logic

Tokens from Zapper are matched to the `assets` table by:
1. `LOWER(api_identifier) = LOWER(tokenAddress)` for most tokens
2. `LOWER(symbol) = LOWER(tokenSymbol)` as fallback (for native tokens like ETH, BTC)

**Special Cases:**
- **ETH native**: tokenAddress = `0x0000000000000000000000000000000000000000`
- **BTC**: Matched by symbol since Bitcoin has no contract address

---

## Frontend Dashboard

The project includes a React-based dashboard for portfolio visualization.

### Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server (runs on http://localhost:5173)
npm run dev

# Production build
npm run build
npm run preview
```

### Pages

| Page | Path | Description | Auth Required |
|------|------|-------------|---------------|
| Login | `/login` | Password login page | No |
| Dashboard | `/` | Portfolio overview with charts and statistics | Yes |
| Custodians | `/custodians` | Manage wallets and brokers | Yes |
| Positions | `/positions` | View and manage holdings | Yes |
| Assets | `/assets` | Manage asset master data | Yes |
| Transactions | `/transactions` | Log and track transactions | Yes |

### Dashboard Features

- **Authentication**: Login page with password authentication, JWT token management
- **Protected Routes**: All pages except login require authentication
- **Portfolio Statistics**: Total value, position count, asset types, custodians
- **Allocation Charts**:
  - Pie chart by asset type
  - Pie chart by custodian
  - Bar chart of top 6 holdings
- **Positions Table**: First 15 positions with details
- **Auto Token Refresh**: Automatic refresh token rotation

### Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** for data fetching and caching
- **Tailwind CSS 4** for styling
- **Recharts** for charts and data visualization
- **React Router 7** for client-side routing

### Configuration

The frontend connects to the backend API at `http://localhost:3000` by default. This can be configured in the API client (`frontend/src/api/client.ts`).

**Authentication Flow:**
1. User logs in at `/login` with password
2. Backend validates password and returns JWT access token
3. Refresh token stored in httpOnly cookie
4. Access token stored in memory via AuthContext
5. All API requests include `Authorization: Bearer <token>` header
6. Token automatically refreshed when expired

---

## Integration Examples

### cURL

```bash
# ============================================
# Public Endpoints (No Auth Required)
# ============================================

# Get token balances on Base chain
curl "http://localhost:3000/portfolio/0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1/tokens?chainIds=8453&first=10"

# Get complete portfolio
curl "http://localhost:3000/portfolio/0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1"

# Get NFTs with minimum $1000 value
curl "http://localhost:3000/portfolio/0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1/nfts?minBalanceUSD=1000"

# ============================================
# Authentication
# ============================================

# Login and get JWT token
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password": "your-password"}' \
  -c cookies.txt

# Refresh token (uses cookie from login)
curl -X POST "http://localhost:3000/auth/refresh" \
  -b cookies.txt \
  -c cookies.txt

# ============================================
# Protected Endpoints (JWT or API Key)
# ============================================

# Trigger portfolio sync with JWT Bearer token
curl -X POST "http://localhost:3000/sync/portfolio" \
  -H "Authorization: Bearer eyJhbGc..."

# Trigger portfolio sync with API key
curl -X POST "http://localhost:3000/sync/portfolio" \
  -H "x-api-key: your-sync-api-key"

# Sync stock prices with API key
curl -X POST "http://localhost:3000/sync/prices/stocks" \
  -H "x-api-key: your-sync-api-key"

# ============================================
# Manual Entry Endpoints (JWT Bearer Required)
# ============================================

# List all assets with JWT
curl "http://localhost:3000/assets" \
  -H "Authorization: Bearer eyJhbGc..."

# Create new asset with JWT
curl -X POST "http://localhost:3000/assets" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "name": "Bitcoin",
    "asset_type_id": 1,
    "price_api_source": "zapper"
  }'
```

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

// ============================================
// Authentication
// ============================================

async function login(password: string): Promise<string> {
  const response = await axios.post(`${API_BASE}/auth/login`, { password });
  return response.data.accessToken;
}

// ============================================
// Public Endpoints (No Auth)
// ============================================

async function getPortfolio(address: string) {
  const response = await axios.get(`${API_BASE}/portfolio/${address}`);
  return response.data;
}

async function getTokenBalances(address: string, chainIds?: number[]) {
  const params = new URLSearchParams();
  if (chainIds) {
    chainIds.forEach(id => params.append('chainIds', id.toString()));
  }
  const response = await axios.get(
    `${API_BASE}/portfolio/${address}/tokens?${params.toString()}`
  );
  return response.data;
}

// ============================================
// Protected Endpoints with JWT
// ============================================

async function getAssets(accessToken: string) {
  const response = await axios.get(`${API_BASE}/assets`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
}

async function createAsset(accessToken: string, assetData: any) {
  const response = await axios.post(`${API_BASE}/assets`, assetData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

// ============================================
// Sync Endpoints (API Key or JWT)
// ============================================

// Option 1: Use API key
async function syncPortfoliosWithApiKey(apiKey: string) {
  const response = await axios.post(`${API_BASE}/sync/portfolio`, null, {
    headers: { 'x-api-key': apiKey }
  });
  return response.data;
}

// Option 2: Use JWT Bearer token
async function syncPortfoliosWithJWT(accessToken: string) {
  const response = await axios.post(`${API_BASE}/sync/portfolio`, null, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
}

// ============================================
// Usage Examples
// ============================================

// Public endpoint - no auth needed
const portfolio = await getPortfolio('0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1');
console.log(`Total portfolio value: $${portfolio.totals.totalPortfolioValue}`);

// Protected endpoint - login first
const accessToken = await login('your-password');
const assets = await getAssets(accessToken);
console.log(`Found ${assets.assets.length} assets`);

// Sync with API key (for automation)
await syncPortfoliosWithApiKey('your-sync-api-key');
```

### Python

```python
import requests

API_BASE = 'http://localhost:3000'

# ============================================
# Authentication
# ============================================

def login(password: str) -> str:
    """Login and return access token"""
    response = requests.post(f'{API_BASE}/auth/login', json={'password': password})
    response.raise_for_status()
    return response.json()['accessToken']

# ============================================
# Public Endpoints (No Auth)
# ============================================

def get_portfolio(address: str) -> dict:
    response = requests.get(f'{API_BASE}/portfolio/{address}')
    response.raise_for_status()
    return response.json()

def get_token_balances(address: str, chain_ids: list = None) -> dict:
    params = {}
    if chain_ids:
        params['chainIds'] = chain_ids
    response = requests.get(f'{API_BASE}/portfolio/{address}/tokens', params=params)
    response.raise_for_status()
    return response.json()

# ============================================
# Protected Endpoints with JWT
# ============================================

def get_assets(access_token: str) -> dict:
    """Get all assets (requires JWT authentication)"""
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(f'{API_BASE}/assets', headers=headers)
    response.raise_for_status()
    return response.json()

def create_asset(access_token: str, asset_data: dict) -> dict:
    """Create new asset (requires JWT authentication)"""
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    response = requests.post(f'{API_BASE}/assets', json=asset_data, headers=headers)
    response.raise_for_status()
    return response.json()

# ============================================
# Sync Endpoints (API Key or JWT)
# ============================================

def sync_portfolios_with_api_key(api_key: str) -> dict:
    """Sync portfolios using API key"""
    headers = {'x-api-key': api_key}
    response = requests.post(f'{API_BASE}/sync/portfolio', headers=headers)
    response.raise_for_status()
    return response.json()

def sync_portfolios_with_jwt(access_token: str) -> dict:
    """Sync portfolios using JWT token"""
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.post(f'{API_BASE}/sync/portfolio', headers=headers)
    response.raise_for_status()
    return response.json()

# ============================================
# Usage Examples
# ============================================

# Public endpoint - no auth needed
portfolio = get_portfolio('0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1')
print(f"Total portfolio value: ${portfolio['totals']['totalPortfolioValue']}")

# Protected endpoint - login first
access_token = login('your-password')
assets = get_assets(access_token)
print(f"Found {len(assets['assets'])} assets")

# Sync with API key (for automation)
sync_portfolios_with_api_key('your-sync-api-key')
```

### n8n Workflow Integration

The sync endpoint is designed to be called by n8n for daily synchronization:

```json
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": { "interval": [{ "field": "days", "daysInterval": 1 }] }
      }
    },
    {
      "name": "Sync Portfolios",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3000/sync/portfolio",
        "headers": { "x-api-key": "{{ $env.SYNC_API_KEY }}" }
      }
    }
  ]
}
```

---

## Supported Chains

| Chain | Chain ID | Supported |
|-------|----------|-----------|
| Ethereum | 1 | ✅ |
| Polygon | 137 | ✅ |
| Arbitrum | 42161 | ✅ |
| Optimism | 10 | ✅ |
| Base | 8453 | ✅ |
| BSC | 56 | ✅ |
| Avalanche | 43114 | ✅ |
| Bitcoin | 6172014 | ✅ |

---

## Endpoint Authentication Summary

Quick reference for which endpoints require authentication:

| Endpoint Pattern | Authentication Required | Guard Type | Accepted Methods |
|-----------------|------------------------|------------|------------------|
| `GET /` | ❌ No | - | Public |
| `POST /auth/login` | ❌ No | - | Public |
| `POST /auth/logout` | ❌ No | - | Public |
| `POST /auth/refresh` | ❌ No | - | Public |
| `GET /portfolio/:address/*` | ❌ No | - | Public (cached) |
| `POST /sync/portfolio` | ✅ Yes | JwtOrApiKeyGuard | JWT Bearer OR x-api-key |
| `POST /sync/prices/stocks` | ✅ Yes | JwtOrApiKeyGuard | JWT Bearer OR x-api-key |
| `GET /assets` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `POST /assets` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `GET /custodians` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `POST /custodians` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `GET /positions` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `POST /positions` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `DELETE /positions/:id` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `POST /positions/cash` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `GET /transactions` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `POST /transactions` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `GET /asset-types` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `POST /asset-types` | ✅ Yes | JwtAuthGuard | JWT Bearer only |
| `GET /portfolio/summary` | ✅ Yes | JwtAuthGuard | JWT Bearer only |

**Development Mode Notes:**
- If `AUTH_PASSWORD_HASH` is NOT set → All JWT-protected endpoints become public
- If `SYNC_API_KEY` is NOT set → Sync endpoints only accept JWT (or public if no auth)
- Portfolio query endpoints are ALWAYS public (read-only, cached data)

---

## Error Handling

The API returns standard HTTP status codes:

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid address format, validation error, or GraphQL error |
| 401 | Invalid or missing API key (for protected endpoints) |
| 404 | Zapper API endpoint not found |
| 500 | Internal server error |

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Invalid address format",
  "error": "Bad Request"
}
```

### Address Validation

- **EVM addresses**: Must match `^0x[a-fA-F0-9]{40}$`
- **Bitcoin addresses**: Must match `^bc1[a-zA-HJ-NP-Z0-9]{25,39}$`

---

## Caching

- **TTL**: 90 seconds (configurable via `CACHE_TTL`)
- **Max items**: 100 cached responses
- **Cache key**: Based on endpoint path, address, and query parameters
- **Scope**: Portfolio endpoints only (sync bypasses cache)

---

## Testing

```bash
# Unit tests
yarn test

# Watch mode
yarn test:watch

# Coverage report
yarn test:cov

# E2E tests
yarn test:e2e
```

---

## Architecture Notes

- **Modular Design**: Each feature (Portfolio, Sync, Database) is encapsulated in its own NestJS module
- **Service Layer**: Business logic separated from controllers
- **Parallel Execution**: Complete portfolio endpoint uses `Promise.all()` for concurrent fetching
- **Type Safety**: All responses use validated DTOs
- **Global Database**: `DatabaseModule` is global, providing shared PostgreSQL pool
- **Guard Pattern**: `ApiKeyGuard` protects sync endpoints
- **Rate Limiting**: Configurable delay between wallet syncs to prevent API throttling

---

## Key Files Reference

### Backend

| File | Purpose |
|------|---------|
| `src/main.ts` | Server bootstrap, CORS, Swagger setup |
| `src/app.module.ts` | Root module importing all feature modules |
| `src/database/database.module.ts` | PostgreSQL connection pool (Global) |
| `src/auth/auth.module.ts` | JWT authentication module (Global) |
| `src/auth/auth.controller.ts` | Login/logout/refresh endpoints |
| `src/auth/auth.service.ts` | JWT token generation and validation |
| `src/auth/guards/jwt-auth.guard.ts` | JWT Bearer token guard |
| `src/auth/guards/jwt-or-apikey.guard.ts` | JWT or API key guard |
| `src/guards/api-key.guard.ts` | Legacy API key guard |
| `src/portfolio/portfolio.controller.ts` | 7 public REST endpoints for Zapper queries |
| `src/portfolio/portfolio.service.ts` | Zapper GraphQL query logic |
| `src/sync/sync.controller.ts` | POST /sync/portfolio endpoint (protected) |
| `src/sync/sync.service.ts` | Wallet sync business logic |
| `src/modules/yahoo-finance/yahoo-finance.controller.ts` | POST /sync/prices/stocks endpoint (protected) |
| `src/modules/yahoo-finance/yahoo-finance.service.ts` | Stock/CEDEAR price fetching |
| `src/modules/zerion/zerion.service.ts` | Fallback price source for unsupported tokens |
| `src/modules/manual-entry/manual-entry.module.ts` | Manual entry feature module |
| `src/modules/manual-entry/controllers/*.ts` | CRUD controllers (all protected with JWT) |
| `src/modules/manual-entry/services/*.ts` | Business logic for manual entry |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/main.tsx` | React entry point |
| `frontend/src/App.tsx` | Root component with routing |
| `frontend/src/pages/Login.tsx` | Login page |
| `frontend/src/pages/Dashboard.tsx` | Portfolio overview with charts |
| `frontend/src/pages/Positions.tsx` | Positions management page |
| `frontend/src/contexts/AuthContext.tsx` | Authentication state management |
| `frontend/src/components/auth/ProtectedRoute.tsx` | Route guard for authenticated pages |
| `frontend/src/hooks/usePortfolio.ts` | Portfolio data fetching hook |
| `frontend/src/api/client.ts` | Axios HTTP client with JWT interceptor |
| `frontend/src/api/auth.ts` | Authentication API calls |
| `frontend/src/components/layout/Layout.tsx` | Main layout with sidebar |

---

## Future Feature Considerations

When developing new PRDs for this project, consider these potential enhancements:

### Data & Analytics
- Historical portfolio value tracking and charts
- Performance metrics (daily/weekly/monthly returns)
- Asset allocation analysis
- Risk metrics and diversification scoring
- Transaction history tracking

### Sync Enhancements
- Webhook notifications on sync completion
- Per-wallet sync endpoint (instead of all wallets)
- Sync status endpoint to check last sync time
- Delta sync (only sync wallets that haven't been synced recently)
- Support for additional price sources (CoinGecko, AlphaVantage)

### Portfolio Features
- Multi-wallet aggregation (combine multiple addresses)
- Portfolio comparison (compare two addresses)
- Watch-only addresses (track without ownership)
- Custom asset tagging and categorization

### Authentication & Authorization
- User accounts with JWT authentication
- Role-based access control
- API key management (create/revoke keys)
- Rate limiting per API key

### Integrations
- Telegram/Discord notifications for significant balance changes
- Export to CSV/Excel
- Google Sheets integration
- Webhook events for balance changes

### Infrastructure
- Redis caching for horizontal scaling
- Message queue for async sync operations
- Health check endpoint with detailed status
- Prometheus metrics endpoint

---

## License

MIT
