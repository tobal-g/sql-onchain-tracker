# W3G Portfolio Dashboard

React-based dashboard for visualizing portfolio data from the w3g-onchain-service backend.

## Features

- **Dashboard Overview**: Total portfolio value, position count, asset types, and custodians
- **Allocation Charts**: Pie charts by asset type and custodian, bar chart of top holdings
- **Custodians Management**: View and manage wallets and brokers
- **Positions Management**: View current holdings across all custodians
- **Assets Management**: Manage master list of trackable assets
- **Transactions**: Log and track portfolio transactions

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| TypeScript | 5.9.x | Type-safe development |
| Vite | 7.x | Build tool with HMR |
| React Router | 7.x | Client-side routing |
| TanStack Query | 5.x | Server state management |
| Tailwind CSS | 4.x | Utility-first styling |
| Recharts | 3.6.x | Charts and data visualization |
| Axios | 1.13.x | HTTP client |

## Getting Started

### Prerequisites

- Node.js 18+
- Backend server running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs on `http://localhost:5173` by default.

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component with routing
├── pages/
│   ├── Dashboard.tsx     # Portfolio overview with charts
│   ├── Custodians.tsx    # Custodians management
│   ├── Positions.tsx     # Positions management
│   ├── Assets.tsx        # Assets management
│   └── Transactions.tsx  # Transactions logging
├── components/
│   ├── layout/
│   │   ├── Layout.tsx    # Main layout wrapper
│   │   └── Sidebar.tsx   # Navigation sidebar
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── Toast.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   └── usePortfolio.ts   # Portfolio data fetching hook
├── api/
│   └── client.ts         # Axios HTTP client
├── types/
│   └── index.ts          # TypeScript type definitions
└── utils/
    └── format.ts         # Formatting utilities
```

## Configuration

### API Base URL

The frontend connects to the backend API. Configure the base URL in `src/api/client.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000';
```

### CORS

Ensure the backend has CORS configured for the frontend origin:

```env
# Backend .env
CORS_ORIGIN=http://localhost:5173
```

## Pages

### Dashboard (`/`)

Main portfolio overview displaying:
- Total portfolio value in USD
- Number of positions, asset types, and custodians
- Pie chart: Allocation by asset type
- Pie chart: Allocation by custodian
- Bar chart: Top 6 holdings by value
- Table: First 15 positions

### Custodians (`/custodians`)

Manage wallets and brokers:
- View all custodians with their types and wallet addresses
- Add new custodians
- Types: hardware_wallet, software_wallet, broker, exchange, multisig_wallet

### Positions (`/positions`)

View and manage holdings:
- List all positions with asset, custodian, quantity, and value
- Filter by asset or custodian
- Quick cash position updates

### Assets (`/assets`)

Manage master asset data:
- View all assets with symbol, name, and type
- Add new assets with price API source configuration

### Transactions (`/transactions`)

Log portfolio transactions:
- View transaction history
- Log new transactions (automatically updates positions)

## Development

### Adding a New Page

1. Create the page component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Sidebar.tsx`

### Data Fetching

Use TanStack Query for data fetching:

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const { data, isLoading, error } = useQuery({
  queryKey: ['portfolio', 'summary'],
  queryFn: () => apiClient.get('/portfolio/summary').then(res => res.data),
});
```

### Styling

Use Tailwind CSS utility classes:

```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-semibold text-gray-800">Title</h2>
</div>
```
