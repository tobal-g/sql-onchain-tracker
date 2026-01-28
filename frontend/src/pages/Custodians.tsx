import { useState, useEffect, useMemo } from 'react';
import { useCustodians, useCreateCustodian } from '../hooks/usePortfolio';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import type { CreateCustodianRequest, Custodian } from '../types';

const CUSTODIAN_TYPES = [
  'hardware_wallet',
  'software_wallet',
  'hot_wallet',
  'multisig_wallet',
  'broker',
  'exchange',
  'bank',
  'cash',
];

// Color mapping for custodian types
const TYPE_COLORS: Record<string, string> = {
  exchange: '#F59E0B',
  'crypto exchange': '#F59E0B',
  wallet: '#8B5CF6',
  'hardware wallet': '#8B5CF6',
  'software wallet': '#8B5CF6',
  'hot wallet': '#8B5CF6',
  'multisig wallet': '#8B5CF6',
  'defi wallet': '#8B5CF6',
  broker: '#3B82F6',
  bank: '#10B981',
  cash: '#84CC16',
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? '#6B7280';
}

function formatCustodianTypeForDisplay(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes('exchange')) return 'CRYPTO EXCHANGES';
  if (lower.includes('wallet')) return 'WALLETS';
  if (lower.includes('broker')) return 'BROKERS';
  if (lower.includes('bank')) return 'BANKS';
  if (lower.includes('cash')) return 'CASH';
  return type.toUpperCase();
}

function isEVMAddress(address: string): boolean {
  return address.startsWith('0x') && address.length === 42;
}

export default function Custodians() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: custodiansData, isLoading } = useCustodians();
  const createMutation = useCreateCustodian();
  const { addToast } = useToast();

  const handleSubmit = async (data: CreateCustodianRequest) => {
    try {
      await createMutation.mutateAsync(data);
      setIsModalOpen(false);
      addToast('Custodian created successfully', 'success');
    } catch {
      addToast('Failed to create custodian', 'error');
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

  const totalValue = custodiansData?.custodians.reduce((sum, c) => sum + c.total_value_usd, 0) ?? 0;

  // Group custodians by type
  const groupedByType = useMemo(() => {
    if (!custodiansData?.custodians) return [];

    const typeGroups: Record<
      string,
      {
        custodians: Custodian[];
        totalValue: number;
      }
    > = {};

    for (const custodian of custodiansData.custodians) {
      const typeKey = formatCustodianTypeForDisplay(custodian.type);
      if (!typeGroups[typeKey]) {
        typeGroups[typeKey] = {
          custodians: [],
          totalValue: 0,
        };
      }
      typeGroups[typeKey].custodians.push(custodian);
      typeGroups[typeKey].totalValue += custodian.total_value_usd;
    }

    // Sort custodians within each type by value
    for (const typeGroup of Object.values(typeGroups)) {
      typeGroup.custodians.sort((a, b) => b.total_value_usd - a.total_value_usd);
    }

    // Convert to array and sort types by total value
    return Object.entries(typeGroups)
      .map(([typeName, data]) => ({
        typeName,
        custodians: data.custodians,
        totalValue: data.totalValue,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [custodiansData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custodians</h1>
          <p className="mt-1 text-sm text-gray-500">
            {custodiansData?.custodians.length ?? 0} custodians · Total: {formatCurrency(totalValue)}
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + Add Custodian
        </button>
      </div>

      <div className="space-y-8">
        {groupedByType.map(({ typeName, custodians, totalValue: typeValue }) => (
          <div key={typeName} className="space-y-4">
            {/* Type Header */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="flex items-center gap-3 px-3">
                <h3 className="text-sm font-bold tracking-wider text-gray-700">{typeName}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {custodians.length} {custodians.length === 1 ? 'custodian' : 'custodians'}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(typeValue)}
                </span>
              </div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Custodian Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {custodians.map((custodian) => {
                const typeColor = getTypeColor(custodian.type);
                const isEVM = custodian.wallet_address && isEVMAddress(custodian.wallet_address);

                return (
                  <div key={custodian.id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{custodian.name}</h3>
                        <span
                          className="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: typeColor }}
                        >
                          {custodian.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(custodian.total_value_usd)}
                        </div>
                        {totalValue > 0 && (
                          <div className="text-sm text-gray-500">
                            {((custodian.total_value_usd / totalValue) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                    {custodian.description && (
                      <p className="mt-2 text-sm text-gray-500">{custodian.description}</p>
                    )}
                    {custodian.wallet_address && (
                      <div className="mt-2">
                        <p className="truncate font-mono text-xs text-gray-400">
                          {custodian.wallet_address}
                        </p>
                        {isEVM && (
                          <div className="mt-2 flex gap-2">
                            <a
                              href={`https://etherscan.io/address/${custodian.wallet_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View on Etherscan"
                            >
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 18h10v-2H7v2zM17 14H7v-2h10v2zM7 10h10V8H7v2z" />
                              </svg>
                              Etherscan
                            </a>
                            <a
                              href={`https://debank.com/profile/${custodian.wallet_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                              title="View on DeBank"
                            >
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              DeBank
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custodian Modal */}
      {isModalOpen && (
        <CustodianModal
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

interface CustodianModalProps {
  onSubmit: (data: CreateCustodianRequest) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

function CustodianModal({ onSubmit, onClose, isLoading }: CustodianModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      type,
      description: description || undefined,
      wallet_address: walletAddress || undefined,
    });
  };

  const showWalletField = type.includes('wallet');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Add Custodian</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., Ledger Nano X"
              required
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a type</option>
              {CUSTODIAN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="e.g., Main cold storage"
            />
          </div>
          {showWalletField && (
            <div>
              <label className="label">Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="input font-mono"
                placeholder="0x... or bc1..."
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
              disabled={isLoading || !name || !type}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
