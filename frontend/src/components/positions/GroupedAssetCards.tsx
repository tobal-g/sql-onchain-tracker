import { formatCurrency, formatQuantity, formatPercent } from '../../utils/format';
import type { AssetsByType } from '../../utils/aggregation';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

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

interface GroupedAssetCardsProps {
  groupedAssets: AssetsByType[];
}

export default function GroupedAssetCards({ groupedAssets }: GroupedAssetCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {groupedAssets.map((group) => (
        <div key={group.type} className="card p-0">
          {/* Group Header */}
          <div
            className="flex items-center justify-between border-b border-gray-200 px-4 py-3"
            style={{ borderLeftWidth: '4px', borderLeftColor: getTypeColor(group.type) }}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold capitalize text-gray-900">{group.type}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {group.assets.length}
              </span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">{formatCurrency(group.totalValue)}</div>
              <div className="text-xs text-gray-500">{formatPercent(group.percentage)}</div>
            </div>
          </div>

          {/* Assets List */}
          <div className="divide-y divide-gray-100">
            {group.assets.map((asset, index) => (
              <div
                key={asset.symbol}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {asset.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{asset.symbol}</div>
                    <div className="text-xs text-gray-500">{formatQuantity(asset.totalQuantity)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatCurrency(asset.totalValueUsd)}</div>
                  <div className="text-xs text-gray-500">{formatPercent(asset.percentage)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
