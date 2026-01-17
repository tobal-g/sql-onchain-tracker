import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceSyncResultDto {
  @ApiProperty({
    description: 'Asset symbol',
    example: 'VOO',
  })
  symbol: string;

  @ApiProperty({
    description: 'Price in USD',
    example: 452.3,
  })
  priceUsd: number;

  @ApiPropertyOptional({
    description: 'Original price in ARS (only for CEDEARs)',
    example: 18500.0,
  })
  priceArs?: number;

  @ApiProperty({
    description: 'Price source identifier',
    example: 'yahoofinance',
  })
  source: string;
}

export class StockSyncSummaryDto {
  @ApiProperty({
    description: 'Number of assets processed during sync',
    example: 3,
  })
  assetsProcessed: number;

  @ApiProperty({
    description: 'Number of prices successfully updated in database',
    example: 3,
  })
  pricesUpdated: number;

  @ApiProperty({
    description: 'List of errors encountered during sync',
    example: ['INVALID.BA: Yahoo Finance returned no data'],
    type: [String],
  })
  errors: string[];
}

export class StockSyncResponseDto {
  @ApiProperty({
    description: 'Whether sync completed without errors',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ISO timestamp when sync was performed',
    example: '2026-01-14T15:30:00.000Z',
  })
  syncedAt: string;

  @ApiProperty({
    description: 'CCL exchange rate used for CEDEAR conversion (ARS per USD)',
    example: 1523.4,
  })
  cclRate: number;

  @ApiProperty({
    description: 'Summary of sync results',
    type: StockSyncSummaryDto,
  })
  summary: StockSyncSummaryDto;

  @ApiProperty({
    description: 'List of prices fetched and stored',
    type: [PriceSyncResultDto],
  })
  prices: PriceSyncResultDto[];
}
