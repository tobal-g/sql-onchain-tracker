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
  ApiHeader,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncResponseDto } from './dto/sync-response.dto';
import { ApiKeyGuard } from '../guards/api-key.guard';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  @Post('portfolio')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Sync all wallet portfolios',
    description:
      'Fetches all wallets from database, queries Zapper API for each, and updates positions and prices in the database. ' +
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
    type: SyncResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid API key',
  })
  @ApiInternalServerErrorResponse({
    description: 'Sync failed due to unexpected error',
  })
  async syncPortfolio(): Promise<SyncResponseDto> {
    this.logger.log('Received sync portfolio request');

    try {
      const result = await this.syncService.syncAllWallets();
      this.logger.log(
        `Sync completed: ${result.summary.walletsProcessed} wallets, ${result.summary.errors.length} errors`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          syncedAt: new Date().toISOString(),
          summary: {
            walletsProcessed: 0,
            positionsUpdated: 0,
            pricesUpdated: 0,
            errors: [`Critical error: ${error.message}`],
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
