import {
  Controller,
  Post,
  Logger,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiInternalServerErrorResponse,
  ApiServiceUnavailableResponse,
  ApiHeader,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { YahooFinanceService } from './yahoo-finance.service';
import { StockSyncResponseDto } from './dto/stock-sync-response.dto';
import { ApiKeyGuard } from '../../guards/api-key.guard';

@ApiTags('Sync')
@Controller('sync/prices')
export class YahooFinanceController {
  private readonly logger = new Logger(YahooFinanceController.name);

  constructor(private readonly yahooFinanceService: YahooFinanceService) {}

  @Post('stocks')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Sync stock/ETF/CEDEAR prices from Yahoo Finance',
    description:
      'Fetches prices for all assets with price_api_source = "yahoofinance" and stores them in the price_history table. ' +
      'CEDEAR prices (tickers ending in .BA) are converted from ARS to USD using the CCL exchange rate from DolarAPI. ' +
      'Requires x-api-key header if SYNC_API_KEY is configured.',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication (required if SYNC_API_KEY env var is set)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Sync completed (check success field for actual result)',
    type: StockSyncResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid API key',
  })
  @ApiServiceUnavailableResponse({
    description: 'DolarAPI is unavailable - cannot fetch CCL rate',
  })
  @ApiInternalServerErrorResponse({
    description: 'Sync failed due to unexpected error',
  })
  async syncStockPrices(): Promise<StockSyncResponseDto> {
    this.logger.log('Received sync stock prices request');

    try {
      const result = await this.yahooFinanceService.syncStockPrices();
      this.logger.log(
        `Stock sync completed: ${result.summary.assetsProcessed} assets, ${result.summary.errors.length} errors`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Stock sync failed: ${error.message}`, error.stack);

      // Re-throw ServiceUnavailable errors (from CCL fetch)
      if (error.status === HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          syncedAt: new Date().toISOString(),
          cclRate: 0,
          summary: {
            assetsProcessed: 0,
            pricesUpdated: 0,
            errors: [`Critical error: ${error.message}`],
          },
          prices: [],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
