import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercent } from '../../utils/format';
import { groupAssetsByType, type AggregatedAsset } from '../../utils/aggregation';
import GroupedAssetCards from './GroupedAssetCards';

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

interface AssetSummaryViewProps {
  aggregatedAssets: AggregatedAsset[];
  totalValue: number;
}

export default function AssetSummaryView({ aggregatedAssets, totalValue }: AssetSummaryViewProps) {
  const groupedAssets = useMemo(
    () => groupAssetsByType(aggregatedAssets, totalValue),
    [aggregatedAssets, totalValue]
  );

  const chartData = aggregatedAssets.slice(0, 8).map((asset, index) => ({
    name: asset.symbol,
    value: asset.totalValueUsd,
    percentage: asset.percentage,
    color: COLORS[index % COLORS.length],
  }));

  // If there are more than 8 assets, group the rest as "Other"
  if (aggregatedAssets.length > 8) {
    const otherAssets = aggregatedAssets.slice(8);
    const otherValue = otherAssets.reduce((sum, a) => sum + a.totalValueUsd, 0);
    const otherPercentage = otherAssets.reduce((sum, a) => sum + a.percentage, 0);
    chartData.push({
      name: 'Other',
      value: otherValue,
      percentage: otherPercentage,
      color: '#9CA3AF',
    });
  }

  return (
    <div className="space-y-6">
      {/* Top section: Chart + Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donut Chart */}
        <div className="card lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Asset Allocation</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center">
            <div className="text-sm text-gray-500">Total Value</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
          </div>
        </div>

        {/* Asset Type Summary Cards */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">By Asset Type</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupedAssets.map((group) => (
              <div
                key={group.type}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: getTypeColor(group.type) }}
                  />
                  <span className="text-sm font-medium capitalize text-gray-600">
                    {group.type}
                  </span>
                </div>
                <div className="mt-2 text-xl font-bold text-gray-900">
                  {formatCurrency(group.totalValue)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatPercent(group.percentage)} · {group.assets.length} asset{group.assets.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped Assets Cards */}
      <GroupedAssetCards groupedAssets={groupedAssets} />
    </div>
  );
}
