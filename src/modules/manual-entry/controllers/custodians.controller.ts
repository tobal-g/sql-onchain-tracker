import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustodiansService } from '../services/custodians.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import {
  CreateCustodianDto,
  CustodiansListResponseDto,
  CreateCustodianResponseDto,
} from '../dto/custodians.dto';

@ApiTags('Custodians')
@Controller('custodians')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
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
