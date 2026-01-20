import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/client';
import type {
  UpsertPositionRequest,
  QuickCashUpdateRequest,
  CreateAssetRequest,
  CreateCustodianRequest,
  CreateTransactionRequest,
} from '../types';

// Query keys
export const queryKeys = {
  portfolioSummary: ['portfolioSummary'] as const,
  positions: (params?: { custodian_id?: number; asset_type_id?: number }) =>
    ['positions', params] as const,
  assets: (params?: { asset_type_id?: number; price_api_source?: string }) =>
    ['assets', params] as const,
  custodians: ['custodians'] as const,
  assetTypes: ['assetTypes'] as const,
  transactions: (params?: {
    asset_id?: number;
    custodian_id?: number;
    from_date?: string;
    to_date?: string;
  }) => ['transactions', params] as const,
};

// Portfolio Summary
export const usePortfolioSummary = () => {
  return useQuery({
    queryKey: queryKeys.portfolioSummary,
    queryFn: api.getPortfolioSummary,
    refetchInterval: 60000, // Refresh every minute
  });
};

// Positions
export const usePositions = (params?: { custodian_id?: number; asset_type_id?: number }) => {
  return useQuery({
    queryKey: queryKeys.positions(params),
    queryFn: () => api.getPositions(params),
  });
};

export const useUpsertPosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpsertPositionRequest) => api.upsertPosition(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.custodians });
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.custodians });
    },
  });
};

export const useQuickCashUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: QuickCashUpdateRequest) => api.quickCashUpdate(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.custodians });
    },
  });
};

// Assets
export const useAssets = (params?: { asset_type_id?: number; price_api_source?: string }) => {
  return useQuery({
    queryKey: queryKeys.assets(params),
    queryFn: () => api.getAssets(params),
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateAssetRequest) => api.createAsset(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

// Custodians
export const useCustodians = () => {
  return useQuery({
    queryKey: queryKeys.custodians,
    queryFn: api.getCustodians,
  });
};

export const useCreateCustodian = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCustodianRequest) => api.createCustodian(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.custodians });
    },
  });
};

// Asset Types
export const useAssetTypes = () => {
  return useQuery({
    queryKey: queryKeys.assetTypes,
    queryFn: api.getAssetTypes,
  });
};

// Transactions
export const useTransactions = (params?: {
  asset_id?: number;
  custodian_id?: number;
  from_date?: string;
  to_date?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: () => api.getTransactions(params),
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTransactionRequest) => api.createTransaction(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.custodians });
    },
  });
};
