import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { YahooFinanceService } from './yahoo-finance.service';
import { DATABASE_POOL } from '../../database/database.module';

// Mock yahoo-finance2 (v3 class-based API)
const mockQuote = jest.fn();
jest.mock('yahoo-finance2', () => ({
  default: class MockYahooFinance {
    quote(...args: unknown[]) {
      return mockQuote(...args);
    }
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('YahooFinanceService', () => {
  let service: YahooFinanceService;
  let mockPool: {
    query: jest.Mock;
  };

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YahooFinanceService,
        {
          provide: DATABASE_POOL,
          useValue: mockPool,
        },
      ],
    }).compile();

    service = module.get<YahooFinanceService>(YahooFinanceService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getCclRate', () => {
    it('should return the CCL venta rate on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          compra: 1522.6,
          venta: 1523.4,
          fechaActualizacion: '2026-01-14T18:58:00.000Z',
        }),
      });

      const rate = await service.getCclRate();
      expect(rate).toBe(1523.4);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://dolarapi.com/v1/dolares/contadoconliqui',
      );
    });

    it('should throw ServiceUnavailableException on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(service.getCclRate()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getCclRate()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException on invalid rate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          compra: 1522.6,
          venta: null,
        }),
      });

      await expect(service.getCclRate()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('getAssetsToSync', () => {
    it('should return assets with yahoofinance price source', async () => {
      const mockAssets = [
        { id: 1, symbol: 'VOO', api_identifier: 'VOO' },
        { id: 2, symbol: 'AAPL-CEDEAR', api_identifier: 'AAPL.BA' },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockAssets });

      const assets = await service.getAssetsToSync();
      expect(assets).toEqual(mockAssets);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("price_api_source = 'yahoofinance'"),
      );
    });

    it('should throw on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(service.getAssetsToSync()).rejects.toThrow(
        'Failed to fetch assets from database',
      );
    });
  });

  describe('fetchPrice', () => {
    it('should return price from Yahoo Finance', async () => {
      mockQuote.mockResolvedValueOnce({
        symbol: 'AAPL',
        regularMarketPrice: 185.5,
      });

      const price = await service.fetchPrice('AAPL');
      expect(price).toBe(185.5);
      expect(mockQuote).toHaveBeenCalledWith('AAPL');
    });

    it('should return null on Yahoo Finance error', async () => {
      mockQuote.mockRejectedValueOnce(
        new Error('Invalid ticker'),
      );

      const price = await service.fetchPrice('INVALID');
      expect(price).toBeNull();
    });

    it('should return null if no price available', async () => {
      mockQuote.mockResolvedValueOnce({
        symbol: 'TEST',
        regularMarketPrice: null,
      });

      const price = await service.fetchPrice('TEST');
      expect(price).toBeNull();
    });
  });

  describe('convertArsToUsd', () => {
    it('should correctly convert ARS to USD', () => {
      const priceUsd = service.convertArsToUsd(18500, 1523.4);
      expect(priceUsd).toBeCloseTo(12.144, 2);
    });
  });

  describe('isCedear (via syncStockPrices)', () => {
    it('should identify CEDEAR tickers by .BA suffix', async () => {
      // Setup mocks
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ venta: 1500 }),
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1, symbol: 'TEST-CEDEAR', api_identifier: 'TEST.BA' }],
      });

      mockQuote.mockResolvedValueOnce({
        symbol: 'TEST.BA',
        regularMarketPrice: 15000,
      });

      mockPool.query.mockResolvedValueOnce({}); // upsert

      const result = await service.syncStockPrices();

      expect(result.prices[0].priceArs).toBe(15000);
      expect(result.prices[0].priceUsd).toBeCloseTo(10, 1);
      expect(result.prices[0].source).toBe('yahoofinance+ccl');
    });
  });

  describe('upsertPriceHistory', () => {
    it('should upsert price to database', async () => {
      mockPool.query.mockResolvedValueOnce({});

      await service.upsertPriceHistory(1, 185.5);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO price_history'),
        [1, 185.5],
      );
    });

    it('should throw on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.upsertPriceHistory(1, 185.5)).rejects.toThrow(
        'Failed to upsert price history',
      );
    });
  });

  describe('syncStockPrices', () => {
    it('should return empty result when no assets to sync', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ venta: 1523.4 }),
      });

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.syncStockPrices();

      expect(result.success).toBe(true);
      expect(result.cclRate).toBe(1523.4);
      expect(result.summary.assetsProcessed).toBe(0);
      expect(result.prices).toEqual([]);
    });

    it('should process USD and ARS assets correctly', async () => {
      // CCL rate fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ venta: 1500 }),
      });

      // Assets query
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { id: 1, symbol: 'VOO', api_identifier: 'VOO' },
          { id: 2, symbol: 'AAPL-CEDEAR', api_identifier: 'AAPL.BA' },
        ],
      });

      // Yahoo Finance quotes
      mockQuote
        .mockResolvedValueOnce({ regularMarketPrice: 450 })
        .mockResolvedValueOnce({ regularMarketPrice: 18000 });

      // Upsert queries
      mockPool.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await service.syncStockPrices();

      expect(result.success).toBe(true);
      expect(result.cclRate).toBe(1500);
      expect(result.summary.assetsProcessed).toBe(2);
      expect(result.summary.pricesUpdated).toBe(2);
      expect(result.prices).toHaveLength(2);

      // VOO - USD
      expect(result.prices[0].symbol).toBe('VOO');
      expect(result.prices[0].priceUsd).toBe(450);
      expect(result.prices[0].priceArs).toBeUndefined();
      expect(result.prices[0].source).toBe('yahoofinance');

      // AAPL-CEDEAR - ARS converted to USD
      expect(result.prices[1].symbol).toBe('AAPL-CEDEAR');
      expect(result.prices[1].priceArs).toBe(18000);
      expect(result.prices[1].priceUsd).toBe(12); // 18000 / 1500
      expect(result.prices[1].source).toBe('yahoofinance+ccl');
    });

    it('should continue processing on individual asset errors', async () => {
      // CCL rate fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ venta: 1500 }),
      });

      // Assets query
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { id: 1, symbol: 'GOOD', api_identifier: 'GOOD' },
          { id: 2, symbol: 'BAD', api_identifier: 'BAD' },
        ],
      });

      // Yahoo Finance quotes - first succeeds, second fails
      mockQuote
        .mockResolvedValueOnce({ regularMarketPrice: 100 })
        .mockResolvedValueOnce({ regularMarketPrice: null });

      // Upsert query for first asset
      mockPool.query.mockResolvedValueOnce({});

      const result = await service.syncStockPrices();

      expect(result.success).toBe(false);
      expect(result.summary.assetsProcessed).toBe(2);
      expect(result.summary.pricesUpdated).toBe(1);
      expect(result.summary.errors).toHaveLength(1);
      expect(result.summary.errors[0]).toContain('BAD');
    });
  });
});
