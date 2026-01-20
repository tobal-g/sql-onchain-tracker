import { useState, useEffect } from 'react';
import { useAssets, useAssetTypes, useCreateAsset } from '../hooks/usePortfolio';
import { formatCurrency, formatDate } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import type { CreateAssetRequest } from '../types';

export default function Assets() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: assetsData, isLoading } = useAssets();
  const { data: assetTypesData } = useAssetTypes();
  const createMutation = useCreateAsset();
  const { addToast } = useToast();

  const handleSubmit = async (data: CreateAssetRequest) => {
    try {
      await createMutation.mutateAsync(data);
      setIsModalOpen(false);
      addToast('Asset created successfully', 'success');
    } catch {
      addToast('Failed to create asset', 'error');
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="mt-1 text-sm text-gray-500">
            {assetsData?.assets.length ?? 0} assets tracked
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + Add Asset
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price Source
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Current Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  As of
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {assetsData?.assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    {asset.symbol}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900">{asset.name}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-800">
                      {asset.asset_type.name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                    {asset.price_api_source ?? 'manual'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900">
                    {asset.current_price ? formatCurrency(asset.current_price) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                    {asset.price_as_of ? formatDate(asset.price_as_of) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Modal */}
      {isModalOpen && (
        <AssetModal
          assetTypes={assetTypesData?.asset_types ?? []}
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

interface AssetModalProps {
  assetTypes: { id: number; name: string }[];
  onSubmit: (data: CreateAssetRequest) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

function AssetModal({ assetTypes, onSubmit, onClose, isLoading }: AssetModalProps) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [assetTypeId, setAssetTypeId] = useState(0);
  const [priceApiSource, setPriceApiSource] = useState('');
  const [apiIdentifier, setApiIdentifier] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      symbol,
      name,
      asset_type_id: assetTypeId,
      price_api_source: priceApiSource || undefined,
      api_identifier: apiIdentifier || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Add Asset</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="input"
              placeholder="BTC"
              required
            />
          </div>
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Bitcoin"
              required
            />
          </div>
          <div>
            <label className="label">Asset Type</label>
            <select
              value={assetTypeId}
              onChange={(e) => setAssetTypeId(Number(e.target.value))}
              className="input"
              required
            >
              <option value={0}>Select a type</option>
              {assetTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Price Source (optional)</label>
            <select
              value={priceApiSource}
              onChange={(e) => setPriceApiSource(e.target.value)}
              className="input"
            >
              <option value="">Manual</option>
              <option value="zapper">Zapper</option>
              <option value="yahoofinance">Yahoo Finance</option>
            </select>
          </div>
          {priceApiSource && (
            <div>
              <label className="label">API Identifier</label>
              <input
                type="text"
                value={apiIdentifier}
                onChange={(e) => setApiIdentifier(e.target.value)}
                className="input"
                placeholder="e.g., VOO or 0x..."
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !symbol || !name || !assetTypeId}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
