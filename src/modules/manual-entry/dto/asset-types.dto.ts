import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssetTypeDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;
}

export class AssetTypesListResponseDto {
  @ApiProperty({ type: [AssetTypeDetailDto] })
  asset_types: AssetTypeDetailDto[];
}
