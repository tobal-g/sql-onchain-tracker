import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios, { AxiosResponse } from 'axios';
import {
  TokenBalancesDto,
  AppBalancesDto,
  NFTBalancesDto,
  PortfolioTotalsDto,
  ClaimablesDto,
  MetaTypeBreakdownsDto,
  PortfolioQueryDto,
} from './dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  private readonly zapperGraphQLUrl: string;
  private readonly zapperApiKey: string | undefined;
  private readonly cacheTtl: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.zapperGraphQLUrl = this.configService.get<string>('ZAPPER_API_URL', 'https://public.zapper.xyz/graphql');
    this.zapperApiKey = this.configService.get<string>('ZAPPER_API_KEY');
    this.cacheTtl = this.configService.get<number>('CACHE_TTL', 90) * 1000; // Convert to milliseconds

    if (!this.zapperApiKey) {
      this.logger.warn('ZAPPER_API_KEY not configured. Using public endpoint without authentication.');
    }
  }

  // Token Balances GraphQL Query - Based on working Zapper sandbox example
  private readonly TOKEN_BALANCES_QUERY = `
    query TokenBalances($addresses: [Address!]!, $first: Int, $chainIds: [Int!]) {
      portfolioV2(addresses: $addresses, chainIds: $chainIds) {
        tokenBalances {
          totalBalanceUSD
          byToken(first: $first) {
            totalCount
            edges {
              node {
                symbol
                tokenAddress
                balance
                balanceUSD
                price
                imgUrlV2
                name
                network {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  // App Balances GraphQL Query
  private readonly APP_BALANCES_QUERY = `
    query AppBalances($addresses: [Address!]!, $first: Int, $chainIds: [Int!]) {
      portfolioV2(addresses: $addresses, chainIds: $chainIds) {
        appBalances {
          totalBalanceUSD
          byApp(first: $first) {
            totalCount
            edges {
              node {
                balanceUSD
                app {
                  displayName
                  imgUrl
                  description
                  slug
                  url
                  category {
                    name
                  }
                }
                network {
                  name
                  slug
                  chainId
                  evmCompatible
                }
                positionBalances(first: 10) {
                  edges {
                    node {
                      ... on AppTokenPositionBalance {
                        type
                        address
                        network
                        symbol
                        decimals
                        balance
                        balanceUSD
                        price
                        appId
                        groupId
                        groupLabel
                        supply
                        pricePerShare
                        tokens {
                          ... on BaseTokenPositionBalance {
                            type
                            address
                            network
                            balance
                            balanceUSD
                            price
                            symbol
                            decimals
                          }
                          ... on AppTokenPositionBalance {
                            type
                            address
                            network
                            balance
                            balanceUSD
                            price
                            symbol
                            decimals
                            appId
                            supply
                            pricePerShare
                            tokens {
                              ... on BaseTokenPositionBalance {
                                type
                                address
                                network
                                balance
                                balanceUSD
                                price
                                symbol
                                decimals
                              }
                            }
                          }
                        }
                        displayProps {
                          label
                          images
                          balanceDisplayMode
                        }
                      }
                      ... on ContractPositionBalance {
                        type
                        address
                        network
                        appId
                        groupId
                        groupLabel
                        balanceUSD
                        tokens {
                          metaType
                          token {
                            ... on BaseTokenPositionBalance {
                              type
                              address
                              network
                              balance
                              balanceUSD
                              price
                              symbol
                              decimals
                            }
                            ... on AppTokenPositionBalance {
                              type
                              address
                              network
                              balance
                              balanceUSD
                              price
                              symbol
                              decimals
                              appId
                              supply
                              pricePerShare
                              tokens {
                                ... on BaseTokenPositionBalance {
                                  type
                                  address
                                  network
                                  balance
                                  balanceUSD
                                  price
                                  symbol
                                  decimals
                                }
                              }
                            }
                          }
                        }
                        displayProps {
                          label
                          images
                          balanceDisplayMode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  // NFT Balances GraphQL Query
  private readonly NFT_BALANCES_QUERY = `
    query NFTBalances($addresses: [Address!]!, $first: Int, $chainIds: [Int!], $order: PortfolioV2NftBalanceByTokenInputInput) {
      portfolioV2(addresses: $addresses, chainIds: $chainIds) {
        nftBalances {
          totalBalanceUSD
          totalTokensOwned
          byToken(first: $first, order: $order) {
            edges {
              node {
                lastReceived
                token {
                  tokenId
                  name
                  description
                  supply
                  circulatingSupply
                  estimatedValue {
                    valueUsd
                    valueWithDenomination
                    denomination {
                      address
                      symbol
                      network
                    }
                  }
                  collection {
                    network
                    address
                    name
                    type
                    deployer
                    deployedAt
                    owner
                    medias {
                      logo {
                        mimeType
                        fileSize
                        blurhash
                        height
                        width
                        originalUri
                        original
                        large
                        medium
                        thumbnail
                        predominantColor
                      }
                    }
                  }
                  mediasV3 {
                    images {
                      edges {
                        node {
                          mimeType
                          fileSize
                          blurhash
                          height
                          width
                          originalUri
                          original
                          thumbnail
                          medium
                          large
                          predominantColor
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  // Portfolio Totals GraphQL Query
  private readonly PORTFOLIO_TOTALS_QUERY = `
    query PortfolioV2Totals($addresses: [Address!]!, $first: Int, $chainIds: [Int!]) {
      portfolioV2(addresses: $addresses, chainIds: $chainIds) {
        tokenBalances {
          totalBalanceUSD
          byNetwork(first: $first) {
            edges {
              node {
                network {
                  name
                  slug
                  chainId
                  evmCompatible
                }
                balanceUSD
              }
            }
          }
        }
        nftBalances {
          totalBalanceUSD
          byNetwork(first: $first) {
            edges {
              node {
                network {
                  name
                  slug
                  chainId
                  evmCompatible
                }
                balanceUSD
              }
            }
          }
        }
        appBalances {
          totalBalanceUSD
          byNetwork(first: $first) {
            edges {
              node {
                network {
                  name
                  slug
                  chainId
                  evmCompatible
                }
                balanceUSD
              }
            }
          }
        }
      }
    }
  `;

  // Claimables GraphQL Query
  private readonly CLAIMABLES_QUERY = `
    query ClaimablesV2($addresses: [Address!]!, $chainIds: [Int!]) {
      portfolioV2(addresses: $addresses, chainIds: $chainIds) {
        appBalances {
          byApp(first: 10) {
            edges {
              node {
                app {
                  displayName
                  imgUrl
                  description
                  slug
                  url
                  category {
                    name
                  }
                }
                network {
                  name
                  slug
                  chainId
                  evmCompatible
                }
                balances(first: 10) {
                  edges {
                    node {
                      ... on ContractPositionBalance {
                        address
                        balanceUSD
                        tokens {
                          metaType
                          token {
                            ... on BaseTokenPositionBalance {
                              type
                              address
                              network
                              balance
                              balanceUSD
                              price
                              symbol
                              decimals
                            }
                          }
                        }
                        displayProps {
                          label
                          images
                          balanceDisplayMode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  // Meta Type Breakdown GraphQL Query
  private readonly META_TYPE_BREAKDOWN_QUERY = `
    query BreakdownByType($addresses: [Address!]!, $first: Int, $chainIds: [Int!]) {
      portfolioV2(addresses: $addresses, chainIds: $chainIds) {
        appBalances {
          byMetaType(first: $first) {
            totalCount
            edges {
              node {
                metaType
                positionCount
                balanceUSD
              }
            }
          }
        }
      }
    }
  `;

  private generateCacheKey(method: string, address: string, params: any): string {
    const paramString = JSON.stringify(params);
    return `portfolio:${method}:${address}:${Buffer.from(paramString).toString('base64')}`;
  }

  private async executeGraphQLQuery(query: string, variables: any): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add API key if available
      if (this.zapperApiKey) {
        headers['x-zapper-api-key'] = this.zapperApiKey;
      }

      this.logger.debug(`Making GraphQL request to: ${this.zapperGraphQLUrl}`);
      this.logger.debug(`Headers: ${JSON.stringify(headers)}`);

      const response: AxiosResponse = await axios.post(
        this.zapperGraphQLUrl,
        {
          query,
          variables,
        },
        {
          headers,
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.errors) {
        this.logger.error('GraphQL errors:', response.data.errors);
        throw new HttpException(
          `GraphQL errors: ${response.data.errors.map(e => e.message).join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data.data;
    } catch (error) {
      // If it's already an HttpException (like GraphQL errors), re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('GraphQL request failed:', error.message);
      if (error.response?.status === 400) {
        throw new HttpException(
          'Invalid address or parameters',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new HttpException(
          'Invalid API key or unauthorized access',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (error.response?.status === 404) {
        throw new HttpException(
          'Zapper API endpoint not found. Please check the API URL configuration.',
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Failed to fetch portfolio data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private validateAddress(address: string): boolean {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    const btcAddressRegex = /^bc1[a-zA-HJ-NP-Z0-9]{25,39}$/;
    return ethAddressRegex.test(address) || btcAddressRegex.test(address);
  }

  async getTokenBalances(
    address: string,
    queryParams: PortfolioQueryDto,
  ): Promise<TokenBalancesDto> {
    if (!this.validateAddress(address)) {
      throw new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
    }

    const cacheKey = this.generateCacheKey('tokenBalances', address, queryParams);
    
    // Try to get from cache first
    try {
      const cached = await this.cacheManager.get<TokenBalancesDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for token balances: ${address}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache get failed:', error.message);
    }

    const variables = {
      addresses: [address],
      first: queryParams.first || 25,
      chainIds: queryParams.chainIds,
    };

    const data = await this.executeGraphQLQuery(this.TOKEN_BALANCES_QUERY, variables);
    const tokenBalances = data.portfolioV2.tokenBalances;

    const result: TokenBalancesDto = {
      totalBalanceUSD: tokenBalances.totalBalanceUSD,
      totalCount: tokenBalances.byToken.totalCount,
      byToken: tokenBalances.byToken.edges.map((edge: any) => ({
        ...edge.node,
        network: edge.node.network,
      })),
    };

    // Cache the result
    try {
      await this.cacheManager.set(cacheKey, result, this.cacheTtl);
      this.logger.debug(`Cached token balances for: ${address}`);
    } catch (error) {
      this.logger.warn('Cache set failed:', error.message);
    }

    return result;
  }

  async getAppBalances(
    address: string,
    queryParams: PortfolioQueryDto,
  ): Promise<AppBalancesDto> {
    if (!this.validateAddress(address)) {
      throw new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
    }

    const cacheKey = this.generateCacheKey('appBalances', address, queryParams);
    
    // Try to get from cache first
    try {
      const cached = await this.cacheManager.get<AppBalancesDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for app balances: ${address}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache get failed:', error.message);
    }

    const variables = {
      addresses: [address],
      first: queryParams.first || 25,
      chainIds: queryParams.chainIds,
    };

    const data = await this.executeGraphQLQuery(this.APP_BALANCES_QUERY, variables);
    const appBalances = data.portfolioV2.appBalances;

    const result: AppBalancesDto = {
      totalBalanceUSD: appBalances.totalBalanceUSD,
      byApp: appBalances.byApp.edges.map((edge: any) => ({
        balanceUSD: edge.node.balanceUSD,
        app: edge.node.app,
        network: edge.node.network,
        positionBalances: edge.node.positionBalances.edges.map((posEdge: any) => posEdge.node),
      })),
    };

    // Cache the result
    try {
      await this.cacheManager.set(cacheKey, result, this.cacheTtl);
      this.logger.debug(`Cached app balances for: ${address}`);
    } catch (error) {
      this.logger.warn('Cache set failed:', error.message);
    }

    return result;
  }

  async getNFTBalances(
    address: string,
    queryParams: PortfolioQueryDto,
  ): Promise<NFTBalancesDto> {
    if (!this.validateAddress(address)) {
      throw new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
    }

    const cacheKey = this.generateCacheKey('nftBalances', address, queryParams);
    
    // Try to get from cache first
    try {
      const cached = await this.cacheManager.get<NFTBalancesDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for NFT balances: ${address}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache get failed:', error.message);
    }

    const variables = {
      addresses: [address],
      first: queryParams.first || 25,
      chainIds: queryParams.chainIds,
      order: { by: 'USD_WORTH' },
      // Note: NFT queries don't support minBalanceUSD filter, only hidden/chainId/collections
    };

    const data = await this.executeGraphQLQuery(this.NFT_BALANCES_QUERY, variables);
    const nftBalances = data.portfolioV2.nftBalances;

    const result: NFTBalancesDto = {
      totalBalanceUSD: nftBalances.totalBalanceUSD,
      totalTokensOwned: nftBalances.totalTokensOwned,
      byToken: nftBalances.byToken.edges.map((edge: any) => ({
        lastReceived: edge.node.lastReceived,
        token: edge.node.token,
      })),
    };

    // Cache the result
    try {
      await this.cacheManager.set(cacheKey, result, this.cacheTtl);
      this.logger.debug(`Cached NFT balances for: ${address}`);
    } catch (error) {
      this.logger.warn('Cache set failed:', error.message);
    }

    return result;
  }

  async getPortfolioTotals(
    address: string,
    queryParams: PortfolioQueryDto,
  ): Promise<PortfolioTotalsDto> {
    if (!this.validateAddress(address)) {
      throw new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
    }

    const cacheKey = this.generateCacheKey('portfolioTotals', address, queryParams);
    
    // Try to get from cache first
    try {
      const cached = await this.cacheManager.get<PortfolioTotalsDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for portfolio totals: ${address}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache get failed:', error.message);
    }

    const variables = {
      addresses: [address],
      first: queryParams.first || 20,
      chainIds: queryParams.chainIds,
    };

    const data = await this.executeGraphQLQuery(this.PORTFOLIO_TOTALS_QUERY, variables);
    const portfolio = data.portfolioV2;

    const tokenTotalUSD = portfolio.tokenBalances.totalBalanceUSD;
    const appTotalUSD = portfolio.appBalances.totalBalanceUSD;
    const nftTotalUSD = portfolio.nftBalances.totalBalanceUSD;

    const result: PortfolioTotalsDto = {
      tokenBalances: {
        totalBalanceUSD: tokenTotalUSD,
        byNetwork: portfolio.tokenBalances.byNetwork.edges.map((edge: any) => ({
          network: edge.node.network,
          balanceUSD: edge.node.balanceUSD,
        })),
      },
      appBalances: {
        totalBalanceUSD: appTotalUSD,
        byNetwork: portfolio.appBalances.byNetwork.edges.map((edge: any) => ({
          network: edge.node.network,
          balanceUSD: edge.node.balanceUSD,
        })),
      },
      nftBalances: {
        totalBalanceUSD: nftTotalUSD,
        byNetwork: portfolio.nftBalances.byNetwork.edges.map((edge: any) => ({
          network: edge.node.network,
          balanceUSD: edge.node.balanceUSD,
        })),
      },
      totalPortfolioValue: tokenTotalUSD + appTotalUSD + nftTotalUSD,
    };

    // Cache the result
    try {
      await this.cacheManager.set(cacheKey, result, this.cacheTtl);
      this.logger.debug(`Cached portfolio totals for: ${address}`);
    } catch (error) {
      this.logger.warn('Cache set failed:', error.message);
    }

    return result;
  }

  async getClaimables(
    address: string,
    queryParams: PortfolioQueryDto,
  ): Promise<ClaimablesDto> {
    if (!this.validateAddress(address)) {
      throw new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
    }

    const cacheKey = this.generateCacheKey('claimables', address, queryParams);
    
    // Try to get from cache first
    try {
      const cached = await this.cacheManager.get<ClaimablesDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for claimables: ${address}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache get failed:', error.message);
    }

    const variables = {
      addresses: [address],
      chainIds: queryParams.chainIds,
    };

    const data = await this.executeGraphQLQuery(this.CLAIMABLES_QUERY, variables);
    const appBalances = data.portfolioV2.appBalances;

    const claimables: any[] = [];
    let totalClaimableUSD = 0;

    appBalances.byApp.edges.forEach((appEdge: any) => {
      appEdge.node.balances.edges.forEach((balanceEdge: any) => {
        const position = balanceEdge.node;
        const claimableTokens = position.tokens?.filter((token: any) => 
          token.metaType === 'CLAIMABLE'
        ) || [];

        if (claimableTokens.length > 0) {
          const claimableUSD = claimableTokens.reduce(
            (sum: number, token: any) => sum + (token.token.balanceUSD || 0),
            0
          );
          
          totalClaimableUSD += claimableUSD;

          claimables.push({
            app: appEdge.node.app,
            network: appEdge.node.network,
            address: position.address,
            balanceUSD: claimableUSD,
            claimableTokens: claimableTokens,
            displayProps: position.displayProps,
          });
        }
      });
    });

    const result: ClaimablesDto = {
      totalClaimableUSD,
      claimables,
    };

    // Cache the result
    try {
      await this.cacheManager.set(cacheKey, result, this.cacheTtl);
      this.logger.debug(`Cached claimables for: ${address}`);
    } catch (error) {
      this.logger.warn('Cache set failed:', error.message);
    }

    return result;
  }

  async getMetaTypeBreakdown(
    address: string,
    queryParams: PortfolioQueryDto,
  ): Promise<MetaTypeBreakdownsDto> {
    if (!this.validateAddress(address)) {
      throw new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
    }

    const cacheKey = this.generateCacheKey('metaTypeBreakdown', address, queryParams);
    
    // Try to get from cache first
    try {
      const cached = await this.cacheManager.get<MetaTypeBreakdownsDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for meta type breakdown: ${address}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache get failed:', error.message);
    }

    const variables = {
      addresses: [address],
      first: queryParams.first || 10,
      chainIds: queryParams.chainIds,
    };

    const data = await this.executeGraphQLQuery(this.META_TYPE_BREAKDOWN_QUERY, variables);
    const breakdown = data.portfolioV2.appBalances.byMetaType;

    const result: MetaTypeBreakdownsDto = {
      totalCount: breakdown.totalCount,
      byMetaType: breakdown.edges.map((edge: any) => ({
        metaType: edge.node.metaType,
        positionCount: edge.node.positionCount,
        balanceUSD: edge.node.balanceUSD,
      })),
    };

    // Cache the result
    try {
      await this.cacheManager.set(cacheKey, result, this.cacheTtl);
      this.logger.debug(`Cached meta type breakdown for: ${address}`);
    } catch (error) {
      this.logger.warn('Cache set failed:', error.message);
    }

    return result;
  }
}
