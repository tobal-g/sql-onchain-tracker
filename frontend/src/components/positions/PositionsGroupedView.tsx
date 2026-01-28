import { useState, useMemo } from 'react';
import { formatCurrency, formatQuantity, formatDateTime } from '../../utils/format';
import type { Position } from '../../types';

// Color mapping for custodian types
const TYPE_COLORS: Record<string, string> = {
  'crypto exchange': '#F59E0B',
  exchange: '#F59E0B',
  'defi wallet': '#8B5CF6',
  wallet: '#8B5CF6',
  broker: '#3B82F6',
  bank: '#10B981',
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? '#6B7280';
}

function formatCustodianType(type: string): string {
  // Normalize type names for display
  const lower = type.toLowerCase();
  if (lower.includes('exchange')) return 'CRYPTO EXCHANGES';
  if (lower.includes('wallet')) return 'DEFI WALLETS';
  if (lower.includes('broker')) return 'BROKERS';
  if (lower.includes('bank')) return 'BANKS';
  return type.toUpperCase() + 'S';
}

// Chevron icon component
function ChevronIcon({ isExpanded, className }: { isExpanded: boolean; className?: string }) {
  return (
    <svg
      className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'} ${className ?? ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// Positions table for a single custodian
interface CustodianPositionsTableProps {
  positions: Position[];
  deleteConfirm: number | null;
  onEdit: (position: Position) => void;
  onDeleteClick: (id: number) => void;
  onDeleteConfirm: (id: number) => void;
  onDeleteCancel: () => void;
  isDeleting: boolean;
}

function CustodianPositionsTable({
  positions,
  deleteConfirm,
  onEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  isDeleting,
}: CustodianPositionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Asset
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
  );
}

// Collapsible section for each custodian
interface CollapsibleCustodianSectionProps {
  custodianName: string;
  custodianType: string;
  positions: Position[];
  totalValue: number;
  isExpanded: boolean;
  onToggle: () => void;
  deleteConfirm: number | null;
  onEdit: (position: Position) => void;
  onDeleteClick: (id: number) => void;
  onDeleteConfirm: (id: number) => void;
  onDeleteCancel: () => void;
  isDeleting: boolean;
}

function CollapsibleCustodianSection({
  custodianName,
  custodianType,
  positions,
  totalValue,
  isExpanded,
  onToggle,
  deleteConfirm,
  onEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  isDeleting,
}: CollapsibleCustodianSectionProps) {
  const borderColor = getTypeColor(custodianType);

  return (
    <div className="space-y-0">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-t-lg bg-white px-6 py-4 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: borderColor,
        }}
      >
        <div className="flex items-center gap-3">
          <ChevronIcon isExpanded={isExpanded} className="text-gray-500" />
          <div className="text-left">
            <span className="text-lg font-semibold text-gray-900">{custodianName}</span>
            <span className="ml-2 text-sm text-gray-500">{custodianType}</span>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
            {positions.length}
          </span>
        </div>
        <span className="text-lg font-semibold text-gray-900">
          {formatCurrency(totalValue)}
        </span>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-x border-b border-gray-200 rounded-b-lg overflow-hidden bg-white">
          <CustodianPositionsTable
            positions={positions}
            deleteConfirm={deleteConfirm}
            onEdit={onEdit}
            onDeleteClick={onDeleteClick}
            onDeleteConfirm={onDeleteConfirm}
            onDeleteCancel={onDeleteCancel}
            isDeleting={isDeleting}
          />
        </div>
      )}
    </div>
  );
}

// Main component
interface PositionsGroupedViewProps {
  positions: Position[];
  deleteConfirm: number | null;
  onEdit: (position: Position) => void;
  onDeleteClick: (id: number) => void;
  onDeleteConfirm: (id: number) => void;
  onDeleteCancel: () => void;
  isDeleting: boolean;
}

export default function PositionsGroupedView({
  positions,
  deleteConfirm,
  onEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  isDeleting,
}: PositionsGroupedViewProps) {
  // Group positions by custodian type, then by custodian
  const groupedByType = useMemo(() => {
    if (positions.length === 0) return [];

    // First, group by custodian
    const custodianGroups: Record<
      number,
      { custodianName: string; custodianType: string; positions: Position[] }
    > = {};

    for (const position of positions) {
      if (!custodianGroups[position.custodian.id]) {
        custodianGroups[position.custodian.id] = {
          custodianName: position.custodian.name,
          custodianType: position.custodian.type,
          positions: [],
        };
      }
      custodianGroups[position.custodian.id].positions.push(position);
    }

    // Convert to array and calculate totals
    const custodiansWithTotals = Object.entries(custodianGroups).map(([custodianId, data]) => ({
      custodianId: Number(custodianId),
      custodianName: data.custodianName,
      custodianType: data.custodianType,
      positions: data.positions,
      totalValue: data.positions.reduce((sum, p) => sum + p.value_usd, 0),
    }));

    // Now group by custodian type
    const typeGroups: Record<
      string,
      {
        custodians: typeof custodiansWithTotals;
        totalValue: number;
        totalPositions: number;
      }
    > = {};

    for (const custodian of custodiansWithTotals) {
      const typeKey = formatCustodianType(custodian.custodianType);
      if (!typeGroups[typeKey]) {
        typeGroups[typeKey] = {
          custodians: [],
          totalValue: 0,
          totalPositions: 0,
        };
      }
      typeGroups[typeKey].custodians.push(custodian);
      typeGroups[typeKey].totalValue += custodian.totalValue;
      typeGroups[typeKey].totalPositions += custodian.positions.length;
    }

    // Sort custodians within each type by value
    for (const typeGroup of Object.values(typeGroups)) {
      typeGroup.custodians.sort((a, b) => b.totalValue - a.totalValue);
    }

    // Convert to array and sort types by total value
    return Object.entries(typeGroups)
      .map(([typeName, data]) => ({
        typeName,
        custodians: data.custodians,
        totalValue: data.totalValue,
        totalPositions: data.totalPositions,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [positions]);

  // Track expanded sections - all start collapsed
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => new Set());

  const toggleSection = (custodianId: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(custodianId)) {
        next.delete(custodianId);
      } else {
        next.add(custodianId);
      }
      return next;
    });
  };

  if (positions.length === 0) {
    return (
      <div className="card py-12 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 p-3">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No positions yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add your first position to start tracking your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedByType.map(({ typeName, custodians, totalValue, totalPositions }) => (
        <div key={typeName} className="space-y-4">
          {/* Type Header */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="flex items-center gap-3 px-3">
              <h3 className="text-sm font-bold tracking-wider text-gray-700">{typeName}</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {totalPositions} positions
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(totalValue)}
              </span>
            </div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Custodians in this type */}
          <div className="space-y-4">
            {custodians.map(({ custodianId, custodianName, custodianType, positions, totalValue }) => (
              <CollapsibleCustodianSection
                key={custodianId}
                custodianName={custodianName}
                custodianType={custodianType}
                positions={positions}
                totalValue={totalValue}
                isExpanded={expandedSections.has(custodianId)}
                onToggle={() => toggleSection(custodianId)}
                deleteConfirm={deleteConfirm}
                onEdit={onEdit}
                onDeleteClick={onDeleteClick}
                onDeleteConfirm={onDeleteConfirm}
                onDeleteCancel={onDeleteCancel}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
