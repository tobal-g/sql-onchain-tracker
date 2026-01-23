import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import {
  TokenBalancesDto,
  AppBalancesDto,
  NFTBalancesDto,
  PortfolioTotalsDto,
  ClaimablesDto,
  MetaTypeBreakdownsDto,
  PortfolioQueryDto,
} from './dto/portfolio.dto';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':address/tokens')
  @ApiOperation({
    summary: 'Get token balances for an address',
    description:
      'Retrieve all token balances across different networks with real-time USD values',
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    example: '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1',
  })
  @ApiQuery({
    name: 'chainIds',
    required: false,
    type: [Number],
    description:
      'Array of chain IDs to filter by (e.g., [1, 8453] for Ethereum and Base)',
    example: [8453],
  })
  @ApiQuery({
    name: 'first',
    required: false,
    type: Number,
    description: 'Number of tokens to return',
    example: 25,
  })
  @ApiQuery({
    name: 'minBalanceUSD',
    required: false,
    type: Number,
    description: 'Minimum USD balance to include',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Token balances retrieved successfully',
    type: TokenBalancesDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format or parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch portfolio data',
  })
  async getTokenBalances(
    @Param('address') address: string,
    @Query() queryParams: PortfolioQueryDto,
  ): Promise<TokenBalancesDto> {
    return await this.portfolioService.getTokenBalances(address, queryParams);
  }

  @Get(':address/apps')
  @ApiOperation({
    summary: 'Get app balances for an address',
    description:
      'Retrieve positions within onchain applications like lending protocols, DEXes, etc.',
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    example: '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1',
  })
  @ApiQuery({
    name: 'chainIds',
    required: false,
    type: [Number],
    description: 'Array of chain IDs to filter by',
    example: [8453],
  })
  @ApiQuery({
    name: 'first',
    required: false,
    type: Number,
    description: 'Number of app positions to return',
    example: 25,
  })
  @ApiResponse({
    status: 200,
    description: 'App balances retrieved successfully',
    type: AppBalancesDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format or parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch portfolio data',
  })
  async getAppBalances(
    @Param('address') address: string,
    @Query() queryParams: PortfolioQueryDto,
  ): Promise<AppBalancesDto> {
    return await this.portfolioService.getAppBalances(address, queryParams);
  }

  @Get(':address/nfts')
  @ApiOperation({
    summary: 'Get NFT balances for an address',
    description:
      'Get all NFTs held by address with complete metadata, estimated USD valuations, and flexible filters',
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    example: '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1',
  })
  @ApiQuery({
    name: 'chainIds',
    required: false,
    type: [Number],
    description: 'Array of chain IDs to filter by',
    example: [8453],
  })
  @ApiQuery({
    name: 'first',
    required: false,
    type: Number,
    description: 'Number of NFTs to return',
    example: 25,
  })
  @ApiQuery({
    name: 'minBalanceUSD',
    required: false,
    type: Number,
    description: 'Minimum USD value to include',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'NFT balances retrieved successfully',
    type: NFTBalancesDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format or parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch portfolio data',
  })
  async getNFTBalances(
    @Param('address') address: string,
    @Query() queryParams: PortfolioQueryDto,
  ): Promise<NFTBalancesDto> {
    return await this.portfolioService.getNFTBalances(address, queryParams);
  }

  @Get(':address/totals')
  @ApiOperation({
    summary: 'Get portfolio totals for an address',
    description:
      'Get aggregated portfolio values and breakdowns across tokens, apps, and NFTs',
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    example: '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1',
  })
  @ApiQuery({
    name: 'chainIds',
    required: false,
    type: [Number],
    description: 'Array of chain IDs to filter by',
    example: [8453],
  })
  @ApiQuery({
    name: 'first',
    required: false,
    type: Number,
    description: 'Number of network breakdowns to return',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio totals retrieved successfully',
    type: PortfolioTotalsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format or parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch portfolio data',
  })
  async getPortfolioTotals(
    @Param('address') address: string,
    @Query() queryParams: PortfolioQueryDto,
  ): Promise<PortfolioTotalsDto> {
    return await this.portfolioService.getPortfolioTotals(address, queryParams);
  }

  @Get(':address/claimables')
  @ApiOperation({
    summary: 'Get claimable tokens for an address',
    description:
      'Retrieve tokens that can be claimed as rewards, airdrops, etc. from DeFi protocols',
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    example: '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1',
  })
  @ApiQuery({
    name: 'chainIds',
    required: false,
    type: [Number],
    description: 'Array of chain IDs to filter by',
    example: [8453],
  })
  @ApiResponse({
    status: 200,
    description: 'Claimable tokens retrieved successfully',
    type: ClaimablesDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format or parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch portfolio data',
  })
  async getClaimables(
    @Param('address') address: string,
    @Query() queryParams: PortfolioQueryDto,
  ): Promise<ClaimablesDto> {
    return await this.portfolioService.getClaimables(address, queryParams);
  }

  @Get(':address/breakdown')
  @ApiOperation({
    summary: 'Get meta type breakdown for an address',
    description:
      'Get total balances by position type (SUPPLIED, BORROWED, CLAIMABLE, etc.)',
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    example: '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1',
  })
  @ApiQuery({
    name: 'chainIds',
    required: false,
    type: [Number],
    description: 'Array of chain IDs to filter by',
    example: [8453],
  })
  @ApiQuery({
    name: 'first',
    required: false,
    type: Number,
    description: 'Number of meta type breakdowns to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Meta type breakdown retrieved successfully',
    type: MetaTypeBreakdownsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format or parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch portfolio data',
  })
  async getMetaTypeBreakdown(
    @Param('address') address: string,
    @Query() queryParams: PortfolioQueryDto,
  ): Promise<MetaTypeBreakdownsDto> {
    return await this.portfolioService.getMetaTypeBreakdown(
      address,
      queryParams,
    );
  }

  @Get(':address')
  @ApiOperation({
    summary: 'Get complete portfolio overview for an address',
    description:
      'Get a comprehensive overview including tokens, apps, NFTs, and totals',
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    example: '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1',
  })
  @ApiQuery({
    name: 'chainIds',
    required: false,
    type: [Number],
    description: 'Array of chain IDs to filter by',
    example: [8453],
  })
  @ApiQuery({
    name: 'first',
    required: false,
    type: Number,
    description: 'Number of items to return for each category',
    example: 10,
  })
  @ApiQuery({
    name: 'minBalanceUSD',
    required: false,
    type: Number,
    description: 'Minimum USD balance to include',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Complete portfolio overview retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        tokens: { $ref: '#/components/schemas/TokenBalancesDto' },
        apps: { $ref: '#/components/schemas/AppBalancesDto' },
        nfts: { $ref: '#/components/schemas/NFTBalancesDto' },
        totals: { $ref: '#/components/schemas/PortfolioTotalsDto' },
        claimables: { $ref: '#/components/schemas/ClaimablesDto' },
        breakdown: { $ref: '#/components/schemas/MetaTypeBreakdownsDto' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format or parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch portfolio data',
  })
  async getCompletePortfolio(
    @Param('address') address: string,
    @Query() queryParams: PortfolioQueryDto,
  ): Promise<{
    tokens: TokenBalancesDto;
    apps: AppBalancesDto;
    nfts: NFTBalancesDto;
    totals: PortfolioTotalsDto;
    claimables: ClaimablesDto;
    breakdown: MetaTypeBreakdownsDto;
  }> {
    try {
      // Execute all queries in parallel for better performance
      const [tokens, apps, nfts, totals, claimables, breakdown] =
        await Promise.all([
          this.portfolioService.getTokenBalances(address, queryParams),
          this.portfolioService.getAppBalances(address, queryParams),
          this.portfolioService.getNFTBalances(address, queryParams),
          this.portfolioService.getPortfolioTotals(address, queryParams),
          this.portfolioService.getClaimables(address, queryParams),
          this.portfolioService.getMetaTypeBreakdown(address, queryParams),
        ]);

      return {
        tokens,
        apps,
        nfts,
        totals,
        claimables,
        breakdown,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch complete portfolio data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
