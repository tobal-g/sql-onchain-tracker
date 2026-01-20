import { useState, useEffect } from 'react';
import { useCustodians, useCreateCustodian } from '../hooks/usePortfolio';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import type { CreateCustodianRequest } from '../types';

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {custodiansData?.custodians.map((custodian) => (
          <div key={custodian.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{custodian.name}</h3>
                <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
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
              <p className="mt-2 truncate font-mono text-xs text-gray-400">
                {custodian.wallet_address}
              </p>
            )}
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
