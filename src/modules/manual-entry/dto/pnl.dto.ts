import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PnlQueryDto {
  @ApiPropertyOptional({ description: 'Filter by asset ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  asset_id?: number;

  @ApiPropertyOptional({
    description: 'Include assets with zero quantity',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  include_zero_positions?: boolean;
}

export class CostBasisDto {
  @ApiProperty({ description: 'Total cost in USD' })
  total_cost_usd: number;

  @ApiProperty({ description: 'Average cost per unit in USD' })
  avg_cost_per_unit: number;

  @ApiProperty({ description: 'Total quantity bought' })
  total_qty_bought: number;
}

export class UnrealizedPnlDto {
  @ApiProperty({ description: 'Unrealized P&L amount in USD' })
  amount_usd: number;

  @ApiPropertyOptional({ description: 'Unrealized P&L percentage' })
  percent: number | null;
}

export class RealizedPnlDto {
  @ApiProperty({ description: 'Realized P&L amount in USD' })
  amount_usd: number;

  @ApiProperty({ description: 'Total quantity sold' })
  total_qty_sold: number;

  @ApiProperty({ description: 'Total proceeds from sales in USD' })
  total_proceeds_usd: number;
}

export class PerformanceDto {
  @ApiPropertyOptional({ description: 'Annualized Percentage Yield' })
  apy: number | null;

  @ApiPropertyOptional({ description: 'Number of days holding the position' })
  holding_days: number | null;

  @ApiPropertyOptional({ description: 'Date of first purchase' })
  first_buy_date: string | null;
}

export class PnlPositionDto {
  @ApiProperty()
  asset_id: number;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  asset_name: string;

  @ApiProperty()
  asset_type: string;

  @ApiProperty()
  current_quantity: number;

  @ApiProperty()
  current_price_usd: number;

  @ApiProperty()
  current_value_usd: number;

  @ApiProperty({ description: 'Whether cost basis information is available' })
  has_cost_basis: boolean;

  @ApiPropertyOptional({ type: CostBasisDto })
  cost_basis: CostBasisDto | null;

  @ApiPropertyOptional({ type: UnrealizedPnlDto })
  unrealized_pnl: UnrealizedPnlDto | null;

  @ApiPropertyOptional({ type: RealizedPnlDto })
  realized_pnl: RealizedPnlDto | null;

  @ApiPropertyOptional({ type: PerformanceDto })
  performance: PerformanceDto | null;
}

export class PnlSummaryDto {
  @ApiProperty()
  total_cost_basis_usd: number;

  @ApiProperty()
  total_current_value_usd: number;

  @ApiProperty()
  total_unrealized_pnl_usd: number;

  @ApiPropertyOptional()
  total_unrealized_pnl_percent: number | null;

  @ApiProperty()
  total_realized_pnl_usd: number;

  @ApiProperty()
  positions_with_cost_basis: number;

  @ApiProperty()
  positions_without_cost_basis: number;
}

export class PnlResponseDto {
  @ApiProperty({ type: PnlSummaryDto })
  summary: PnlSummaryDto;

  @ApiProperty({ type: [PnlPositionDto] })
  positions: PnlPositionDto[];

  @ApiProperty()
  generated_at: string;
}
