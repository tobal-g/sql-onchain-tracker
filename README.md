# w3g-onchain-service

A blockchain portfolio management REST API built with NestJS that provides comprehensive wallet analytics, portfolio tracking, and automated database synchronization across multiple blockchain networks. It aggregates data from the Zapper Protocol via GraphQL to deliver real-time information about token balances, DeFi positions, NFT holdings, claimable rewards, and portfolio totals.

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
  - [Sync Endpoints](#sync-endpoints)
- [Database Schema](#database-schema)
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
3. **Price History**: Daily price snapshots for all tracked assets

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

### 4. Authentication Guard
API key-based authentication for protected endpoints:
- Optional in development (no key = open access)
- Required in production via `SYNC_API_KEY` env var
- Uses `x-api-key` header

---

## Technologies

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

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           w3g-onchain-service                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────┐   │
│  │ Portfolio Module│   │   Sync Module   │   │  Database Module    │   │
│  │                 │   │                 │   │  (Global)           │   │
│  │ • Controller    │   │ • Controller    │   │                     │   │
│  │ • Service       │   │ • Service       │   │ • PostgreSQL Pool   │   │
│  │ • DTOs          │   │ • DTOs          │   │ • SSL/Neon.tech     │   │
│  │ • Caching       │   │ • API Key Guard │   │                     │   │
│  └────────┬────────┘   └────────┬────────┘   └──────────┬──────────┘   │
│           │                     │                       │              │
│           │                     │                       │              │
│           ▼                     ▼                       ▼              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        External Services                         │   │
│  ├─────────────────────────────┬───────────────────────────────────┤   │
│  │   Zapper GraphQL API        │      PostgreSQL (Neon.tech)       │   │
│  │   https://public.zapper.xyz │      Portfolio DB                 │   │
│  └─────────────────────────────┴───────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
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
src/
├── main.ts                           # Application entry point (PORT config)
├── app.module.ts                     # Root module (imports all feature modules)
├── app.controller.ts                 # Health check endpoint (GET /)
├── app.service.ts                    # Basic service
├── database/
│   └── database.module.ts            # PostgreSQL connection pool (Global module)
├── guards/
│   └── api-key.guard.ts              # x-api-key authentication guard
├── portfolio/
│   ├── portfolio.module.ts           # Portfolio feature module (caching config)
│   ├── portfolio.controller.ts       # 7 REST endpoints for portfolio queries
│   ├── portfolio.service.ts          # GraphQL queries to Zapper API
│   ├── portfolio.controller.spec.ts  # Controller unit tests
│   ├── portfolio.service.spec.ts     # Service unit tests
│   └── dto/
│       └── portfolio.dto.ts          # 25+ Data Transfer Objects
└── sync/
    ├── sync.module.ts                # Sync feature module
    ├── sync.controller.ts            # POST /sync/portfolio endpoint
    ├── sync.service.ts               # Wallet sync logic
    ├── sync.service.spec.ts          # Service unit tests
    └── dto/
        └── sync-response.dto.ts      # Sync response DTOs
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
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZAPPER_API_KEY` | Yes | - | API key for Zapper GraphQL API |
| `ZAPPER_API_URL` | No | `https://public.zapper.xyz/graphql` | Zapper API endpoint |
| `DATABASE_URL` | For sync | - | PostgreSQL connection string |
| `PORT` | No | `3000` | Server port |
| `CACHE_TTL` | No | `90` | Cache TTL in seconds |
| `SYNC_API_KEY` | No | - | API key for sync endpoint (if unset, endpoint is open) |
| `SYNC_RATE_LIMIT_MS` | No | `1000` | Delay between wallet syncs |

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

### Portfolio Endpoints

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

### Sync Endpoints

#### Sync All Portfolios

```http
POST /sync/portfolio
```

Fetches all wallets from the database, queries Zapper API for each, and updates positions and prices. Designed to be called by a scheduler (e.g., n8n) for daily synchronization.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `x-api-key` | If `SYNC_API_KEY` is set | Authentication key |

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

## Integration Examples

### cURL

```bash
# Get token balances on Base chain
curl "http://localhost:3000/portfolio/0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1/tokens?chainIds=8453&first=10"

# Get complete portfolio
curl "http://localhost:3000/portfolio/0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1"

# Get NFTs with minimum $1000 value
curl "http://localhost:3000/portfolio/0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1/nfts?minBalanceUSD=1000"

# Trigger portfolio sync (with API key)
curl -X POST "http://localhost:3000/sync/portfolio" \
  -H "x-api-key: your-sync-api-key"
```

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

// Get complete portfolio
async function getPortfolio(address: string) {
  const response = await axios.get(`${API_BASE}/portfolio/${address}`);
  return response.data;
}

// Get token balances filtered by chain
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

// Trigger sync (for scheduled jobs)
async function syncPortfolios(apiKey: string) {
  const response = await axios.post(`${API_BASE}/sync/portfolio`, null, {
    headers: { 'x-api-key': apiKey }
  });
  return response.data;
}

// Usage
const portfolio = await getPortfolio('0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1');
console.log(`Total portfolio value: $${portfolio.totals.totalPortfolioValue}`);
```

### Python

```python
import requests

API_BASE = 'http://localhost:3000'

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

def sync_portfolios(api_key: str) -> dict:
    headers = {'x-api-key': api_key}
    response = requests.post(f'{API_BASE}/sync/portfolio', headers=headers)
    response.raise_for_status()
    return response.json()

# Usage
portfolio = get_portfolio('0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1')
print(f"Total portfolio value: ${portfolio['totals']['totalPortfolioValue']}")
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

| File | Purpose |
|------|---------|
| `src/main.ts` | Server bootstrap and port configuration |
| `src/app.module.ts` | Root module importing all feature modules |
| `src/database/database.module.ts` | PostgreSQL connection pool (Global) |
| `src/guards/api-key.guard.ts` | API key authentication guard |
| `src/portfolio/portfolio.controller.ts` | 7 REST endpoints for portfolio queries |
| `src/portfolio/portfolio.service.ts` | Zapper GraphQL query logic |
| `src/portfolio/dto/portfolio.dto.ts` | 25+ TypeScript DTOs |
| `src/sync/sync.controller.ts` | Sync endpoint (POST /sync/portfolio) |
| `src/sync/sync.service.ts` | Wallet sync business logic |
| `src/sync/dto/sync-response.dto.ts` | Sync response DTOs |

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
