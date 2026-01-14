import { ApiProperty } from '@nestjs/swagger';

export class SyncSummaryDto {
  @ApiProperty({
    description: 'Number of wallets processed during sync',
    example: 5,
  })
  walletsProcessed: number;

  @ApiProperty({
    description: 'Number of positions upserted in database',
    example: 12,
  })
  positionsUpdated: number;

  @ApiProperty({
    description: 'Number of price history records upserted',
    example: 8,
  })
  pricesUpdated: number;

  @ApiProperty({
    description: 'List of errors encountered during sync',
    example: ['Wallet 0x123...abc: Zapper API rate limited (429)'],
    type: [String],
  })
  errors: string[];
}

export class SyncResponseDto {
  @ApiProperty({
    description: 'Whether sync completed without errors',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ISO timestamp when sync was performed',
    example: '2026-01-13T21:30:00.000Z',
  })
  syncedAt: string;

  @ApiProperty({
    description: 'Summary of sync results',
    type: SyncSummaryDto,
  })
  summary: SyncSummaryDto;
}
