import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAssetsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by asset type ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  asset_type_id?: number;

  @ApiPropertyOptional({ description: 'Filter by price API source' })
  @IsOptional()
  @IsString()
  price_api_source?: string;
}

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset symbol', example: 'MSFT' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Asset name', example: 'Microsoft Corporation' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Asset type ID' })
  @Type(() => Number)
  @IsNumber()
  asset_type_id: number;

  @ApiPropertyOptional({
    description: 'Price API source',
    example: 'yahoofinance',
  })
  @IsOptional()
  @IsString()
  price_api_source?: string;

  @ApiPropertyOptional({
    description: 'API identifier for price lookup',
    example: 'MSFT',
  })
  @IsOptional()
  @IsString()
  api_identifier?: string;
}

export class AssetTypeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class AssetDetailResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: AssetTypeResponseDto })
  asset_type: AssetTypeResponseDto;

  @ApiPropertyOptional()
  price_api_source?: string;

  @ApiPropertyOptional()
  api_identifier?: string;

  @ApiPropertyOptional()
  current_price?: number;

  @ApiPropertyOptional()
  price_as_of?: string;
}

export class AssetsListResponseDto {
  @ApiProperty({ type: [AssetDetailResponseDto] })
  assets: AssetDetailResponseDto[];
}

export class CreateAssetResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  asset: AssetDetailResponseDto;
}
