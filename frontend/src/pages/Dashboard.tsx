import { usePortfolioSummary, usePositions } from '../hooks/usePortfolio';
import { formatCurrency, formatPercent, formatQuantity } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = usePortfolioSummary();
  const { data: positions, isLoading: positionsLoading } = usePositions();

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

  const topHoldingsBarData = summary.top_holdings.slice(0, 6).map((item) => ({
    name: item.symbol,
    value: item.value_usd,
    percentage: item.percentage,
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

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Allocation by Type */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Allocation by Type</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetTypePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assetTypePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                />
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

        {/* Allocation by Custodian */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Allocation by Custodian</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={custodianPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
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

      {/* Top Holdings Bar Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">Top Holdings</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topHoldingsBarData} layout="vertical">
              <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={60} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">All Positions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Asset
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">
                  Custodian
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quantity
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Value
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {positions?.positions.slice(0, 15).map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-medium text-gray-900">{position.asset.symbol}</div>
                    <div className="text-sm text-gray-500 sm:hidden">{position.custodian.name}</div>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-gray-500 sm:table-cell">
                    {position.custodian.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                    {formatQuantity(position.quantity)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right text-gray-900 md:table-cell">
                    {formatCurrency(position.current_price)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(position.value_usd)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right text-gray-500 lg:table-cell">
                    {formatPercent((position.value_usd / summary.total_value_usd) * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
