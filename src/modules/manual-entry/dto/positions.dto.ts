import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Query DTO for listing positions
export class ListPositionsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by custodian ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  custodian_id?: number;

  @ApiPropertyOptional({ description: 'Filter by asset type ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  asset_type_id?: number;
}

// Create/Update Position DTO
export class UpsertPositionDto {
  @ApiPropertyOptional({
    description: 'Asset ID (required if asset_symbol not provided)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  asset_id?: number;

  @ApiPropertyOptional({ description: 'Asset symbol (alternative to asset_id)' })
  @IsOptional()
  @IsString()
  asset_symbol?: string;

  @ApiPropertyOptional({
    description: 'Custodian ID (required if custodian_name not provided)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  custodian_id?: number;

  @ApiPropertyOptional({
    description: 'Custodian name (alternative to custodian_id)',
  })
  @IsOptional()
  @IsString()
  custodian_name?: string;

  @ApiProperty({ description: 'Quantity of the asset', example: 50.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;
}

// Quick cash update DTO
export class QuickCashUpdateDto {
  @ApiProperty({ description: 'Custodian ID' })
  @Type(() => Number)
  @IsNumber()
  custodian_id: number;

  @ApiProperty({
    description: 'Currency symbol',
    example: 'USD',
    enum: ['USD', 'ARS'],
  })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Amount', example: 5000.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
}

// Response DTOs
export class AssetResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  asset_type: string;
}

export class CustodianResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;
}

export class PositionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: AssetResponseDto })
  asset: AssetResponseDto;

  @ApiProperty({ type: CustodianResponseDto })
  custodian: CustodianResponseDto;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  current_price: number;

  @ApiProperty()
  value_usd: number;

  @ApiProperty()
  updated_at: string;
}

export class PositionsListResponseDto {
  @ApiProperty({ type: [PositionResponseDto] })
  positions: PositionResponseDto[];

  @ApiProperty()
  total_value_usd: number;
}

export class UpsertPositionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  position: {
    id: number;
    asset_id: number;
    custodian_id: number;
    quantity: number;
    updated_at: string;
  };

  @ApiProperty({ enum: ['created', 'updated'] })
  action: 'created' | 'updated';
}

export class DeletePositionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  deleted_id: number;
}
