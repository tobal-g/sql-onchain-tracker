# W3G Portfolio Dashboard

React-based dashboard for visualizing portfolio data from the w3g-onchain-service backend.

## Features

- **Dashboard Overview**: Total portfolio value, position count, asset types, and custodians
- **Allocation Charts**: Pie charts by asset type, custodian, and top holdings
- **Custodians Management**: View and manage wallets and brokers
- **Positions Management**: View current holdings across all custodians with tabbed views
- **Assets Management**: Manage master list of trackable assets
- **Performance (P&L)**: Profit/loss analysis with cost basis, unrealized/realized gains, APY
- **Toast Notifications**: Success/error feedback for user actions
- **Modal Forms**: Create/edit positions, assets, and custodians

## Tech Stack

| Technology     | Version | Purpose                       |
| -------------- | ------- | ----------------------------- |
| React          | 19.x    | UI library                    |
| TypeScript     | 5.9.x   | Type-safe development         |
| Vite           | 7.x     | Build tool with HMR           |
| React Router   | 7.x     | Client-side routing           |
| TanStack Query | 5.x     | Server state management       |
| Tailwind CSS   | 4.x     | Utility-first styling         |
| Recharts       | 3.6.x   | Charts and data visualization |
| Axios          | 1.13.x  | HTTP client                   |

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

| Script            | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start development server with HMR |
| `npm run build`   | Build for production              |
| `npm run preview` | Preview production build          |
| `npm run lint`    | Run ESLint                        |

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component with routing
├── pages/
│   ├── Dashboard.tsx     # Portfolio overview with charts
│   ├── Custodians.tsx    # Custodians management
│   ├── Positions.tsx     # Positions management with tabbed views
│   ├── Assets.tsx        # Assets management
│   └── Login.tsx         # Authentication page
├── components/
│   ├── layout/
│   │   ├── Layout.tsx    # Main layout wrapper
│   │   └── Sidebar.tsx   # Navigation sidebar
│   ├── positions/
│   │   ├── PositionsTable.tsx    # Detailed positions table
│   │   ├── AssetSummaryView.tsx  # Aggregated asset view
│   │   ├── GroupedAssetCards.tsx # Dashboard asset cards
│   │   └── PnlView.tsx           # P&L analysis view
│   ├── auth/
│   │   └── ProtectedRoute.tsx     # Authentication guard
│   └── common/
│       ├── LoadingSpinner.tsx     # Loading states
│       ├── Toast.tsx              # Toast notifications
│       ├── ErrorBoundary.tsx      # Error handling
│       └── Tabs.tsx               # Tab navigation
├── hooks/
│   └── usePortfolio.ts   # Portfolio data fetching hooks
├── api/
│   ├── client.ts         # Main API client with JWT handling
│   └── auth.ts           # Authentication API client
├── contexts/
│   └── AuthContext.tsx   # Authentication state management
├── types/
│   └── index.ts          # TypeScript type definitions
└── utils/
    ├── format.ts         # Formatting utilities
    └── aggregation.ts    # Data aggregation functions
```

## Configuration

### Environment Variables

The frontend uses environment variables for configuration. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available variables:

- `VITE_API_URL` - Backend API URL (leave empty for local development with Vite proxy)
- `VITE_API_KEY` - Optional API key for authentication

### API Configuration

In development, Vite proxy redirects `/api` requests to `http://localhost:3000`. In production, set `VITE_API_URL` to your backend URL.

### CORS

Ensure the backend has CORS configured for the frontend origin:

```env
# Backend .env
CORS_ORIGIN=http://localhost:5173
```

## Authentication

The frontend uses JWT-based authentication with automatic token refresh:

### Token Management

- Access tokens stored in localStorage
- Refresh tokens handled via httpOnly cookies
- Automatic token refresh every 60 seconds
- 30-second buffer before token expiry

### Auth Flow

1. Login at `/login` with password
2. JWT access token returned and stored
3. All subsequent requests include Bearer token
4. Automatic refresh when token nears expiry
5. Redirect to login on 401 responses

### Protected Routes

All pages except `/login` require authentication via `ProtectedRoute` component. If `AUTH_PASSWORD_HASH` is not set in backend, authentication is disabled for development.

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
- Pie chart: Allocation by asset (top holdings)
- Pie chart: Allocation by custodian
- Grouped asset cards showing holdings by asset type

### Custodians (`/custodians`)

Manage wallets and brokers:

- View all custodians with their types and wallet addresses
- Add new custodians
- Types: hardware_wallet, software_wallet, broker, exchange, multisig_wallet

### Positions (`/positions`)

View and manage holdings:

- **By Position tab**: Detailed table of all positions with edit/delete actions
- **By Asset tab**: Aggregated view showing total holdings per asset
- Modal forms for adding/editing positions
- Delete confirmation workflow
- Automatic portfolio summary updates on changes

### Assets (`/assets`)

Manage master asset data:

- View all assets with symbol, name, and type
- Add new assets with price API source configuration

### Transactions (`/transactions`)

Log portfolio transactions:

- View transaction history
- Log buy/sell transactions for cost basis tracking
- Note: Transactions do NOT modify position quantities

### Performance Tab (in Positions page)

P&L analysis for portfolio positions:

- Cost basis calculated using Average Cost method
- Unrealized P&L (current value vs cost basis)
- Realized P&L from sell transactions
- APY (annualized return based on holding period)
- Positions aggregated by asset across all custodians

## Development

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Sidebar.tsx`
4. Wrap protected routes with `<ProtectedRoute>`

### Data Fetching with TanStack Query

Use the organized hooks in `src/hooks/usePortfolio.ts`:

```typescript
import { usePortfolioSummary, usePositions } from '../hooks/usePortfolio';

// Automatic caching, refetching, and error handling
const { data: summary, isLoading, error } = usePortfolioSummary();
const { data: positions } = usePositions({ custodian_id: 1 });
```

#### Query Organization

- **Query Keys**: Centralized in `queryKeys` object for consistency
- **Mutations**: Automatic query invalidation on success
- **Refetch Intervals**: Portfolio summary refreshes every 60 seconds
- **Error Handling**: Toast notifications for user feedback

#### Available Hooks

- `usePortfolioSummary()` - Overall portfolio data
- `usePnl(params)` - P&L data per asset
- `usePositions(params)` - Filtered positions list
- `useAssets(params)` - Master asset list
- `useCustodians()` - Custodian list
- `useAssetTypes()` - Asset type categories
- `useTransactions(params)` - Transaction history
- `useUpsertPosition()` - Create/update positions
- `useDeletePosition()` - Delete positions
- `useCreateAsset()` - Create new assets
- `useCreateCustodian()` - Create new custodians
- `useCreateTransaction()` - Log transactions

### Data Aggregation

Use `src/utils/aggregation.ts` for portfolio calculations:

```typescript
import {
  aggregatePositionsByAsset,
  groupAssetsByType,
} from '../utils/aggregation';

// Aggregate multiple positions of the same asset
const aggregated = aggregatePositionsByAsset(positions, totalValue);

// Group aggregated assets by type
const grouped = groupAssetsByType(aggregated, totalValue);
```

### Component Patterns

#### Modal Forms

All modals follow consistent patterns:

- Escape key to close
- Loading states during submission
- Form validation
- Toast notifications on success/error

#### Toast Notifications

```typescript
import { useToast } from '../components/common/Toast';

const { addToast } = useToast();
addToast('Operation successful', 'success');
addToast('Error occurred', 'error');
```

### Styling

Use Tailwind CSS utility classes with consistent design system:

```tsx
<div className="card">
  {' '}
  {/* White background, rounded, shadow, padding */}
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <button className="btn btn-primary">Primary Action</button>
  <button className="btn btn-secondary">Secondary Action</button>
</div>
```

Common classes:

- `card` - Styled container
- `btn btn-primary` - Primary button
- `btn btn-secondary` - Secondary button
- `label` - Form label styling
- `input` - Form input styling

### Styling

Use Tailwind CSS utility classes:

```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-semibold text-gray-800">Title</h2>
</div>
```
