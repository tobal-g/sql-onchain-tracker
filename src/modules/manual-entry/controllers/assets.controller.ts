import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from '../services/assets.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import {
  ListAssetsQueryDto,
  CreateAssetDto,
  AssetsListResponseDto,
  CreateAssetResponseDto,
} from '../dto/assets.dto';

@ApiTags('Assets')
@Controller('assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
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
