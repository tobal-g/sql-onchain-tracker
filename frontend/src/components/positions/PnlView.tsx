import { useState, useMemo } from 'react';
import { usePnl } from '../../hooks/usePortfolio';
import {
  formatCurrency,
  formatPnl,
  formatPnlPercent,
  formatApy,
  formatQuantity,
  formatHoldingPeriod,
  formatDate,
} from '../../utils/format';
import LoadingSpinner from '../common/LoadingSpinner';
import type { PnlPosition } from '../../types';

// Color mapping for asset types
const TYPE_COLORS: Record<string, string> = {
  stablecoin: '#10B981',
  crypto: '#F59E0B',
  etf: '#3B82F6',
  stock: '#8B5CF6',
  bond: '#06B6D4',
  cash: '#84CC16',
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? '#6B7280';
}

function capitalizeType(type: string): string {
  // Handle special cases like "etf" -> "ETFs"
  const lower = type.toLowerCase();
  if (lower === 'etf') return 'ETFs';
  if (lower === 'crypto') return 'Crypto';
  // Default: capitalize first letter and add 's' for plural
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() + 's';
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

// Position card component (extracted for reuse)
function PositionCard({ position }: { position: PnlPosition }) {
  return (
    <div className="card p-0">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-gray-200 px-4 py-3"
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: getTypeColor(position.asset_type),
        }}
      >
        <div>
          <div className="font-semibold text-gray-900">{position.symbol}</div>
          <div className="text-sm text-gray-500">{position.asset_name}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {formatCurrency(position.current_value_usd)}
          </div>
          <div className="text-xs text-gray-500">
            {formatQuantity(position.current_quantity)} @ {formatCurrency(position.current_price_usd)}
          </div>
        </div>
      </div>

      {/* P&L Details */}
      <div className="divide-y divide-gray-100 px-4">
        {/* Cost Basis */}
        {position.cost_basis && (
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Avg Cost</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(position.cost_basis.avg_cost_per_unit)}
            </span>
          </div>
        )}

        {/* Unrealized P&L */}
        {position.unrealized_pnl && (
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Unrealized P&L</span>
            <div className="text-right">
              <span
                className={`text-sm font-medium ${
                  position.unrealized_pnl.amount_usd >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatPnl(position.unrealized_pnl.amount_usd)}
              </span>
              <span
                className={`ml-2 text-xs ${
                  position.unrealized_pnl.amount_usd >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                ({formatPnlPercent(position.unrealized_pnl.percent)})
              </span>
            </div>
          </div>
        )}

        {/* Realized P&L */}
        {position.realized_pnl && position.realized_pnl.total_qty_sold > 0 && (
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Realized P&L</span>
            <span
              className={`text-sm font-medium ${
                position.realized_pnl.amount_usd >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatPnl(position.realized_pnl.amount_usd)}
            </span>
          </div>
        )}

        {/* APY */}
        {position.performance && (
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">APY</span>
            <span
              className={`text-sm font-medium ${
                position.performance.apy !== null && position.performance.apy >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatApy(position.performance.apy)}
            </span>
          </div>
        )}

        {/* Holding Period */}
        {position.performance && position.performance.first_buy_date && (
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Holding Period</span>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900">
                {formatHoldingPeriod(position.performance.holding_days)}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                (since {formatDate(position.performance.first_buy_date)})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Collapsible section component
interface CollapsibleSectionProps {
  type: string;
  positions: PnlPosition[];
  totalValue: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function CollapsibleSection({
  type,
  positions,
  totalValue,
  isExpanded,
  onToggle,
}: CollapsibleSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: getTypeColor(type),
        }}
      >
        <div className="flex items-center gap-3">
          <ChevronIcon isExpanded={isExpanded} className="text-gray-500" />
          <span className="text-lg font-semibold text-gray-900">
            {capitalizeType(type)}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
            {positions.length}
          </span>
        </div>
        <span className="text-lg font-semibold text-gray-900">
          {formatCurrency(totalValue)}
        </span>
      </button>

      {/* Collapsible Content */}
      <div
        className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 overflow-hidden transition-all duration-300 ${
          isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{
          maxHeight: isExpanded ? `${positions.length * 400}px` : '0',
        }}
      >
        {positions.map((position) => (
          <PositionCard key={position.asset_id} position={position} />
        ))}
      </div>
    </div>
  );
}

export default function PnlView() {
  const { data: pnlData, isLoading, error } = usePnl();

  // Group positions by asset type
  const groupedPositions = useMemo(() => {
    if (!pnlData) return [];

    const positionsWithCostBasis = pnlData.positions.filter((p) => p.has_cost_basis);
    const groups: Record<string, PnlPosition[]> = {};

    for (const position of positionsWithCostBasis) {
      const type = position.asset_type.toLowerCase();
      if (!groups[type]) groups[type] = [];
      groups[type].push(position);
    }

    // Sort groups by total value descending
    return Object.entries(groups)
      .map(([type, positions]) => ({
        type,
        positions,
        totalValue: positions.reduce((sum, p) => sum + p.current_value_usd, 0),
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [pnlData]);

  // Track expanded sections - all start collapsed
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set());

  const toggleSection = (type: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <h3 className="font-semibold">Error loading P&L data</h3>
        <p className="mt-1 text-sm">Please try again later.</p>
      </div>
    );
  }

  if (!pnlData) {
    return null;
  }

  const { summary, positions } = pnlData;
  const positionsWithoutCostBasis = positions.filter((p) => !p.has_cost_basis);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Total Cost Basis</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(summary.total_cost_basis_usd)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Current Value</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(summary.total_current_value_usd)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Unrealized P&L</div>
          <div
            className={`mt-1 text-2xl font-bold ${
              summary.total_unrealized_pnl_usd >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatPnl(summary.total_unrealized_pnl_usd)}
          </div>
          <div
            className={`text-sm ${
              summary.total_unrealized_pnl_usd >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatPnlPercent(summary.total_unrealized_pnl_percent)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Realized P&L</div>
          <div
            className={`mt-1 text-2xl font-bold ${
              summary.total_realized_pnl_usd >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatPnl(summary.total_realized_pnl_usd)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {summary.positions_with_cost_basis} with cost basis ·{' '}
            {summary.positions_without_cost_basis} without
          </div>
        </div>
      </div>

      {/* Grouped Positions with Cost Basis */}
      {groupedPositions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Positions with Transaction History
          </h2>
          {groupedPositions.map(({ type, positions, totalValue }) => (
            <CollapsibleSection
              key={type}
              type={type}
              positions={positions}
              totalValue={totalValue}
              isExpanded={expandedSections.has(type)}
              onToggle={() => toggleSection(type)}
            />
          ))}
        </div>
      )}

      {/* Positions without Cost Basis */}
      {positionsWithoutCostBasis.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Positions Without Transaction History
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            These positions don't have recorded buy transactions. Add transactions to track P&L.
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {positionsWithoutCostBasis.map((position) => (
              <div key={position.asset_id} className="card p-0 opacity-75">
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: getTypeColor(position.asset_type),
                  }}
                >
                  <div>
                    <div className="font-semibold text-gray-900">{position.symbol}</div>
                    <div className="text-sm text-gray-500">{position.asset_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(position.current_value_usd)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatQuantity(position.current_quantity)} @ {formatCurrency(position.current_price_usd)}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-4 py-2 text-center text-sm text-gray-400">
                  No transaction history
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {positions.length === 0 && (
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No positions to analyze</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add positions and log transactions to see P&L analysis.
          </p>
        </div>
      )}
    </div>
  );
}
