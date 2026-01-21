import { Injectable, Inject, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.module';
import {
  StockSyncResponseDto,
  PriceSyncResultDto,
} from './dto/stock-sync-response.dto';
import YahooFinance from 'yahoo-finance2';

// Types for database rows
interface Asset {
  id: number;
  symbol: string;
  api_identifier: string | null;
}

// Summary tracking during sync
interface SyncSummary {
  assetsProcessed: number;
  pricesUpdated: number;
  errors: string[];
}

@Injectable()
export class YahooFinanceService {
  private readonly logger = new Logger(YahooFinanceService.name);
  private readonly rateLimitDelay = 500; // 500ms between Yahoo Finance requests
  private readonly yahooFinance = new YahooFinance();

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Delays execution for rate limiting.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Determines if a ticker is a CEDEAR (traded in ARS on Buenos Aires exchange).
   */
  private isCedear(ticker: string): boolean {
    return ticker.toUpperCase().endsWith('.BA');
  }

  /**
   * Fetches the CCL (Contado con Liquidación) exchange rate from DolarAPI.
   * Returns the "venta" (sell) rate for ARS → USD conversion.
   */
  async getCclRate(): Promise<number> {
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares/contadoconliqui');
      
      if (!response.ok) {
        throw new Error(`DolarAPI returned ${response.status}`);
      }

      const data = await response.json();
      const ventaRate = data.venta;

      if (typeof ventaRate !== 'number' || ventaRate <= 0) {
        throw new Error('Invalid CCL rate received from DolarAPI');
      }

      this.logger.log(`Fetched CCL rate: ${ventaRate} ARS/USD`);
      return ventaRate;
    } catch (error) {
      this.logger.error(`Failed to fetch CCL rate: ${error.message}`, error.stack);
      throw new ServiceUnavailableException(
        `Cannot fetch CCL rate from DolarAPI: ${error.message}`,
      );
    }
  }

  /**
   * Fetches all assets that should be synced via Yahoo Finance.
   */
  async getAssetsToSync(): Promise<Asset[]> {
    const query = `
      SELECT id, symbol, api_identifier
      FROM assets
      WHERE price_api_source = 'yahoofinance'
    `;

    try {
      const result = await this.pool.query(query);
      this.logger.log(`Found ${result.rows.length} assets to sync via Yahoo Finance`);
      return result.rows;
    } catch (error) {
      this.logger.error(`Failed to fetch assets: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch assets from database: ${error.message}`);
    }
  }

  /**
   * Fetches a single price from Yahoo Finance.
   * Returns null if the price cannot be fetched.
   */
  async fetchPrice(ticker: string): Promise<number | null> {
    try {
      const quote = await this.yahooFinance.quote(ticker) as { regularMarketPrice?: number };
      const price = quote?.regularMarketPrice;

      if (typeof price !== 'number' || price <= 0) {
        this.logger.warn(`No valid price for ${ticker}`);
        return null;
      }

      return price;
    } catch (error) {
      this.logger.warn(`Yahoo Finance error for ${ticker}: ${error.message}`);
      return null;
    }
  }

  /**
   * Upserts a price history record for today.
   * Uses ON CONFLICT to update if we already have today's price.
   */
  async upsertPriceHistory(assetId: number, priceUsd: number): Promise<void> {
    const query = `
      INSERT INTO price_history (asset_id, price_usd, price_date, source)
      VALUES ($1, $2, CURRENT_DATE, 'yahoofinance')
      ON CONFLICT (asset_id, price_date)
      DO UPDATE SET price_usd = EXCLUDED.price_usd, source = 'yahoofinance'
    `;

    try {
      await this.pool.query(query, [assetId, priceUsd]);
    } catch (error) {
      this.logger.error(
        `Failed to upsert price history (asset: ${assetId}): ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to upsert price history for asset ${assetId}: ${error.message}`,
      );
    }
  }

  /**
   * Converts ARS price to USD using CCL rate.
   */
  convertArsToUsd(priceArs: number, cclRate: number): number {
    return priceArs / cclRate;
  }

  /**
   * Main sync method - fetches prices from Yahoo Finance and stores in database.
   */
  async syncStockPrices(): Promise<StockSyncResponseDto> {
    const startTime = new Date();
    this.logger.log('Starting Yahoo Finance price sync');

    const summary: SyncSummary = {
      assetsProcessed: 0,
      pricesUpdated: 0,
      errors: [],
    };
    const prices: PriceSyncResultDto[] = [];

    // Step 1: Get CCL rate (abort if fails)
    const cclRate = await this.getCclRate();

    // Step 2: Get assets to sync
    const assets = await this.getAssetsToSync();

    if (assets.length === 0) {
      this.logger.log('No assets found with price_api_source = yahoofinance');
      return {
        success: true,
        syncedAt: startTime.toISOString(),
        cclRate,
        summary,
        prices,
      };
    }

    // Step 3: Process each asset
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const ticker = asset.api_identifier || asset.symbol;
      summary.assetsProcessed++;

      this.logger.log(`Processing ${asset.symbol} (ticker: ${ticker})`);

      try {
        // Fetch price from Yahoo Finance
        const rawPrice = await this.fetchPrice(ticker);

        if (rawPrice === null) {
          const errorMsg = `${asset.symbol}: Yahoo Finance returned no data for ${ticker}`;
          this.logger.warn(errorMsg);
          summary.errors.push(errorMsg);
          continue;
        }

        let priceUsd: number;
        let priceArs: number | undefined;
        let source: string;

        // Handle CEDEAR conversion
        if (this.isCedear(ticker)) {
          priceArs = rawPrice;
          priceUsd = this.convertArsToUsd(rawPrice, cclRate);
          source = 'yahoofinance+ccl';
          this.logger.log(
            `${asset.symbol}: ${priceArs.toFixed(2)} ARS → ${priceUsd.toFixed(4)} USD`,
          );
        } else {
          priceUsd = rawPrice;
          source = 'yahoofinance';
          this.logger.log(`${asset.symbol}: ${priceUsd.toFixed(2)} USD`);
        }

        // Save to database
        await this.upsertPriceHistory(asset.id, priceUsd);
        summary.pricesUpdated++;

        // Track result
        const priceResult: PriceSyncResultDto = {
          symbol: asset.symbol,
          priceUsd,
          source,
        };
        if (priceArs !== undefined) {
          priceResult.priceArs = priceArs;
        }
        prices.push(priceResult);
      } catch (error) {
        const errorMsg = `${asset.symbol}: ${error.message}`;
        this.logger.error(errorMsg);
        summary.errors.push(errorMsg);
      }

      // Rate limiting: delay between requests (except for the last one)
      if (i < assets.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }

    const duration = (Date.now() - startTime.getTime()) / 1000;
    this.logger.log(
      `Yahoo Finance sync completed in ${duration.toFixed(1)}s: ${summary.assetsProcessed} assets, ` +
        `${summary.pricesUpdated} prices updated, ${summary.errors.length} errors`,
    );

    return {
      success: summary.errors.length === 0,
      syncedAt: startTime.toISOString(),
      cclRate,
      summary,
      prices,
    };
  }
}
