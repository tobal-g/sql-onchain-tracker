import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import type { Asset, Custodian, CreateTransactionRequest } from '../../types';

const TRANSACTION_TYPES = [
  { value: 'buy', label: 'Buy', requiresPrice: true },
  { value: 'sell', label: 'Sell', requiresPrice: true },
  { value: 'transfer_in', label: 'Transfer In', requiresPrice: false },
  { value: 'transfer_out', label: 'Transfer Out', requiresPrice: false },
  { value: 'deposit', label: 'Deposit', requiresPrice: false },
  { value: 'withdrawal', label: 'Withdrawal', requiresPrice: false },
] as const;

interface TransactionModalProps {
  assets: Asset[];
  custodians: Custodian[];
  onSubmit: (data: CreateTransactionRequest) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export default function TransactionModal({
  assets,
  custodians,
  onSubmit,
  onClose,
  isLoading,
}: TransactionModalProps) {
  const [assetId, setAssetId] = useState(0);
  const [custodianId, setCustodianId] = useState(0);
  const [transactionType, setTransactionType] = useState<string>('buy');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  const selectedTypeConfig = TRANSACTION_TYPES.find((t) => t.value === transactionType);
  const requiresPrice = selectedTypeConfig?.requiresPrice ?? false;

  // Calculate total value for display
  const totalValue =
    quantity && pricePerUnit ? parseFloat(quantity) * parseFloat(pricePerUnit) : null;

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateTransactionRequest = {
      asset_id: assetId,
      custodian_id: custodianId,
      transaction_type: transactionType as CreateTransactionRequest['transaction_type'],
      quantity: parseFloat(quantity),
      transaction_date: transactionDate,
    };

    if (requiresPrice && pricePerUnit) {
      data.price_per_unit = parseFloat(pricePerUnit);
    }

    if (notes.trim()) {
      data.notes = notes.trim();
    }

    await onSubmit(data);
  };

  const isFormValid =
    assetId > 0 &&
    custodianId > 0 &&
    transactionType &&
    quantity &&
    parseFloat(quantity) > 0 &&
    transactionDate &&
    (!requiresPrice || (pricePerUnit && parseFloat(pricePerUnit) > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Log Transaction</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Asset Select */}
          <div>
            <label className="label">Asset</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(Number(e.target.value))}
              className="input"
              required
            >
              <option value={0}>Select an asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custodian Select */}
          <div>
            <label className="label">Custodian</label>
            <select
              value={custodianId}
              onChange={(e) => setCustodianId(Number(e.target.value))}
              className="input"
              required
            >
              <option value={0}>Select a custodian</option>
              {custodians.map((custodian) => (
                <option key={custodian.id} value={custodian.id}>
                  {custodian.name}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="label">Transaction Type</label>
            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value);
                // Clear price when switching to a type that doesn't require it
                const newType = TRANSACTION_TYPES.find((t) => t.value === e.target.value);
                if (!newType?.requiresPrice) {
                  setPricePerUnit('');
                }
              }}
              className="input"
              required
            >
              {TRANSACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Price Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input"
                placeholder="0.00"
                required
              />
            </div>
            {requiresPrice && (
              <div>
                <label className="label">Price per Unit (USD)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="input"
                  placeholder="0.00"
                  required={requiresPrice}
                />
              </div>
            )}
          </div>

          {/* Total Value Display */}
          {requiresPrice && totalValue !== null && totalValue > 0 && (
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-sm text-gray-500">Total Value</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(totalValue)}
              </div>
            </div>
          )}

          {/* Transaction Date */}
          <div>
            <label className="label">Transaction Date</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="input"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={2}
              placeholder="Add any notes about this transaction..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
