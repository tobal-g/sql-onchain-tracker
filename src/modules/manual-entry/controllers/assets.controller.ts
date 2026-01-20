import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AssetsService } from '../services/assets.service';
import { ApiKeyGuard } from '../../../guards/api-key.guard';
import {
  ListAssetsQueryDto,
  CreateAssetDto,
  AssetsListResponseDto,
  CreateAssetResponseDto,
} from '../dto/assets.dto';

@ApiTags('Assets')
@Controller('assets')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API key for authentication',
  required: false,
})
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all assets' })
  @ApiResponse({ status: 200, type: AssetsListResponseDto })
  async listAssets(
    @Query() query: ListAssetsQueryDto,
  ): Promise<AssetsListResponseDto> {
    return this.assetsService.listAssets(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create new asset' })
  @ApiResponse({ status: 201, type: CreateAssetResponseDto })
  @ApiResponse({ status: 409, description: 'Asset already exists' })
  async createAsset(@Body() dto: CreateAssetDto): Promise<CreateAssetResponseDto> {
    return this.assetsService.createAsset(dto);
  }
}
