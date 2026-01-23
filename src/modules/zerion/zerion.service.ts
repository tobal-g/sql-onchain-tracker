import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ZerionPosition {
  tokenAddress: string;
  symbol: string;
  quantity: number;
  price: number;
}

@Injectable()
export class ZerionService {
  private readonly logger = new Logger(ZerionService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.zerion.io/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ZERION_API_KEY');
    if (!this.apiKey) {
      this.logger.warn(
        'ZERION_API_KEY not configured - Zerion price fetching will be disabled',
      );
    }
  }

  /**
   * Checks if the service is configured and ready to use.
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Extracts the token address from a Zerion position, matching the position's chain.
   * Zerion's implementations array is sorted alphabetically by chain_id, so we need
   * to find the implementation matching the position's actual chain rather than taking [0].
   *
   * @param position - The raw Zerion position object
   * @returns The token address for the position's chain, or undefined if not found
   */
  private extractTokenAddress(position: any): string | undefined {
    const implementations =
      position?.attributes?.fungible_info?.implementations || [];
    const chainId = position?.relationships?.chain?.data?.id;

    // Find implementation matching the position's chain
    const matchingImpl = chainId
      ? implementations.find((impl: any) => impl.chain_id === chainId)
      : null;

    // Use matching implementation, or fall back to [0] for single-chain tokens
    const address = matchingImpl?.address || implementations[0]?.address;
    return address?.toLowerCase();
  }

  /**
   * Fetches the current price for a token from Zerion API.
   * Uses the /wallets/{address}/positions/ endpoint to find the token price,
   * since some tokens (like SKY) are not indexed in /fungibles but exist in positions.
   *
   * @param tokenAddress - The token contract address (lowercase)
   * @param walletAddress - The wallet address that holds this token
   * @returns The token price in USD, or null if not found/error
   */
  async fetchTokenPrice(
    tokenAddress: string,
    walletAddress: string,
  ): Promise<number | null> {
    if (!this.apiKey) {
      this.logger.warn('Cannot fetch price: ZERION_API_KEY not configured');
      return null;
    }

    const normalizedTokenAddress = tokenAddress?.toLowerCase();
    if (!normalizedTokenAddress || !walletAddress) {
      return null;
    }

    try {
      const url = `${this.baseUrl}/wallets/${walletAddress}/positions/?filter[positions]=no_filter&currency=usd`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Basic ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Zerion API returned ${response.status}`);
      }

      const data = await response.json();
      const positions = data?.data || [];

      // Find the position matching our token address
      for (const position of positions) {
        const fungibleAddress = this.extractTokenAddress(position);

        if (fungibleAddress === normalizedTokenAddress) {
          const price = position?.attributes?.price;

          if (typeof price === 'number' && price > 0) {
            const symbol =
              position?.attributes?.fungible_info?.symbol || 'unknown';
            this.logger.debug(`Zerion price for ${symbol}: $${price}`);
            return price;
          }
        }
      }

      this.logger.warn(
        `Token ${normalizedTokenAddress} not found in wallet positions`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to fetch price from Zerion for ${normalizedTokenAddress}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Fetches all positions for a wallet from Zerion API.
   * Returns positions with token address, symbol, quantity, and price.
   * Used to sync positions for assets with price_api_source='zerion'.
   *
   * @param walletAddress - The wallet address to fetch positions for
   * @returns Array of positions with quantity and price data
   */
  async fetchWalletPositions(walletAddress: string): Promise<ZerionPosition[]> {
    if (!this.apiKey) {
      this.logger.warn('Cannot fetch positions: ZERION_API_KEY not configured');
      return [];
    }

    if (!walletAddress) {
      return [];
    }

    try {
      const url = `${this.baseUrl}/wallets/${walletAddress}/positions/?filter[positions]=no_filter&currency=usd`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Basic ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Zerion API returned ${response.status}`);
      }

      const data = await response.json();
      const rawPositions = data?.data || [];
      const positions: ZerionPosition[] = [];

      for (const position of rawPositions) {
        const tokenAddress = this.extractTokenAddress(position);
        const symbol = position?.attributes?.fungible_info?.symbol;
        const quantity = position?.attributes?.quantity?.float;
        const price = position?.attributes?.price;

        // Only include positions with valid data
        if (
          tokenAddress &&
          symbol &&
          typeof quantity === 'number' &&
          quantity > 0
        ) {
          positions.push({
            tokenAddress,
            symbol,
            quantity,
            price: typeof price === 'number' ? price : 0,
          });
        }
      }

      this.logger.debug(
        `Fetched ${positions.length} positions from Zerion for wallet ${walletAddress.slice(0, 8)}...`,
      );
      return positions;
    } catch (error) {
      this.logger.error(
        `Failed to fetch positions from Zerion for ${walletAddress}: ${error.message}`,
      );
      return [];
    }
  }
}
