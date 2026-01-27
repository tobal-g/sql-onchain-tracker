import { Test, TestingModule } from '@nestjs/testing';
import { PnlService } from './pnl.service';
import { DATABASE_POOL } from '../../../database/database.module';

describe('PnlService', () => {
  let service: PnlService;
  let mockPool: {
    query: jest.Mock;
  };

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PnlService,
        {
          provide: DATABASE_POOL,
          useValue: mockPool,
        },
      ],
    }).compile();

    service = module.get<PnlService>(PnlService);
    jest.clearAllMocks();
  });

  describe('getPnl', () => {
    it('should return empty positions when no data', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getPnl({});

      expect(result.positions).toEqual([]);
      expect(result.summary.total_cost_basis_usd).toBe(0);
      expect(result.summary.total_current_value_usd).toBe(0);
      expect(result.summary.positions_with_cost_basis).toBe(0);
      expect(result.summary.positions_without_cost_basis).toBe(0);
      expect(result.generated_at).toBeDefined();
    });

    it('should calculate cost basis with multiple buys at different prices', async () => {
      // Simulates: bought 10 @ $100, then 10 @ $200 = avg cost $150
      // Current price $180, holding 20 units
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: 1,
            symbol: 'BTC',
            asset_name: 'Bitcoin',
            asset_type: 'Cryptocurrency',
            current_quantity: '20',
            current_price_usd: '180',
            total_qty_bought: '20',
            total_qty_sold: '0',
            total_cost_usd: '3000', // 10*100 + 10*200
            total_proceeds_usd: '0',
            first_buy_date: new Date('2024-01-01'),
            avg_cost_per_unit: '150', // 3000/20
          },
        ],
      });

      const result = await service.getPnl({});

      expect(result.positions).toHaveLength(1);
      const pos = result.positions[0];

      expect(pos.has_cost_basis).toBe(true);
      expect(pos.cost_basis).toBeDefined();
      expect(pos.cost_basis!.total_cost_usd).toBe(3000);
      expect(pos.cost_basis!.avg_cost_per_unit).toBe(150);
      expect(pos.cost_basis!.total_qty_bought).toBe(20);

      expect(pos.current_value_usd).toBe(3600); // 20 * 180
      expect(pos.unrealized_pnl).toBeDefined();
      expect(pos.unrealized_pnl!.amount_usd).toBe(600); // 3600 - 3000
      expect(pos.unrealized_pnl!.percent).toBe(20); // 600/3000 * 100
    });

    it('should calculate realized P&L correctly', async () => {
      // Bought 30 @ $100 = $3000, sold 10 @ $150 = $1500, holding 20
      // Realized P&L = 1500 - (10 * 100) = $500
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: 1,
            symbol: 'ETH',
            asset_name: 'Ethereum',
            asset_type: 'Cryptocurrency',
            current_quantity: '20',
            current_price_usd: '120',
            total_qty_bought: '30',
            total_qty_sold: '10',
            total_cost_usd: '3000',
            total_proceeds_usd: '1500',
            first_buy_date: new Date('2024-01-01'),
            avg_cost_per_unit: '100',
          },
        ],
      });

      const result = await service.getPnl({});
      const pos = result.positions[0];

      expect(pos.realized_pnl).toBeDefined();
      expect(pos.realized_pnl!.amount_usd).toBe(500); // 1500 - (10 * 100)
      expect(pos.realized_pnl!.total_qty_sold).toBe(10);
      expect(pos.realized_pnl!.total_proceeds_usd).toBe(1500);

      expect(result.summary.total_realized_pnl_usd).toBe(500);
    });

    it('should handle positions without transactions (no cost basis)', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: 1,
            symbol: 'AIRDROP',
            asset_name: 'Airdrop Token',
            asset_type: 'Cryptocurrency',
            current_quantity: '100',
            current_price_usd: '5',
            total_qty_bought: null,
            total_qty_sold: null,
            total_cost_usd: null,
            total_proceeds_usd: null,
            first_buy_date: null,
            avg_cost_per_unit: null,
          },
        ],
      });

      const result = await service.getPnl({});
      const pos = result.positions[0];

      expect(pos.has_cost_basis).toBe(false);
      expect(pos.cost_basis).toBeNull();
      expect(pos.unrealized_pnl).toBeNull();
      expect(pos.realized_pnl).toBeNull();
      expect(pos.performance).toBeNull();

      expect(pos.current_value_usd).toBe(500); // 100 * 5
      expect(result.summary.positions_without_cost_basis).toBe(1);
      expect(result.summary.positions_with_cost_basis).toBe(0);
    });

    it('should handle zero cost basis (airdrop with qty but no cost)', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: 1,
            symbol: 'FREE',
            asset_name: 'Free Token',
            asset_type: 'Cryptocurrency',
            current_quantity: '100',
            current_price_usd: '10',
            total_qty_bought: '0',
            total_qty_sold: '0',
            total_cost_usd: '0',
            total_proceeds_usd: '0',
            first_buy_date: null,
            avg_cost_per_unit: null,
          },
        ],
      });

      const result = await service.getPnl({});
      const pos = result.positions[0];

      expect(pos.has_cost_basis).toBe(false);
      expect(pos.unrealized_pnl).toBeNull();
    });

    it('should calculate APY correctly for holding period > 1 year', async () => {
      // Bought 1 year ago at $100, now worth $121 (21% gain)
      // APY should be ~21%
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: 1,
            symbol: 'HODL',
            asset_name: 'Hodl Token',
            asset_type: 'Cryptocurrency',
            current_quantity: '10',
            current_price_usd: '121',
            total_qty_bought: '10',
            total_qty_sold: '0',
            total_cost_usd: '1000',
            total_proceeds_usd: '0',
            first_buy_date: oneYearAgo,
            avg_cost_per_unit: '100',
          },
        ],
      });

      const result = await service.getPnl({});
      const pos = result.positions[0];

      expect(pos.performance).toBeDefined();
      expect(pos.performance!.holding_days).toBeGreaterThanOrEqual(364);
      expect(pos.performance!.holding_days).toBeLessThanOrEqual(366);
      // APY for exactly 1 year: (1210/1000)^(365/365) - 1 = 21%
      expect(pos.performance!.apy).toBeCloseTo(21, 0);
    });

    it('should return null APY for holding period < 1 day', async () => {
      const today = new Date();

      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: 1,
            symbol: 'NEW',
            asset_name: 'New Token',
            asset_type: 'Cryptocurrency',
            current_quantity: '10',
            current_price_usd: '100',
            total_qty_bought: '10',
            total_qty_sold: '0',
            total_cost_usd: '1000',
            total_proceeds_usd: '0',
            first_buy_date: today,
            avg_cost_per_unit: '100',
          },
        ],
      });

      const result = await service.getPnl({});
      const pos = result.positions[0];

      expect(pos.performance).toBeDefined();
      expect(pos.performance!.holding_days).toBe(0);
      expect(pos.performance!.apy).toBeNull();
    });

    it('should filter by asset_id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.getPnl({ asset_id: 10 });

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [
        10,
        false,
      ]);
    });

    it('should include zero positions when requested', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.getPnl({ include_zero_positions: true });

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [
        null,
        true,
      ]);
    });

    it('should calculate correct summary totals', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: 1,
            symbol: 'BTC',
            asset_name: 'Bitcoin',
            asset_type: 'Cryptocurrency',
            current_quantity: '10',
            current_price_usd: '50000',
            total_qty_bought: '10',
            total_qty_sold: '0',
            total_cost_usd: '400000',
            total_proceeds_usd: '0',
            first_buy_date: new Date('2024-01-01'),
            avg_cost_per_unit: '40000',
          },
          {
            asset_id: 2,
            symbol: 'ETH',
            asset_name: 'Ethereum',
            asset_type: 'Cryptocurrency',
            current_quantity: '100',
            current_price_usd: '3000',
            total_qty_bought: '100',
            total_qty_sold: '50',
            total_cost_usd: '200000',
            total_proceeds_usd: '125000',
            first_buy_date: new Date('2024-01-01'),
            avg_cost_per_unit: '2000',
          },
          {
            asset_id: 3,
            symbol: 'AIRDROP',
            asset_name: 'Airdrop',
            asset_type: 'Cryptocurrency',
            current_quantity: '1000',
            current_price_usd: '1',
            total_qty_bought: null,
            total_qty_sold: null,
            total_cost_usd: null,
            total_proceeds_usd: null,
            first_buy_date: null,
            avg_cost_per_unit: null,
          },
        ],
      });

      const result = await service.getPnl({});

      // BTC: current = 500k, cost = 400k, unrealized = 100k
      // ETH: current = 300k, cost = 200k, unrealized = 100k, realized = 125k - 50*2000 = 25k
      // AIRDROP: current = 1k, no cost basis
      expect(result.summary.total_current_value_usd).toBe(801000); // 500k + 300k + 1k
      expect(result.summary.total_cost_basis_usd).toBe(600000); // 400k + 200k
      expect(result.summary.total_unrealized_pnl_usd).toBe(200000); // 100k + 100k
      expect(result.summary.total_unrealized_pnl_percent).toBeCloseTo(33.33, 1);
      expect(result.summary.total_realized_pnl_usd).toBe(25000);
      expect(result.summary.positions_with_cost_basis).toBe(2);
      expect(result.summary.positions_without_cost_basis).toBe(1);
    });

    it('should handle fully sold positions when include_zero_positions is true', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: 1,
            symbol: 'SOLD',
            asset_name: 'Sold Token',
            asset_type: 'Cryptocurrency',
            current_quantity: '0',
            current_price_usd: '100',
            total_qty_bought: '10',
            total_qty_sold: '10',
            total_cost_usd: '500',
            total_proceeds_usd: '1000',
            first_buy_date: new Date('2024-01-01'),
            avg_cost_per_unit: '50',
          },
        ],
      });

      const result = await service.getPnl({ include_zero_positions: true });
      const pos = result.positions[0];

      expect(pos.current_quantity).toBe(0);
      expect(pos.current_value_usd).toBe(0);
      expect(pos.unrealized_pnl!.amount_usd).toBe(0); // 0 - 0*50
      expect(pos.realized_pnl!.amount_usd).toBe(500); // 1000 - 10*50
    });

    it('should handle negative unrealized P&L (loss)', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: 1,
            symbol: 'DOWN',
            asset_name: 'Down Token',
            asset_type: 'Cryptocurrency',
            current_quantity: '10',
            current_price_usd: '50',
            total_qty_bought: '10',
            total_qty_sold: '0',
            total_cost_usd: '1000',
            total_proceeds_usd: '0',
            first_buy_date: new Date('2024-01-01'),
            avg_cost_per_unit: '100',
          },
        ],
      });

      const result = await service.getPnl({});
      const pos = result.positions[0];

      expect(pos.current_value_usd).toBe(500);
      expect(pos.unrealized_pnl!.amount_usd).toBe(-500); // 500 - 1000
      expect(pos.unrealized_pnl!.percent).toBe(-50); // -500/1000 * 100
    });
  });
});
