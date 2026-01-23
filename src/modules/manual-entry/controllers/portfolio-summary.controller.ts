import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PortfolioSummaryService } from '../services/portfolio-summary.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PortfolioSummaryResponseDto } from '../dto/portfolio-summary.dto';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioSummaryController {
  constructor(
    private readonly portfolioSummaryService: PortfolioSummaryService,
  ) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get portfolio summary',
    description: 'Aggregated portfolio overview with breakdowns',
  })
  @ApiResponse({ status: 200, type: PortfolioSummaryResponseDto })
  async getPortfolioSummary(): Promise<PortfolioSummaryResponseDto> {
    return this.portfolioSummaryService.getPortfolioSummary();
  }
}
