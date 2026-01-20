import { ApiProperty } from '@nestjs/swagger';

export class AssetTypeBreakdownDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  value_usd: number;

  @ApiProperty()
  percentage: number;
}

export class CustodianBreakdownDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  value_usd: number;

  @ApiProperty()
  percentage: number;
}

export class TopHoldingDto {
  @ApiProperty()
  symbol: string;

  @ApiProperty()
  value_usd: number;

  @ApiProperty()
  percentage: number;
}

export class PortfolioSummaryResponseDto {
  @ApiProperty()
  total_value_usd: number;

  @ApiProperty({ type: [AssetTypeBreakdownDto] })
  by_asset_type: AssetTypeBreakdownDto[];

  @ApiProperty({ type: [CustodianBreakdownDto] })
  by_custodian: CustodianBreakdownDto[];

  @ApiProperty({ type: [TopHoldingDto] })
  top_holdings: TopHoldingDto[];

  @ApiProperty()
  last_updated: string;
}
