import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { PortfolioService } from '../portfolio/portfolio.service';
import { PositionsService } from '../modules/manual-entry/services/positions.service';
import { SyncResponseDto } from './dto/sync-response.dto';
import {
  TokenBalanceDto,
  AppBalanceDto,
  AppTokenPositionBalanceDto,
  ContractPositionBalanceDto,
} from '../portfolio/dto/portfolio.dto';

// Types for database rows
interface Custodian {
  id: number;
  wallet_address: string;
}

interface Asset {
  id: number;
  symbol: string;
  api_identifier: string | null;
}

// Summary tracking during sync
interface SyncSummary {
  walletsProcessed: number;
  positionsUpdated: number;
  positionsZeroed: number;
  pricesUpdated: number;
  errors: string[];
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly rateLimitDelay: number;

  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly portfolioService: PortfolioService,
    private readonly configService: ConfigService,
    private readonly positionsService: PositionsService,
  ) {
    this.rateLimitDelay = this.configService.get<number>('SYNC_RATE_LIMIT_MS', 1000);
  }

  /**
   * Builds a lookup map for assets by lowercase api_identifier and symbol.
   */
  private buildAssetLookup(assets: Asset[]): Map<string, Asset> {
    const lookup = new Map<string, Asset>();
    for (const asset of assets) {
      if (asset.api_identifier) {
        lookup.set(asset.api_identifier.toLowerCase(), asset);
      }
      // Also add by lowercase symbol for special cases like BTC
      lookup.set(asset.symbol.toLowerCase(), asset);
    }
    return lookup;
  }

  /**
   * Determines if a wallet is BTC (bc1...) or EVM (0x...).
   */
  private isBtcWallet(address: string): boolean {
    return address.startsWith('bc1');
  }

  /**
   * Truncates a wallet address for logging: 0x1234...abcd
   */
  private truncateAddress(address: string): string {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Delays execution for rate limiting.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetches all custodians that have a wallet address set.
   * These are the wallets we need to sync from Zapper.
   */
  async getCustodiansWithWallets(): Promise<Custodian[]> {
    const query = `
      SELECT id, wallet_address
      FROM custodians
      WHERE wallet_address IS NOT NULL
    `;

    try {
      const result = await this.pool.query(query);
      this.logger.log(`Found ${result.rows.length} custodians with wallets`);
      return result.rows;
    } catch (error) {
      this.logger.error(
        `Failed to fetch custodians: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to fetch custodians from database: ${error.message}`);
    }
  }

  /**
   * Fetches all assets from the database.
   * Used to match Zapper tokens to our asset records.
   */
  async getAssets(): Promise<Asset[]> {
    const query = `SELECT id, symbol, api_identifier FROM assets`;

    try {
      const result = await this.pool.query(query);
      this.logger.log(`Found ${result.rows.length} assets in database`);
      return result.rows;
    } catch (error) {
      this.logger.error(`Failed to fetch assets: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch assets from database: ${error.message}`);
    }
  }

  /**
   * Upserts a position record (current holding for an asset in a custodian).
   * Uses ON CONFLICT to update existing records.
   */
  async upsertPosition(
    assetId: number,
    custodianId: number,
    quantity: number,
  ): Promise<void> {
    const query = `
      INSERT INTO positions (asset_id, custodian_id, quantity, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (asset_id, custodian_id)
      DO UPDATE SET quantity = $3, updated_at = NOW()
    `;

    try {
      await this.pool.query(query, [assetId, custodianId, quantity]);
    } catch (error) {
      this.logger.error(
        `Failed to upsert position (asset: ${assetId}, custodian: ${custodianId}): ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to upsert position for asset ${assetId}: ${error.message}`,
      );
    }
  }

  /**
   * Upserts a price history record for today.
   * Uses ON CONFLICT to update if we already have today's price.
   */
  async upsertPriceHistory(assetId: number, priceUsd: number): Promise<void> {
    const query = `
      INSERT INTO price_history (asset_id, price_usd, price_date, source)
      VALUES ($1, $2, CURRENT_DATE, 'zapper')
      ON CONFLICT (asset_id, price_date)
      DO UPDATE SET price_usd = $2, source = 'zapper'
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
   * Processes a single token: matches to asset, upserts position and price.
   * Returns asset ID if processed, null if skipped.
   */
  private async processToken(
    tokenAddress: string,
    symbol: string,
    balance: number,
    price: number | undefined,
    custodianId: number,
    assetLookup: Map<string, Asset>,
    summary: SyncSummary,
    walletAddress: string,
  ): Promise<number | null> {
    const normalizedAddress = tokenAddress?.toLowerCase();
    if (!normalizedAddress) return null;

    // Native tokens (ETH, BTC) share the zero address - match by symbol instead
    const isNativeToken = normalizedAddress === '0x0000000000000000000000000000000000000000';
    let asset = isNativeToken
      ? assetLookup.get(symbol.toLowerCase())
      : assetLookup.get(normalizedAddress);

    // Fallback to symbol if address not found
    if (!asset) {
      asset = assetLookup.get(symbol.toLowerCase());
    }

    if (!asset) {
      this.logger.warn(
        `Unknown token: ${symbol} (${normalizedAddress}) - skipping`,
      );
      return null;
    }

    try {
      // Upsert position
      await this.upsertPosition(asset.id, custodianId, balance);
      summary.positionsUpdated++;

      // Upsert price if valid
      if (price !== undefined && price > 0) {
        await this.upsertPriceHistory(asset.id, price);
        summary.pricesUpdated++;
      }

      return asset.id;
    } catch (error) {
      const errorMsg = `Wallet ${this.truncateAddress(walletAddress)}: Failed to upsert ${symbol}: ${error.message}`;
      this.logger.error(errorMsg);
      summary.errors.push(errorMsg);
      return null;
    }
  }

  /**
   * Processes token balances from Zapper response.
   * Returns Set of asset IDs that were found and processed.
   */
  private async processTokenBalances(
    tokens: TokenBalanceDto[],
    custodianId: number,
    assetLookup: Map<string, Asset>,
    summary: SyncSummary,
    walletAddress: string,
  ): Promise<Set<number>> {
    const foundAssetIds = new Set<number>();
    for (const token of tokens) {
      const assetId = await this.processToken(
        token.tokenAddress,
        token.symbol,
        token.balance,
        token.price,
        custodianId,
        assetLookup,
        summary,
        walletAddress,
      );
      if (assetId !== null) {
        foundAssetIds.add(assetId);
      }
    }
    return foundAssetIds;
  }

  /**
   * Processes DeFi app balances from Zapper response.
   * Returns Set of asset IDs that were found and processed.
   */
  private async processAppBalances(
    appBalances: AppBalanceDto[],
    custodianId: number,
    assetLookup: Map<string, Asset>,
    summary: SyncSummary,
    walletAddress: string,
  ): Promise<Set<number>> {
    const foundAssetIds = new Set<number>();
    for (const appBalance of appBalances) {
      for (const position of appBalance.positionBalances) {
        if (position.type === 'app-token') {
          // AppTokenPositionBalanceDto
          const appToken = position as AppTokenPositionBalanceDto;
          const assetId = await this.processToken(
            appToken.address,
            appToken.symbol,
            appToken.balance,
            appToken.price,
            custodianId,
            assetLookup,
            summary,
            walletAddress,
          );
          if (assetId !== null) {
            foundAssetIds.add(assetId);
          }
        } else if (position.type === 'contract-position') {
          // ContractPositionBalanceDto - has nested tokens
          const contractPos = position as ContractPositionBalanceDto;
          if (contractPos.tokens) {
            for (const tokenWithMeta of contractPos.tokens) {
              const token = tokenWithMeta.token;
              const assetId = await this.processToken(
                token.address,
                token.symbol,
                token.balance,
                token.price,
                custodianId,
                assetLookup,
                summary,
                walletAddress,
              );
              if (assetId !== null) {
                foundAssetIds.add(assetId);
              }
            }
          }
        }
      }
    }
    return foundAssetIds;
  }

  /**
   * Syncs a single wallet: fetches from Zapper and updates database.
   */
  private async syncWallet(
    custodian: Custodian,
    assetLookup: Map<string, Asset>,
    summary: SyncSummary,
  ): Promise<void> {
    const walletAddress = custodian.wallet_address;
    const truncated = this.truncateAddress(walletAddress);
    const isBtc = this.isBtcWallet(walletAddress);

    this.logger.log(`Processing ${isBtc ? 'BTC' : 'EVM'} wallet: ${truncated}`);

    try {
      // Get existing Zapper position asset IDs BEFORE processing
      const existingAssetIds = await this.positionsService.getZapperAssetIdsForCustodian(custodian.id);

      // Fetch token balances (use BTC chainId for Bitcoin wallets)
      const tokenBalances = await this.portfolioService.getTokenBalances(
        walletAddress,
        { first: 100, chainIds: isBtc ? [6172014] : undefined },
      );

      const tokenFoundIds = await this.processTokenBalances(
        tokenBalances.byToken,
        custodian.id,
        assetLookup,
        summary,
        walletAddress,
      );

      // Fetch DeFi app balances (skip for BTC - no DeFi on Bitcoin)
      let appFoundIds = new Set<number>();
      if (!isBtc) {
        const appBalances = await this.portfolioService.getAppBalances(
          walletAddress,
          { first: 50 },
        );

        appFoundIds = await this.processAppBalances(
          appBalances.byApp,
          custodian.id,
          assetLookup,
          summary,
          walletAddress,
        );
      }

      // Combine all found asset IDs
      const allFoundIds = new Set([...tokenFoundIds, ...appFoundIds]);

      // Zero positions not found in Zapper response
      for (const assetId of existingAssetIds) {
        if (!allFoundIds.has(assetId)) {
          await this.upsertPosition(assetId, custodian.id, 0);
          summary.positionsZeroed++;
          this.logger.log(`Zeroed position: asset_id=${assetId}, custodian_id=${custodian.id}`);
        }
      }

      summary.walletsProcessed++;
      this.logger.log(`Completed wallet: ${truncated}`);
    } catch (error) {
      const errorMsg = `Wallet ${truncated}: ${error.message}`;
      this.logger.error(errorMsg);
      summary.errors.push(errorMsg);
    }
  }

  /**
   * Main sync method - coordinates fetching data and updating database.
   */
  async syncAllWallets(): Promise<SyncResponseDto> {
    const startTime = new Date();
    this.logger.log('Starting portfolio sync');

    const summary: SyncSummary = {
      walletsProcessed: 0,
      positionsUpdated: 0,
      positionsZeroed: 0,
      pricesUpdated: 0,
      errors: [],
    };

    try {
      // Step 1: Load custodians and assets
      const custodians = await this.getCustodiansWithWallets();
      const assets = await this.getAssets();
      const assetLookup = this.buildAssetLookup(assets);

      this.logger.log(
        `Starting sync for ${custodians.length} wallets with ${assets.length} tracked assets`,
      );

      // Step 2: Process each wallet
      for (let i = 0; i < custodians.length; i++) {
        const custodian = custodians[i];

        await this.syncWallet(custodian, assetLookup, summary);

        // Rate limiting: delay between wallets (except for the last one)
        if (i < custodians.length - 1 && this.rateLimitDelay > 0) {
          await this.delay(this.rateLimitDelay);
        }
      }

      const duration = (Date.now() - startTime.getTime()) / 1000;
      this.logger.log(
        `Sync completed in ${duration.toFixed(1)}s: ${summary.walletsProcessed} wallets, ` +
          `${summary.positionsUpdated} positions, ${summary.pricesUpdated} prices, ` +
          `${summary.errors.length} errors`,
      );

      return {
        success: summary.errors.length === 0,
        syncedAt: startTime.toISOString(),
        summary,
      };
    } catch (error) {
      this.logger.error(`Sync failed during setup: ${error.message}`);
      return {
        success: false,
        syncedAt: startTime.toISOString(),
        summary: {
          ...summary,
          errors: [...summary.errors, `Critical error: ${error.message}`],
        },
      };
    }
  }
}
