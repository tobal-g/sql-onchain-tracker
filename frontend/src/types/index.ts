// Asset Types
export interface AssetType {
  id: number;
  name: string;
  description?: string;
}

// Assets
export interface Asset {
  id: number;
  symbol: string;
  name: string;
  asset_type: AssetType;
  price_api_source?: string;
  api_identifier?: string;
  current_price?: number;
  price_as_of?: string;
}

// Custodians
export interface Custodian {
  id: number;
  name: string;
  type: string;
  description?: string;
  wallet_address?: string;
  total_value_usd: number;
}

// Positions
export interface Position {
  id: number;
  asset: {
    id: number;
    symbol: string;
    name: string;
    asset_type: string;
  };
  custodian: {
    id: number;
    name: string;
    type: string;
  };
  quantity: number;
  current_price: number;
  value_usd: number;
  updated_at: string;
}

export interface PositionsListResponse {
  positions: Position[];
  total_value_usd: number;
}

export interface UpsertPositionRequest {
  asset_id?: number;
  asset_symbol?: string;
  custodian_id?: number;
  custodian_name?: string;
  quantity: number;
}

export interface UpsertPositionResponse {
  success: boolean;
  position: {
    id: number;
    asset_id: number;
    custodian_id: number;
    quantity: number;
    updated_at: string;
  };
  action: 'created' | 'updated';
}

export interface QuickCashUpdateRequest {
  custodian_id: number;
  currency: string;
  amount: number;
}

// Transactions
export interface Transaction {
  id: number;
  asset_id: number;
  asset_symbol: string;
  custodian_id: number;
  custodian_name: string;
  transaction_type: string;
  quantity: number;
  price_per_unit?: number;
  total_value_usd?: number;
  transaction_date: string;
  notes?: string;
}

export interface CreateTransactionRequest {
  asset_id: number;
  custodian_id: number;
  transaction_type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'deposit' | 'withdrawal';
  quantity: number;
  price_per_unit?: number;
  transaction_date: string;
  notes?: string;
}

export interface CreateTransactionResponse {
  success: boolean;
  transaction: Transaction;
  updated_position: {
    id: number;
    quantity: number;
  };
}

// Portfolio Summary
export interface AssetTypeBreakdown {
  type: string;
  value_usd: number;
  percentage: number;
}

export interface CustodianBreakdown {
  name: string;
  value_usd: number;
  percentage: number;
}

export interface TopHolding {
  symbol: string;
  value_usd: number;
  percentage: number;
}

export interface PortfolioSummary {
  total_value_usd: number;
  by_asset_type: AssetTypeBreakdown[];
  by_custodian: CustodianBreakdown[];
  top_holdings: TopHolding[];
  last_updated: string;
}

// API Responses
export interface AssetsListResponse {
  assets: Asset[];
}

export interface CustodiansListResponse {
  custodians: Custodian[];
}

export interface AssetTypesListResponse {
  asset_types: AssetType[];
}

export interface TransactionsListResponse {
  transactions: Transaction[];
}

export interface CreateAssetRequest {
  symbol: string;
  name: string;
  asset_type_id: number;
  price_api_source?: string;
  api_identifier?: string;
}

export interface CreateCustodianRequest {
  name: string;
  type: string;
  description?: string;
  wallet_address?: string;
}
