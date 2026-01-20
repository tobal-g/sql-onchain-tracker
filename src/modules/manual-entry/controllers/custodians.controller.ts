import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { CustodiansService } from '../services/custodians.service';
import { ApiKeyGuard } from '../../../guards/api-key.guard';
import {
  CreateCustodianDto,
  CustodiansListResponseDto,
  CreateCustodianResponseDto,
} from '../dto/custodians.dto';

@ApiTags('Custodians')
@Controller('custodians')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API key for authentication',
  required: false,
})
export class CustodiansController {
  constructor(private readonly custodiansService: CustodiansService) {}

  @Get()
  @ApiOperation({ summary: 'List all custodians' })
  @ApiResponse({ status: 200, type: CustodiansListResponseDto })
  async listCustodians(): Promise<CustodiansListResponseDto> {
    return this.custodiansService.listCustodians();
  }

  @Post()
  @ApiOperation({ summary: 'Create new custodian' })
  @ApiResponse({ status: 201, type: CreateCustodianResponseDto })
  async createCustodian(
    @Body() dto: CreateCustodianDto,
  ): Promise<CreateCustodianResponseDto> {
    return this.custodiansService.createCustodian(dto);
  }
}
