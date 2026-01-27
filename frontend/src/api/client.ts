import axios from 'axios';
import type {
  PortfolioSummary,
  PositionsListResponse,
  UpsertPositionRequest,
  UpsertPositionResponse,
  QuickCashUpdateRequest,
  AssetsListResponse,
  CreateAssetRequest,
  CustodiansListResponse,
  CreateCustodianRequest,
  AssetTypesListResponse,
  TransactionsListResponse,
  CreateTransactionRequest,
  CreateTransactionResponse,
  PnlResponse,
  Asset,
  Custodian,
} from '../types';

const TOKEN_KEY = 'accessToken';

// Create axios instance with base configuration
// In production, VITE_API_URL should point to the backend (e.g., https://your-backend.railway.app)
// In development, it falls back to '/api' which is proxied by Vite
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for refresh token
});

// Add Bearer token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses by redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('tokenExpiry');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Portfolio Summary
export const getPortfolioSummary = async (): Promise<PortfolioSummary> => {
  const { data } = await api.get<PortfolioSummary>('/portfolio/summary');
  return data;
};

// Portfolio PnL
export const getPnl = async (params?: {
  asset_id?: number;
  include_zero_positions?: boolean;
}): Promise<PnlResponse> => {
  const { data } = await api.get<PnlResponse>('/portfolio/pnl', { params });
  return data;
};

// Positions
export const getPositions = async (params?: {
  custodian_id?: number;
  asset_type_id?: number;
}): Promise<PositionsListResponse> => {
  const { data } = await api.get<PositionsListResponse>('/positions', { params });
  return data;
};

export const upsertPosition = async (
  request: UpsertPositionRequest
): Promise<UpsertPositionResponse> => {
  const { data } = await api.post<UpsertPositionResponse>('/positions', request);
  return data;
};

export const deletePosition = async (id: number): Promise<{ success: boolean; deleted_id: number }> => {
  const { data } = await api.delete(`/positions/${id}`);
  return data;
};

export const quickCashUpdate = async (
  request: QuickCashUpdateRequest
): Promise<UpsertPositionResponse> => {
  const { data } = await api.post<UpsertPositionResponse>('/positions/cash', request);
  return data;
};

// Assets
export const getAssets = async (params?: {
  asset_type_id?: number;
  price_api_source?: string;
}): Promise<AssetsListResponse> => {
  const { data } = await api.get<AssetsListResponse>('/assets', { params });
  return data;
};

export const createAsset = async (
  request: CreateAssetRequest
): Promise<{ success: boolean; asset: Asset }> => {
  const { data } = await api.post('/assets', request);
  return data;
};

// Custodians
export const getCustodians = async (): Promise<CustodiansListResponse> => {
  const { data } = await api.get<CustodiansListResponse>('/custodians');
  return data;
};

export const createCustodian = async (
  request: CreateCustodianRequest
): Promise<{ success: boolean; custodian: Custodian }> => {
  const { data } = await api.post('/custodians', request);
  return data;
};

// Asset Types
export const getAssetTypes = async (): Promise<AssetTypesListResponse> => {
  const { data } = await api.get<AssetTypesListResponse>('/asset-types');
  return data;
};

// Transactions
export const getTransactions = async (params?: {
  asset_id?: number;
  custodian_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<TransactionsListResponse> => {
  const { data } = await api.get<TransactionsListResponse>('/transactions', { params });
  return data;
};

export const createTransaction = async (
  request: CreateTransactionRequest
): Promise<CreateTransactionResponse> => {
  const { data } = await api.post<CreateTransactionResponse>('/transactions', request);
  return data;
};

export default api;
