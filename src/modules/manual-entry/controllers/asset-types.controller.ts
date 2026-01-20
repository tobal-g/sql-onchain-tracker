import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AssetTypesService } from '../services/asset-types.service';
import { ApiKeyGuard } from '../../../guards/api-key.guard';
import { AssetTypesListResponseDto } from '../dto/asset-types.dto';

@ApiTags('Asset Types')
@Controller('asset-types')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API key for authentication',
  required: false,
})
export class AssetTypesController {
  constructor(private readonly assetTypesService: AssetTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all asset types' })
  @ApiResponse({ status: 200, type: AssetTypesListResponseDto })
  async listAssetTypes(): Promise<AssetTypesListResponseDto> {
    return this.assetTypesService.listAssetTypes();
  }
}
