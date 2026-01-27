import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PortfolioSummaryService } from '../services/portfolio-summary.service';
import { PnlService } from '../services/pnl.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PortfolioSummaryResponseDto } from '../dto/portfolio-summary.dto';
import { PnlQueryDto, PnlResponseDto } from '../dto/pnl.dto';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioSummaryController {
  constructor(
    private readonly portfolioSummaryService: PortfolioSummaryService,
    private readonly pnlService: PnlService,
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

  @Get('pnl')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get portfolio P&L',
    description:
      'Calculates cost basis, unrealized/realized P&L, and APY for portfolio positions using the Average Cost method',
  })
  @ApiResponse({ status: 200, type: PnlResponseDto })
  async getPnl(@Query() query: PnlQueryDto): Promise<PnlResponseDto> {
    return this.pnlService.getPnl(query);
  }
}
