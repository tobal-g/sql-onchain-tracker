import { useState, useEffect } from 'react';
import {
  usePositions,
  useAssets,
  useCustodians,
  useUpsertPosition,
  useDeletePosition,
} from '../hooks/usePortfolio';
import { formatCurrency, formatQuantity, formatDateTime } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import type { Position, UpsertPositionRequest } from '../types';

export default function Positions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { addToast } = useToast();

  const { data: positionsData, isLoading } = usePositions();
  const { data: assetsData } = useAssets();
  const { data: custodiansData } = useCustodians();
  const upsertMutation = useUpsertPosition();
  const deleteMutation = useDeletePosition();

  const handleAdd = () => {
    setEditingPosition(null);
    setIsModalOpen(true);
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirm(null);
      addToast('Position deleted successfully', 'success');
    } catch {
      addToast('Failed to delete position', 'error');
    }
  };

  const handleSubmit = async (data: UpsertPositionRequest) => {
    try {
      await upsertMutation.mutateAsync(data);
      setIsModalOpen(false);
      setEditingPosition(null);
      addToast(editingPosition ? 'Position updated successfully' : 'Position created successfully', 'success');
    } catch {
      addToast('Failed to save position', 'error');
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm !== null) {
          setDeleteConfirm(null);
        } else if (isModalOpen) {
          setIsModalOpen(false);
          setEditingPosition(null);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, deleteConfirm]);

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
          <h1 className="text-2xl font-bold text-gray-900">Positions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Total Value: {formatCurrency(positionsData?.total_value_usd ?? 0)}
          </p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          + Add Position
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Custodian
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {positionsData?.positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-medium text-gray-900">{position.asset.symbol}</div>
                    <div className="text-sm text-gray-500">{position.asset.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-gray-900">{position.custodian.name}</div>
                    <div className="text-sm text-gray-500">{position.custodian.type}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900">
                    {formatQuantity(position.quantity)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900">
                    {formatCurrency(position.current_price)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(position.value_usd)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                    {formatDateTime(position.updated_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(position)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    {deleteConfirm === position.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(position.id)}
                          className="mr-2 text-red-600 hover:text-red-800"
                          disabled={deleteMutation.isPending}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(position.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Modal */}
      {isModalOpen && (
        <PositionModal
          position={editingPosition}
          assets={assetsData?.assets ?? []}
          custodians={custodiansData?.custodians ?? []}
          onSubmit={handleSubmit}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPosition(null);
          }}
          isLoading={upsertMutation.isPending}
        />
      )}
    </div>
  );
}

interface PositionModalProps {
  position: Position | null;
  assets: { id: number; symbol: string; name: string }[];
  custodians: { id: number; name: string }[];
  onSubmit: (data: UpsertPositionRequest) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

function PositionModal({
  position,
  assets,
  custodians,
  onSubmit,
  onClose,
  isLoading,
}: PositionModalProps) {
  const [assetId, setAssetId] = useState(position?.asset.id ?? 0);
  const [custodianId, setCustodianId] = useState(position?.custodian.id ?? 0);
  const [quantity, setQuantity] = useState(position?.quantity?.toString() ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      asset_id: assetId,
      custodian_id: custodianId,
      quantity: parseFloat(quantity),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">
          {position ? 'Edit Position' : 'Add Position'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
          <div>
            <label className="label">Quantity</label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !assetId || !custodianId || !quantity}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
