import { formatCurrency, formatQuantity, formatDateTime } from '../../utils/format';
import type { Position } from '../../types';

interface PositionsTableProps {
  positions: Position[];
  deleteConfirm: number | null;
  onEdit: (position: Position) => void;
  onDeleteClick: (id: number) => void;
  onDeleteConfirm: (id: number) => void;
  onDeleteCancel: () => void;
  isDeleting: boolean;
}

export default function PositionsTable({
  positions,
  deleteConfirm,
  onEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  isDeleting,
}: PositionsTableProps) {
  return (
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
            {positions.map((position) => (
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
                    onClick={() => onEdit(position)}
                    className="mr-2 text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  {deleteConfirm === position.id ? (
                    <>
                      <button
                        onClick={() => onDeleteConfirm(position.id)}
                        className="mr-2 text-red-600 hover:text-red-800"
                        disabled={isDeleting}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={onDeleteCancel}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onDeleteClick(position.id)}
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
  );
}
