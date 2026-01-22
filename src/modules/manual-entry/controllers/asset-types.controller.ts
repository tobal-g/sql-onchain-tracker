import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssetTypesService } from '../services/asset-types.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AssetTypesListResponseDto } from '../dto/asset-types.dto';

@ApiTags('Asset Types')
@Controller('asset-types')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AssetTypesController {
  constructor(private readonly assetTypesService: AssetTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all asset types' })
  @ApiResponse({ status: 200, type: AssetTypesListResponseDto })
  async listAssetTypes(): Promise<AssetTypesListResponseDto> {
    return this.assetTypesService.listAssetTypes();
  }
}
