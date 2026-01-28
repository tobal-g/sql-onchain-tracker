import { useState, useMemo } from 'react';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/format';
import type { Transaction, Asset } from '../../types';

const TRANSACTION_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  buy: { bg: 'bg-green-100', text: 'text-green-800' },
  sell: { bg: 'bg-red-100', text: 'text-red-800' },
  transfer_in: { bg: 'bg-blue-100', text: 'text-blue-800' },
  transfer_out: { bg: 'bg-blue-100', text: 'text-blue-800' },
  deposit: { bg: 'bg-gray-100', text: 'text-gray-800' },
  withdrawal: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

// Color mapping for asset types
const ASSET_TYPE_COLORS: Record<string, string> = {
  stablecoin: '#10B981',
  crypto: '#F59E0B',
  etf: '#3B82F6',
  stock: '#8B5CF6',
  bond: '#06B6D4',
  cash: '#84CC16',
};

function getAssetTypeColor(type: string): string {
  return ASSET_TYPE_COLORS[type.toLowerCase()] ?? '#6B7280';
}

function capitalizeAssetType(type: string): string {
  // Handle special cases like "etf" -> "ETFs"
  const lower = type.toLowerCase();
  if (lower === 'etf') return 'ETFs';
  if (lower === 'crypto') return 'Crypto';
  // Default: capitalize first letter and add 's' for plural
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() + 's';
}

function formatTransactionType(type: string): string {
  return type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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

// Transactions table for a single asset
interface AssetTransactionsTableProps {
  transactions: Transaction[];
}

function AssetTransactionsTable({ transactions }: AssetTransactionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Custodian
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Type
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Quantity
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Price
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {transactions.map((tx) => {
            const typeStyle = TRANSACTION_TYPE_STYLES[tx.transaction_type] || {
              bg: 'bg-gray-100',
              text: 'text-gray-800',
            };

            return (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {formatDate(tx.transaction_date)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {tx.custodian_name}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}
                  >
                    {formatTransactionType(tx.transaction_type)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                  {formatQuantity(tx.quantity)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                  {tx.price_per_unit ? formatCurrency(tx.price_per_unit) : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {tx.total_value_usd ? formatCurrency(tx.total_value_usd) : '-'}
                </td>
                <td className="max-w-[200px] truncate px-6 py-4 text-sm text-gray-500" title={tx.notes}>
                  {tx.notes || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Collapsible section for each asset
interface CollapsibleAssetSectionProps {
  symbol: string;
  assetName: string;
  transactions: Transaction[];
  totalValue: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function CollapsibleAssetSection({
  symbol,
  assetName,
  transactions,
  totalValue,
  isExpanded,
  onToggle,
}: CollapsibleAssetSectionProps) {
  return (
    <div className="space-y-0">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-t-lg bg-white px-6 py-4 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronIcon isExpanded={isExpanded} className="text-gray-500" />
          <div className="text-left">
            <span className="text-lg font-semibold text-gray-900">{symbol}</span>
            <span className="ml-2 text-sm text-gray-500">{assetName}</span>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
            {transactions.length}
          </span>
        </div>
        <span className="text-lg font-semibold text-gray-900">
          {totalValue > 0 ? formatCurrency(totalValue) : '-'}
        </span>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-x border-b border-gray-200 rounded-b-lg overflow-hidden bg-white">
          <AssetTransactionsTable transactions={transactions} />
        </div>
      )}
    </div>
  );
}

// Main component
interface TransactionsGroupedViewProps {
  transactions: Transaction[];
  assets: Asset[];
}

export default function TransactionsGroupedView({ transactions, assets }: TransactionsGroupedViewProps) {
  // Create asset lookup map
  const assetMap = useMemo(() => {
    const map = new Map<number, Asset>();
    for (const asset of assets) {
      map.set(asset.id, asset);
    }
    return map;
  }, [assets]);

  // Group transactions by asset type, then by asset
  const groupedByType = useMemo(() => {
    if (transactions.length === 0) return [];

    // First, group by asset
    const assetGroups: Record<
      number,
      { symbol: string; assetName: string; assetType: string; transactions: Transaction[] }
    > = {};

    for (const tx of transactions) {
      const asset = assetMap.get(tx.asset_id);
      if (!assetGroups[tx.asset_id]) {
        assetGroups[tx.asset_id] = {
          symbol: tx.asset_symbol,
          assetName: asset?.name || '',
          assetType: asset?.asset_type.name || 'Other',
          transactions: [],
        };
      }
      assetGroups[tx.asset_id].transactions.push(tx);
    }

    // Convert to array and calculate totals
    const assetsWithTotals = Object.entries(assetGroups).map(([assetId, data]) => ({
      assetId: Number(assetId),
      symbol: data.symbol,
      assetName: data.assetName,
      assetType: data.assetType,
      transactions: data.transactions.sort(
        (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      ),
      totalValue: data.transactions.reduce((sum, tx) => sum + (tx.total_value_usd ?? 0), 0),
    }));

    // Now group by asset type
    const typeGroups: Record<
      string,
      {
        assets: typeof assetsWithTotals;
        totalValue: number;
        totalTransactions: number;
      }
    > = {};

    for (const asset of assetsWithTotals) {
      const typeKey = asset.assetType;
      if (!typeGroups[typeKey]) {
        typeGroups[typeKey] = {
          assets: [],
          totalValue: 0,
          totalTransactions: 0,
        };
      }
      typeGroups[typeKey].assets.push(asset);
      typeGroups[typeKey].totalValue += asset.totalValue;
      typeGroups[typeKey].totalTransactions += asset.transactions.length;
    }

    // Sort assets within each type by symbol
    for (const typeGroup of Object.values(typeGroups)) {
      typeGroup.assets.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    // Convert to array and sort types by total value
    return Object.entries(typeGroups)
      .map(([typeName, data]) => ({
        typeName,
        assets: data.assets,
        totalValue: data.totalValue,
        totalTransactions: data.totalTransactions,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [transactions, assetMap]);

  // Track expanded sections - all start collapsed
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => new Set());

  const toggleSection = (assetId: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  if (transactions.length === 0) {
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No transactions yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start by adding your first transaction to track your portfolio history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedByType.map(({ typeName, assets, totalValue, totalTransactions }) => (
        <div key={typeName} className="space-y-4">
          {/* Type Header */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="flex items-center gap-3 px-3">
              <h3 className="text-sm font-bold tracking-wider text-gray-700">
                {capitalizeAssetType(typeName)}
              </h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {totalTransactions} transactions
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {totalValue > 0 ? formatCurrency(totalValue) : '-'}
              </span>
            </div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Assets in this type */}
          <div className="space-y-4">
            {assets.map(({ assetId, symbol, assetName, transactions, totalValue }) => (
              <CollapsibleAssetSection
                key={assetId}
                symbol={symbol}
                assetName={assetName}
                transactions={transactions}
                totalValue={totalValue}
                isExpanded={expandedSections.has(assetId)}
                onToggle={() => toggleSection(assetId)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
