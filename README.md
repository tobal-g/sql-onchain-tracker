# w3g-onchain-service

A blockchain portfolio management REST API built with NestJS that provides comprehensive wallet analytics and portfolio tracking across multiple blockchain networks. It aggregates data from the Zapper Protocol via GraphQL to deliver real-time information about token balances, DeFi positions, NFT holdings, claimable rewards, and portfolio totals.

## Purpose

This service enables Web3 applications to display detailed wallet portfolio information through a clean REST API interface. It acts as a middleware between your application and the Zapper GraphQL API, providing:

- Cached responses (90-second TTL) to reduce external API calls
- Type-safe DTOs with validation
- Simplified REST endpoints instead of raw GraphQL queries
- Aggregated portfolio views across multiple chains

## Technologies

- **NestJS 11** - Progressive Node.js framework
- **TypeScript 5.7** - Type-safe development
- **Axios** - HTTP client for GraphQL requests
- **Swagger/OpenAPI** - API documentation
- **cache-manager** - In-memory response caching
- **class-validator** - DTO validation

## Project Structure

```
src/
├── main.ts                         # Application entry point (PORT config)
├── app.module.ts                   # Root module
├── app.controller.ts               # Health check endpoint (GET /)
├── app.service.ts                  # Basic service
└── portfolio/
    ├── portfolio.module.ts         # Portfolio feature module (caching config)
    ├── portfolio.controller.ts     # 7 API endpoints
    ├── portfolio.service.ts        # GraphQL queries to Zapper
    └── dto/
        └── portfolio.dto.ts        # 20+ Data Transfer Objects
```

## Installation

```bash
yarn install
```

## Configuration

Create a `.env` file in the project root:

```env
# Required
ZAPPER_API_KEY=your_zapper_api_key

# Optional
PORT=3000
ZAPPER_API_URL=https://public.zapper.xyz/graphql
CACHE_TTL=90
```

## Running the Service

```bash
# Development (watch mode)
yarn start:dev

# Production
yarn build
yarn start:prod

# Debug mode
yarn start:debug
```

The server runs on `http://localhost:3000` by default.

## API Endpoints

All portfolio endpoints accept an Ethereum wallet address (`0x...`) as a URL parameter.

### Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `chainIds` | number[] | Filter by chain IDs (e.g., 1=Ethereum, 8453=Base, 137=Polygon) |
| `first` | number | Pagination limit |
| `minBalanceUSD` | number | Minimum USD balance filter |

### Endpoints

#### Health Check
```
GET /
```
Returns "Hello World!" for liveness checks.

#### Token Balances
```
GET /portfolio/:address/tokens
```
Returns token balances across networks.

**Response structure:**
```json
{
  "totalBalanceUSD": 251379.08,
  "totalCount": 6443,
  "byToken": [
    {
      "symbol": "ETH",
      "tokenAddress": "0x...",
      "balance": 10.5,
      "balanceUSD": 31298.93,
      "price": 2980.85,
      "name": "Ethereum",
      "network": { "name": "Base", "chainId": 8453 }
    }
  ]
}
```

#### DeFi App Positions
```
GET /portfolio/:address/apps
```
Returns DeFi application positions (lending, staking, liquidity pools, etc.).

**Response structure:**
```json
{
  "totalBalanceUSD": 4410.54,
  "apps": [
    {
      "appId": "aave-v3",
      "appName": "Aave V3",
      "network": { "name": "Ethereum", "chainId": 1 },
      "category": "Lending",
      "balanceUSD": 1500.00,
      "positions": [...]
    }
  ]
}
```

#### NFT Holdings
```
GET /portfolio/:address/nfts
```
Returns NFT holdings with metadata and estimated valuations.

**Response structure:**
```json
{
  "totalBalanceUSD": 62906.44,
  "totalCount": 150,
  "nfts": [
    {
      "tokenId": "1234",
      "name": "Cool NFT #1234",
      "collection": { "name": "Cool Collection", "address": "0x..." },
      "estimatedValueUSD": 5000.00,
      "network": { "name": "Ethereum", "chainId": 1 },
      "media": { "image": "https://..." }
    }
  ]
}
```

#### Portfolio Totals
```
GET /portfolio/:address/totals
```
Returns aggregated portfolio values across all asset types.

**Response structure:**
```json
{
  "tokenBalances": {
    "totalBalanceUSD": 225590.10,
    "byNetwork": [
      { "network": { "name": "Base", "chainId": 8453 }, "balanceUSD": 221754.19 }
    ]
  },
  "appBalances": { "totalBalanceUSD": 4410.54 },
  "nftBalances": { "totalBalanceUSD": 62906.44 },
  "totalPortfolioValue": 292907.08
}
```

#### Claimable Tokens
```
GET /portfolio/:address/claimables
```
Returns tokens available to claim (rewards, airdrops, incentives).

**Response structure:**
```json
{
  "totalClaimableUSD": 150.25,
  "claimables": [
    {
      "appId": "uniswap",
      "appName": "Uniswap",
      "token": { "symbol": "UNI", "amount": 10.5, "valueUSD": 75.00 },
      "network": { "name": "Ethereum", "chainId": 1 }
    }
  ]
}
```

#### Position Breakdown
```
GET /portfolio/:address/breakdown
```
Returns breakdown by position types (SUPPLIED, BORROWED, CLAIMABLE, LOCKED, VESTING).

**Response structure:**
```json
{
  "breakdowns": [
    { "type": "SUPPLIED", "count": 5, "balanceUSD": 10000.00 },
    { "type": "BORROWED", "count": 2, "balanceUSD": 3000.00 },
    { "type": "CLAIMABLE", "count": 3, "balanceUSD": 150.25 }
  ]
}
```

#### Complete Portfolio
```
GET /portfolio/:address
```
Returns complete portfolio overview (all data above in a single response). Executes all queries in parallel for optimal performance.

**Response structure:**
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

## Integration Examples

### cURL

```bash
# Get token balances on Base chain
curl "http://localhost:3000/portfolio/0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1/tokens?chainIds=8453&first=10"

# Get complete portfolio
curl "http://localhost:3000/portfolio/0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1"

# Get NFTs with minimum $1000 value
curl "http://localhost:3000/portfolio/0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1/nfts?minBalanceUSD=1000"
```

### JavaScript/TypeScript

```typescript
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

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

# Usage
portfolio = get_portfolio('0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1')
print(f"Total portfolio value: ${portfolio['totals']['totalPortfolioValue']}")
```

## Supported Chain IDs

| Chain | ID |
|-------|-----|
| Ethereum | 1 |
| Polygon | 137 |
| Arbitrum | 42161 |
| Optimism | 10 |
| Base | 8453 |
| BSC | 56 |
| Avalanche | 43114 |

## Error Handling

The API returns standard HTTP status codes:

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid address format or validation error |
| 401 | Invalid or missing API key |
| 500 | Internal server error |

Error response format:
```json
{
  "statusCode": 400,
  "message": "Invalid Ethereum address format",
  "error": "Bad Request"
}
```

## Address Validation

Ethereum addresses must match the pattern: `^0x[a-fA-F0-9]{40}$`

## Caching

Responses are cached for 90 seconds (configurable via `CACHE_TTL` env var) with a maximum of 100 cached items. The cache key is based on the endpoint path and query parameters.

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

## Architecture Notes

- **Modular Design**: Portfolio logic is encapsulated in its own NestJS module
- **Service Layer**: Business logic (GraphQL queries) separated from controllers
- **Parallel Execution**: The complete portfolio endpoint uses `Promise.all()` to fetch all data concurrently
- **Type Safety**: All responses use validated DTOs defined in `src/portfolio/dto/portfolio.dto.ts`
- **External API**: Queries the Zapper GraphQL API at `https://public.zapper.xyz/graphql`

## Key Files for Integration

| File | Purpose |
|------|---------|
| `src/portfolio/portfolio.controller.ts` | All API endpoint definitions |
| `src/portfolio/portfolio.service.ts` | GraphQL query logic |
| `src/portfolio/dto/portfolio.dto.ts` | TypeScript interfaces for all response types |
| `src/main.ts` | Server bootstrap and port configuration |

## License

MIT
