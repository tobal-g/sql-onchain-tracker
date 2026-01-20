import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PortfolioSummaryService } from '../services/portfolio-summary.service';
import { ApiKeyGuard } from '../../../guards/api-key.guard';
import { PortfolioSummaryResponseDto } from '../dto/portfolio-summary.dto';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioSummaryController {
  constructor(
    private readonly portfolioSummaryService: PortfolioSummaryService,
  ) {}

  @Get('summary')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Get portfolio summary',
    description: 'Aggregated portfolio overview with breakdowns',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: false,
  })
  @ApiResponse({ status: 200, type: PortfolioSummaryResponseDto })
  async getPortfolioSummary(): Promise<PortfolioSummaryResponseDto> {
    return this.portfolioSummaryService.getPortfolioSummary();
  }
}
