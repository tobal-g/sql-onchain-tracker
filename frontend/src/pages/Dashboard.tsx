import { useMemo } from 'react';
import { usePortfolioSummary, usePositions } from '../hooks/usePortfolio';
import { formatCurrency, formatPercent } from '../utils/format';
import { aggregatePositionsByAsset, groupAssetsByType } from '../utils/aggregation';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GroupedAssetCards from '../components/positions/GroupedAssetCards';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = usePortfolioSummary();
  const { data: positions, isLoading: positionsLoading } = usePositions();

  // Aggregate positions by asset and group by type
  // Must be called before any early returns to follow Rules of Hooks
  const { aggregatedAssets, groupedAssets } = useMemo(() => {
    if (!positions?.positions || !summary) return { aggregatedAssets: [], groupedAssets: [] };
    const aggregated = aggregatePositionsByAsset(positions.positions, summary.total_value_usd);
    const grouped = groupAssetsByType(aggregated, summary.total_value_usd);
    return { aggregatedAssets: aggregated, groupedAssets: grouped };
  }, [positions, summary]);

  if (summaryLoading || positionsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <h3 className="font-semibold">Error loading portfolio data</h3>
        <p className="mt-1 text-sm">Make sure the backend is running on port 3000.</p>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const assetTypePieData = summary.by_asset_type.map((item, index) => ({
    name: item.type,
    value: item.value_usd,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  const custodianPieData = summary.by_custodian.slice(0, 6).map((item, index) => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    fullName: item.name,
    value: item.value_usd,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  const assetPieData = aggregatedAssets.slice(0, 8).map((item, index) => ({
    name: item.symbol,
    value: item.totalValueUsd,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Last updated: {new Date(summary.last_updated).toLocaleString()}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Total Value</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(summary.total_value_usd)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Positions</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {positions?.positions.length ?? 0}
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Asset Types</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {summary.by_asset_type.length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Custodians</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {summary.by_custodian.length}
          </div>
        </div>
      </div>

      {/* Charts Row - 3 Pie Charts */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Allocation by Type */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">By Type</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetTypePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assetTypePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {summary.by_asset_type.map((item, index) => (
              <div key={item.type} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="capitalize">{item.type}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatCurrency(item.value_usd)}</span>
                  <span className="ml-2 text-gray-500">({formatPercent(item.percentage)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation by Asset */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">By Asset</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assetPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
            {aggregatedAssets.slice(0, 6).map((item, index) => (
              <div key={item.symbol} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{item.symbol}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatCurrency(item.totalValueUsd)}</span>
                  <span className="ml-2 text-gray-500">({formatPercent(item.percentage)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation by Custodian */}
        <div className="card md:col-span-2 xl:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">By Custodian</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={custodianPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {custodianPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
            {summary.by_custodian.slice(0, 6).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center min-w-0">
                  <div
                    className="mr-2 h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="ml-2 text-right flex-shrink-0">
                  <span className="font-medium">{formatCurrency(item.value_usd)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings by Asset Type */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Holdings by Asset</h2>
        <GroupedAssetCards groupedAssets={groupedAssets} />
      </div>
    </div>
  );
}
