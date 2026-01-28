import PnlView from '../components/positions/PnlView';

export default function Performance() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track profit & loss, cost basis, and investment performance across your portfolio.
        </p>
      </div>

      {/* PnL Content */}
      <PnlView />
    </div>
  );
}
