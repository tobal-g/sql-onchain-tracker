import { useState, useEffect } from 'react';
import {
  useTransactions,
  useAssets,
  useCustodians,
  useCreateTransaction,
} from '../hooks/usePortfolio';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import TransactionsGroupedView from '../components/transactions/TransactionsGroupedView';
import TransactionModal from '../components/transactions/TransactionModal';
import type { CreateTransactionRequest } from '../types';

export default function Transactions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterAssetId, setFilterAssetId] = useState<number | undefined>();
  const [filterCustodianId, setFilterCustodianId] = useState<number | undefined>();
  const { addToast } = useToast();

  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({
    asset_id: filterAssetId,
    custodian_id: filterCustodianId,
  });
  const { data: assetsData } = useAssets();
  const { data: custodiansData } = useCustodians();
  const createMutation = useCreateTransaction();

  const handleSubmit = async (data: CreateTransactionRequest) => {
    try {
      await createMutation.mutateAsync(data);
      setIsModalOpen(false);
      addToast('Transaction logged successfully', 'success');
    } catch {
      addToast('Failed to log transaction', 'error');
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  if (transactionsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            {transactionsData?.transactions.length ?? 0} transactions recorded
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + Log Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="mb-3 text-sm font-medium text-gray-700">Filters</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Asset</label>
            <select
              value={filterAssetId ?? ''}
              onChange={(e) =>
                setFilterAssetId(e.target.value ? Number(e.target.value) : undefined)
              }
              className="input"
            >
              <option value="">All Assets</option>
              {assetsData?.assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol} - {asset.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Custodian</label>
            <select
              value={filterCustodianId ?? ''}
              onChange={(e) =>
                setFilterCustodianId(e.target.value ? Number(e.target.value) : undefined)
              }
              className="input"
            >
              <option value="">All Custodians</option>
              {custodiansData?.custodians.map((custodian) => (
                <option key={custodian.id} value={custodian.id}>
                  {custodian.name}
                </option>
              ))}
            </select>
          </div>
          {(filterAssetId || filterCustodianId) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterAssetId(undefined);
                  setFilterCustodianId(undefined);
                }}
                className="btn btn-secondary text-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Grouped by Asset */}
      <TransactionsGroupedView
        transactions={transactionsData?.transactions ?? []}
        assets={assetsData?.assets ?? []}
      />

      {/* Transaction Modal */}
      {isModalOpen && (
        <TransactionModal
          assets={assetsData?.assets ?? []}
          custodians={custodiansData?.custodians ?? []}
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}
