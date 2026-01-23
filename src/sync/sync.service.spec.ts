import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SyncService } from './sync.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { PositionsService } from '../modules/manual-entry/services/positions.service';
import { DATABASE_POOL } from '../database/database.module';

describe('SyncService', () => {
  let service: SyncService;
  let mockPool: any;
  let mockPortfolioService: any;
  let mockConfigService: any;
  let mockPositionsService: any;

  // Sample test data
  const mockCustodians = [
    { id: 1, wallet_address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
    { id: 2, wallet_address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' },
  ];

  const mockAssets = [
    {
      id: 1,
      symbol: 'sUSDS',
      api_identifier: '0xa3931d71877c0e7a3148cb7eb4463524fec27fbd',
    },
    {
      id: 2,
      symbol: 'USDC',
      api_identifier: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    {
      id: 9,
      symbol: 'ETH',
      api_identifier: '0x0000000000000000000000000000000000000000',
    },
  ];

  const mockTokenBalances = {
    totalBalanceUSD: 1000,
    totalCount: 2,
    byToken: [
      {
        symbol: 'ETH',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        balance: 1.5,
        balanceUSD: 3750,
        price: 2500,
        name: 'Ethereum',
        network: { name: 'Ethereum', chainId: 1 },
      },
      {
        symbol: 'USDC',
        tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        balance: 1000,
        balanceUSD: 1000,
        price: 1,
        name: 'USD Coin',
        network: { name: 'Ethereum', chainId: 1 },
      },
    ],
  };

  const mockAppBalances = {
    totalBalanceUSD: 0,
    byApp: [],
  };

  beforeEach(async () => {
    // Reset mocks
    mockPool = {
      query: jest.fn(),
    };

    mockPortfolioService = {
      getTokenBalances: jest.fn(),
      getAppBalances: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          SYNC_RATE_LIMIT_MS: 0, // No delay in tests
        };
        return config[key] ?? defaultValue;
      }),
    };

    mockPositionsService = {
      getZapperAssetIdsForCustodian: jest
        .fn()
        .mockResolvedValue(new Set<number>()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: DATABASE_POOL, useValue: mockPool },
        { provide: PortfolioService, useValue: mockPortfolioService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PositionsService, useValue: mockPositionsService },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  describe('syncAllWallets', () => {
    it('should successfully process wallets and return summary', async () => {
      // Setup mocks
      mockPool.query
        .mockResolvedValueOnce({ rows: mockCustodians }) // getCustodiansWithWallets
        .mockResolvedValueOnce({ rows: mockAssets }) // getAssets
        .mockResolvedValue({ rows: [] }); // upserts

      mockPortfolioService.getTokenBalances.mockResolvedValue(
        mockTokenBalances,
      );
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);

      const result = await service.syncAllWallets();

      expect(result.success).toBe(true);
      expect(result.summary.walletsProcessed).toBe(2);
      expect(result.summary.positionsUpdated).toBeGreaterThan(0);
      expect(result.summary.errors).toHaveLength(0);
    });

    it('should continue processing when one wallet fails', async () => {
      // Setup mocks - first wallet fails, second succeeds
      mockPool.query
        .mockResolvedValueOnce({ rows: mockCustodians })
        .mockResolvedValueOnce({ rows: mockAssets })
        .mockResolvedValue({ rows: [] });

      mockPortfolioService.getTokenBalances
        .mockRejectedValueOnce(new Error('API error for first wallet'))
        .mockResolvedValueOnce(mockTokenBalances);
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);

      const result = await service.syncAllWallets();

      // Should have processed 1 wallet (second one) and have 1 error (first one)
      expect(result.success).toBe(false);
      expect(result.summary.walletsProcessed).toBe(1);
      expect(result.summary.errors).toHaveLength(1);
      expect(result.summary.errors[0]).toContain('API error for first wallet');
    });

    it('should skip unknown tokens with warning', async () => {
      // Setup mocks with an unknown token
      const tokensWithUnknown = {
        ...mockTokenBalances,
        byToken: [
          ...mockTokenBalances.byToken,
          {
            symbol: 'UNKNOWN',
            tokenAddress: '0xunknownaddress',
            balance: 100,
            balanceUSD: 50,
            price: 0.5,
            name: 'Unknown Token',
            network: { name: 'Ethereum', chainId: 1 },
          },
        ],
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockCustodians[0]] })
        .mockResolvedValueOnce({ rows: mockAssets })
        .mockResolvedValue({ rows: [] });

      mockPortfolioService.getTokenBalances.mockResolvedValue(
        tokensWithUnknown,
      );
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);

      const result = await service.syncAllWallets();

      // Should succeed (unknown tokens are warnings, not errors)
      expect(result.success).toBe(true);
      expect(result.summary.errors).toHaveLength(0);
    });

    it('should process BTC wallets with correct chainId', async () => {
      const custodiansWithBtc = [
        { id: 1, wallet_address: 'bc1qz8m0zcswgqwu386ju7a30xaz620rgg9j5wp62g' }, // BTC
        { id: 2, wallet_address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' }, // ETH
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: custodiansWithBtc })
        .mockResolvedValueOnce({ rows: mockAssets })
        .mockResolvedValue({ rows: [] });

      mockPortfolioService.getTokenBalances.mockResolvedValue(
        mockTokenBalances,
      );
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);

      const result = await service.syncAllWallets();

      // Should process both wallets
      expect(result.success).toBe(true);
      expect(result.summary.walletsProcessed).toBe(2);
      expect(result.summary.errors).toHaveLength(0);

      // Zapper getTokenBalances called twice (once per wallet)
      expect(mockPortfolioService.getTokenBalances).toHaveBeenCalledTimes(2);

      // BTC wallet should use chainId 6172014
      expect(mockPortfolioService.getTokenBalances).toHaveBeenCalledWith(
        'bc1qz8m0zcswgqwu386ju7a30xaz620rgg9j5wp62g',
        { first: 100, chainIds: [6172014] },
      );

      // ETH wallet should not specify chainIds
      expect(mockPortfolioService.getTokenBalances).toHaveBeenCalledWith(
        '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        { first: 100, chainIds: undefined },
      );

      // getAppBalances should only be called for ETH wallet (not BTC)
      expect(mockPortfolioService.getAppBalances).toHaveBeenCalledTimes(1);
    });

    it('should return success: false when any errors occurred', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: mockCustodians })
        .mockResolvedValueOnce({ rows: mockAssets })
        .mockResolvedValue({ rows: [] });

      // Make all wallets fail
      mockPortfolioService.getTokenBalances.mockRejectedValue(
        new Error('Zapper API down'),
      );

      const result = await service.syncAllWallets();

      expect(result.success).toBe(false);
      expect(result.summary.errors.length).toBeGreaterThan(0);
    });

    it('should return success: true when no errors (only warnings)', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: mockCustodians })
        .mockResolvedValueOnce({ rows: mockAssets })
        .mockResolvedValue({ rows: [] });

      mockPortfolioService.getTokenBalances.mockResolvedValue(
        mockTokenBalances,
      );
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);

      const result = await service.syncAllWallets();

      expect(result.success).toBe(true);
      expect(result.summary.errors).toHaveLength(0);
    });

    it('should handle empty custodians list', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No custodians
        .mockResolvedValueOnce({ rows: mockAssets });

      const result = await service.syncAllWallets();

      expect(result.success).toBe(true);
      expect(result.summary.walletsProcessed).toBe(0);
      expect(result.summary.positionsUpdated).toBe(0);
      expect(result.summary.errors).toHaveLength(0);

      // Zapper should not be called
      expect(mockPortfolioService.getTokenBalances).not.toHaveBeenCalled();
    });

    it('should handle wallet with zero token balances', async () => {
      const emptyTokenBalances = {
        totalBalanceUSD: 0,
        totalCount: 0,
        byToken: [],
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockCustodians[0]] })
        .mockResolvedValueOnce({ rows: mockAssets })
        .mockResolvedValue({ rows: [] });

      mockPortfolioService.getTokenBalances.mockResolvedValue(
        emptyTokenBalances,
      );
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);

      const result = await service.syncAllWallets();

      expect(result.success).toBe(true);
      expect(result.summary.walletsProcessed).toBe(1);
      expect(result.summary.positionsUpdated).toBe(0);
    });

    it('should handle wallet with only unknown tokens', async () => {
      const unknownOnlyTokens = {
        totalBalanceUSD: 100,
        totalCount: 1,
        byToken: [
          {
            symbol: 'NOTINDB',
            tokenAddress: '0xnotindb',
            balance: 100,
            balanceUSD: 100,
            price: 1,
            name: 'Not In DB',
            network: { name: 'Ethereum', chainId: 1 },
          },
        ],
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockCustodians[0]] })
        .mockResolvedValueOnce({ rows: mockAssets })
        .mockResolvedValue({ rows: [] });

      mockPortfolioService.getTokenBalances.mockResolvedValue(
        unknownOnlyTokens,
      );
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);

      const result = await service.syncAllWallets();

      // Should succeed (unknown tokens are warnings, not errors)
      expect(result.success).toBe(true);
      expect(result.summary.walletsProcessed).toBe(1);
      expect(result.summary.positionsUpdated).toBe(0); // No positions updated since token unknown
    });

    it('should handle database connection error gracefully', async () => {
      mockPool.query.mockRejectedValue(new Error('Connection refused'));

      const result = await service.syncAllWallets();

      expect(result.success).toBe(false);
      expect(result.summary.errors).toContainEqual(
        expect.stringContaining('Connection refused'),
      );
    });
  });

  describe('getCustodiansWithWallets', () => {
    it('should return custodians with wallet addresses', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: mockCustodians });

      const result = await service.getCustodiansWithWallets();

      expect(result).toEqual(mockCustodians);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, wallet_address'),
      );
    });

    it('should throw error on database failure', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await expect(service.getCustodiansWithWallets()).rejects.toThrow(
        'Failed to fetch custodians from database',
      );
    });
  });

  describe('getAssets', () => {
    it('should return all assets', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: mockAssets });

      const result = await service.getAssets();

      expect(result).toEqual(mockAssets);
    });

    it('should throw error on database failure', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await expect(service.getAssets()).rejects.toThrow(
        'Failed to fetch assets from database',
      );
    });
  });

  describe('upsertPosition', () => {
    it('should execute upsert query with correct parameters', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.upsertPosition(1, 2, 100.5);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO positions'),
        [1, 2, 100.5],
      );
    });

    it('should throw error on database failure', async () => {
      mockPool.query.mockRejectedValue(new Error('Constraint violation'));

      await expect(service.upsertPosition(1, 2, 100)).rejects.toThrow(
        'Failed to upsert position',
      );
    });
  });

  describe('upsertPriceHistory', () => {
    it('should execute upsert query with correct parameters', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.upsertPriceHistory(1, 2500.5);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO price_history'),
        [1, 2500.5],
      );
    });

    it('should throw error on database failure', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await expect(service.upsertPriceHistory(1, 100)).rejects.toThrow(
        'Failed to upsert price history',
      );
    });
  });
});
