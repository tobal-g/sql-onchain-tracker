import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';
import { PortfolioService } from './portfolio.service';
import {
  TokenBalancesDto,
  AppBalancesDto,
  NFTBalancesDto,
  PortfolioTotalsDto,
  ClaimablesDto,
  MetaTypeBreakdownsDto,
} from './dto/portfolio.dto';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PortfolioService', () => {
  let service: PortfolioService;
  let mockCacheManager: jest.Mocked<Cache>;
  let mockConfigService: jest.Mocked<ConfigService>;

  const validAddress = '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1';
  const invalidAddress = 'invalid-address';

  // Mock cache manager
  const createMockCacheManager = () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
    wrap: jest.fn(),
    store: {
      keys: jest.fn(),
      ttl: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      mdel: jest.fn(),
    },
  });

  // Mock config service
  const createMockConfigService = () => ({
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        ZAPPER_API_URL: 'https://public.zapper.xyz/graphql',
        ZAPPER_API_KEY: 'test-api-key',
        CACHE_TTL: 90,
      };
      return config[key] || defaultValue;
    }),
    getOrThrow: jest.fn(),
    set: jest.fn(),
  });

  // Mock data for responses
  const mockTokenBalancesResponse = {
    data: {
      data: {
        portfolioV2: {
          tokenBalances: {
            totalBalanceUSD: 251379.07705505722,
            byToken: {
              totalCount: 6443,
              edges: [
                {
                  node: {
                    symbol: 'BKIT',
                    tokenAddress: '0x262a9f4e84efa2816d87a68606bb4c1ea3874bf1',
                    balance: 28980487535.238518,
                    balanceUSD: 31298.9265380576,
                    price: 0.00000108,
                    imgUrlV2:
                      'https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x262a9f4e84efa2816d87a68606bb4c1ea3874bf1.png',
                    name: 'Bangkit',
                    decimals: 18,
                    balanceRaw: '28980487535238518000000000000',
                    network: {
                      name: 'Base',
                      slug: 'base',
                      chainId: 8453,
                      evmCompatible: true,
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  };

  const mockAppBalancesResponse = {
    data: {
      data: {
        portfolioV2: {
          appBalances: {
            totalBalanceUSD: 23939642.91719707,
            byApp: {
              totalCount: 1,
              edges: [
                {
                  node: {
                    balanceUSD: 23939642.91719707,
                    app: {
                      displayName: 'Lido',
                      imgUrl:
                        'https://storage.googleapis.com/zapper-fi-assets/apps%2Flido.png',
                      description:
                        'Simplified and secure participation in staking',
                      slug: 'lido',
                      url: 'https://lido.fi/',
                      category: {
                        name: 'Staking',
                      },
                    },
                    network: {
                      name: 'Ethereum',
                      slug: 'ethereum',
                      chainId: 1,
                      evmCompatible: true,
                    },
                    positionBalances: {
                      edges: [
                        {
                          node: {
                            type: 'app-token',
                            address:
                              '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
                            network: 'ETHEREUM_MAINNET',
                            symbol: 'wstETH',
                            decimals: 18,
                            balance: 7880.037743210678,
                            balanceUSD: 23939642.91719707,
                            price: 3038.01119960664,
                            appId: 'lido',
                            groupId: 'wsteth',
                            groupLabel: 'wstETH',
                            supply: 3461283.5529221934,
                            pricePerShare: [1.2056461174237205],
                            tokens: [
                              {
                                type: 'base-token',
                                address:
                                  '0x0000000000000000000000000000000000000000',
                                network: 'ETHEREUM_MAINNET',
                                balance: 9500.536910254332,
                                balanceUSD: 23939642.91719707,
                                price: 2519.82,
                                symbol: 'ETH',
                                decimals: 18,
                              },
                            ],
                            displayProps: {
                              label: 'wstETH',
                              images: [
                                'https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x0000000000000000000000000000000000000000.png',
                              ],
                              balanceDisplayMode: null,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  };

  const mockNFTBalancesResponse = {
    data: {
      data: {
        portfolioV2: {
          nftBalances: {
            totalBalanceUSD: 7330.6878496656,
            totalTokensOwned: '31134',
            byToken: {
              edges: [
                {
                  node: {
                    lastReceived: 1734041699000,
                    token: {
                      tokenId: '10407',
                      name: 'Lil Pudgy #10407',
                      description:
                        'Lil Pudgys are a collection of 22,222 randomly generated NFTs minted on Ethereum.',
                      supply: '1',
                      circulatingSupply: '1',
                      estimatedValue: {
                        valueUsd: 2671.701185940551,
                        valueWithDenomination: 1.4814883824848697,
                        denomination: {
                          address: '0x0000000000000000000000000000000000000000',
                          symbol: 'ETH',
                          network: 'ethereum',
                        },
                      },
                      collection: {
                        network: 'ETHEREUM_MAINNET',
                        address: '0x524cab2ec69124574082676e6f654a18df49a048',
                        name: 'LilPudgys',
                        type: 'GENERAL',
                        deployer: '0xe9da256a28630efdc637bfd4c65f0887be1aeda8',
                        deployedAt: 1639933745000,
                        owner: '0xe9da256a28630efdc637bfd4c65f0887be1aeda8',
                        medias: {
                          logo: {
                            mimeType: 'image/png',
                            fileSize: 5962,
                            blurhash: 'URHyw=WZ0stTN2j?xuWD0ut8^aj[?vWYIUt6',
                            height: 250,
                            width: 250,
                            originalUri:
                              'https://storage.googleapis.com/zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png',
                            original:
                              'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&checksum=VklwQoOgHYKsPj8GPZ1FDTXN8hPPSaVBjHCmiQ7vZy8',
                            large:
                              'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&width=500&checksum=NlRY3lUeBcOFw3CzxcAGAQKxOLw3JhreqJ38BZTC9D0',
                            medium:
                              'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&width=250&checksum=VPxH2Ejt_0dOcWCesNcsfQYZgcGYPIFERQexdytLyP0',
                            thumbnail:
                              'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&width=100&checksum=BFebU_PxxIAdlqld0-cJ_M0bjMTd3qTBRdFx02pBX5M',
                            predominantColor: '#9ab3ed',
                          },
                        },
                      },
                      mediasV3: {
                        images: {
                          edges: [
                            {
                              node: {
                                mimeType: 'image/png',
                                fileSize: 181886,
                                blurhash:
                                  'UPQ4c{$j_$+^{0n%CRX8s;jtS0bFtlbHv#n%',
                                height: 2700,
                                width: 2700,
                                originalUri:
                                  'https://api.pudgypenguins.io/lil/image/10407',
                                original:
                                  'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&checksum=fRHieiOCQj_0piw8VZc-HDP-f5Uy8cl4p99Dx-66ycM',
                                thumbnail:
                                  'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&width=100&checksum=oDAXzMIzWvlGOLbb1nN8IWKl4_B26B840wd6CXwhSWw',
                                medium:
                                  'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&width=250&checksum=jiyBP_I0JxBPasrg273qHzkTPOfnzRyMCdHakPTV-vk',
                                large:
                                  'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&width=500&checksum=Ndb7k_Uoscl4oQ8vjoCCLljQcDG7BvtTV-SQ6w6JDRM',
                                predominantColor: '#e35063',
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  };

  const mockPortfolioTotalsResponse = {
    data: {
      data: {
        portfolioV2: {
          tokenBalances: {
            totalBalanceUSD: 225590.09863164127,
            byNetwork: {
              edges: [
                {
                  node: {
                    network: {
                      name: 'Base',
                      slug: 'base',
                      chainId: 8453,
                      evmCompatible: true,
                    },
                    balanceUSD: 221754.1899751895,
                  },
                },
              ],
            },
          },
          nftBalances: {
            totalBalanceUSD: 62906.44492750787,
            byNetwork: {
              edges: [
                {
                  node: {
                    network: {
                      name: 'Base',
                      slug: 'base',
                      chainId: 8453,
                      evmCompatible: true,
                    },
                    balanceUSD: 50749.39954198,
                  },
                },
              ],
            },
          },
          appBalances: {
            totalBalanceUSD: 4410.540131308049,
            byNetwork: {
              edges: [
                {
                  node: {
                    network: {
                      name: 'Base',
                      slug: 'base',
                      chainId: 8453,
                      evmCompatible: true,
                    },
                    balanceUSD: 4393.335087708013,
                  },
                },
              ],
            },
          },
        },
      },
    },
  };

  const mockClaimablesResponse = {
    data: {
      data: {
        portfolioV2: {
          appBalances: {
            byApp: {
              edges: [
                {
                  node: {
                    app: {
                      displayName: 'Uniswap V3',
                      imgUrl:
                        'https://storage.googleapis.com/zapper-fi-assets/apps%2Funiswap-v3.png',
                      description: 'Uniswap V3',
                      slug: 'uniswap-v3',
                      url: 'https://uniswap.org/',
                      category: {
                        name: 'Exchange',
                      },
                    },
                    network: {
                      name: 'Base',
                      slug: 'base',
                      chainId: 8453,
                      evmCompatible: true,
                    },
                    balances: {
                      edges: [
                        {
                          node: {
                            address:
                              '0x03a520b32c04bf3beef7beb72e919cf822ed34f1',
                            balanceUSD: 290.2802431386432,
                            tokens: [
                              {
                                metaType: 'CLAIMABLE',
                                token: {
                                  type: 'base-token',
                                  address:
                                    '0x4200000000000000000000000000000000000006',
                                  network: 'BASE_MAINNET',
                                  balance: 0.022992034771408265,
                                  balanceUSD: 43.06247168441369,
                                  symbol: 'WETH',
                                  price: 1872.93,
                                  decimals: 18,
                                },
                              },
                            ],
                            displayProps: {
                              label: '⌘ / WETH (Token ID: 1568607)',
                              images: [
                                'https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x4200000000000000000000000000000000000006.png',
                              ],
                              balanceDisplayMode: null,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  };

  const mockMetaTypeBreakdownResponse = {
    data: {
      data: {
        portfolioV2: {
          appBalances: {
            byMetaType: {
              totalCount: 4,
              edges: [
                {
                  node: {
                    metaType: 'SUPPLIED',
                    positionCount: 9,
                    balanceUSD: 2440.56541427308,
                  },
                },
                {
                  node: {
                    metaType: 'CLAIMABLE',
                    positionCount: 3,
                    balanceUSD: 755.86366790903,
                  },
                },
              ],
            },
          },
        },
      },
    },
  };

  beforeEach(async () => {
    // Create fresh mocks for each test
    mockCacheManager =
      createMockCacheManager() as unknown as jest.Mocked<Cache>;
    mockConfigService =
      createMockConfigService() as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    // Ensure cache.get returns undefined by default (cache miss)
    mockCacheManager.get.mockResolvedValue(undefined);
    // Ensure cache.set succeeds by default
    mockCacheManager.set.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokenBalances', () => {
    it('should return token balances for a valid address', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockTokenBalancesResponse);

      const result = await service.getTokenBalances(validAddress, {});

      expect(result).toBeDefined();
      expect(result.totalBalanceUSD).toBe(251379.07705505722);
      expect(result.totalCount).toBe(6443);
      expect(result.byToken).toHaveLength(1);
      expect(result.byToken[0].symbol).toBe('BKIT');
      expect(result.byToken[0].network.name).toBe('Base');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://public.zapper.xyz/graphql',
        expect.objectContaining({
          query: expect.stringContaining('TokenBalances'),
          variables: expect.objectContaining({
            addresses: [validAddress],
            first: 25,
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-zapper-api-key': 'test-api-key',
          }),
          timeout: 30000,
        }),
      );

      // Verify caching
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('portfolio:tokenBalances:'),
        result,
        90000, // 90 seconds in milliseconds
      );
    });

    it('should return cached result when available', async () => {
      const cachedResult = { totalBalanceUSD: 100, totalCount: 1, byToken: [] };
      mockCacheManager.get.mockResolvedValueOnce(cachedResult);

      const result = await service.getTokenBalances(validAddress, {});

      expect(result).toBe(cachedResult);
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(mockCacheManager.get).toHaveBeenCalled();
    });

    it('should handle query parameters correctly', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockTokenBalancesResponse);

      const queryParams = {
        chainIds: [1],
        first: 10,
      };

      await service.getTokenBalances(validAddress, queryParams);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://public.zapper.xyz/graphql',
        expect.objectContaining({
          variables: expect.objectContaining({
            addresses: [validAddress],
            first: 10,
            chainIds: [1],
          }),
        }),
        expect.any(Object),
      );
    });

    it('should throw an error for invalid address', async () => {
      await expect(
        service.getTokenBalances(invalidAddress, {}),
      ).rejects.toThrow(
        new HttpException('Invalid address format', HttpStatus.BAD_REQUEST),
      );

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle GraphQL errors', async () => {
      const errorResponse = {
        data: {
          data: null,
          errors: [{ message: 'GraphQL error' }],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(errorResponse);

      await expect(service.getTokenBalances(validAddress, {})).rejects.toThrow(
        new HttpException(
          'GraphQL errors: GraphQL error',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getTokenBalances(validAddress, {})).rejects.toThrow(
        new HttpException(
          'Failed to fetch portfolio data',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getAppBalances', () => {
    it('should return app balances for a valid address', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockAppBalancesResponse);

      const result = await service.getAppBalances(validAddress, {});

      expect(result).toBeDefined();
      expect(result.totalBalanceUSD).toBe(23939642.91719707);
      expect(result.byApp).toHaveLength(1);
      expect(result.byApp[0].app.displayName).toBe('Lido');
      expect(result.byApp[0].network.name).toBe('Ethereum');
      expect(result.byApp[0].positionBalances).toHaveLength(1);

      // Verify caching
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should throw an error for invalid address', async () => {
      await expect(service.getAppBalances(invalidAddress, {})).rejects.toThrow(
        new HttpException('Invalid address format', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getNFTBalances', () => {
    it('should return NFT balances for a valid address', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockNFTBalancesResponse);

      const result = await service.getNFTBalances(validAddress, {});

      expect(result).toBeDefined();
      expect(result.totalBalanceUSD).toBe(7330.6878496656);
      expect(result.totalTokensOwned).toBe('31134');
      expect(result.byToken).toHaveLength(1);
      expect(result.byToken[0].token.name).toBe('Lil Pudgy #10407');

      // Verify caching
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should throw an error for invalid address', async () => {
      await expect(service.getNFTBalances(invalidAddress, {})).rejects.toThrow(
        new HttpException('Invalid address format', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getPortfolioTotals', () => {
    it('should return portfolio totals for a valid address', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockPortfolioTotalsResponse);

      const result = await service.getPortfolioTotals(validAddress, {});

      expect(result).toBeDefined();
      expect(result.tokenBalances.totalBalanceUSD).toBe(225590.09863164127);
      expect(result.appBalances.totalBalanceUSD).toBe(4410.540131308049);
      expect(result.nftBalances.totalBalanceUSD).toBe(62906.44492750787);
      expect(result.totalPortfolioValue).toBe(
        225590.09863164127 + 4410.540131308049 + 62906.44492750787,
      );

      // Verify caching
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should throw an error for invalid address', async () => {
      await expect(
        service.getPortfolioTotals(invalidAddress, {}),
      ).rejects.toThrow(
        new HttpException('Invalid address format', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getClaimables', () => {
    it('should return claimable tokens for a valid address', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockClaimablesResponse);

      const result = await service.getClaimables(validAddress, {});

      expect(result).toBeDefined();
      expect(result.totalClaimableUSD).toBe(43.06247168441369);
      expect(result.claimables).toHaveLength(1);
      expect(result.claimables[0].app.displayName).toBe('Uniswap V3');
      expect(result.claimables[0].claimableTokens).toHaveLength(1);
      expect(result.claimables[0].claimableTokens[0].metaType).toBe(
        'CLAIMABLE',
      );

      // Verify caching
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should return empty claimables when no claimable tokens found', async () => {
      const emptyResponse = {
        data: {
          data: {
            portfolioV2: {
              appBalances: {
                byApp: {
                  edges: [],
                },
              },
            },
          },
        },
      };
      mockedAxios.post.mockResolvedValueOnce(emptyResponse);

      const result = await service.getClaimables(validAddress, {});

      expect(result.totalClaimableUSD).toBe(0);
      expect(result.claimables).toHaveLength(0);
    });

    it('should throw an error for invalid address', async () => {
      await expect(service.getClaimables(invalidAddress, {})).rejects.toThrow(
        new HttpException('Invalid address format', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getMetaTypeBreakdown', () => {
    it('should return meta type breakdown for a valid address', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockMetaTypeBreakdownResponse);

      const result = await service.getMetaTypeBreakdown(validAddress, {});

      expect(result).toBeDefined();
      expect(result.totalCount).toBe(4);
      expect(result.byMetaType).toHaveLength(2);
      expect(result.byMetaType[0].metaType).toBe('SUPPLIED');
      expect(result.byMetaType[0].positionCount).toBe(9);
      expect(result.byMetaType[0].balanceUSD).toBe(2440.56541427308);

      // Verify caching
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should throw an error for invalid address', async () => {
      await expect(
        service.getMetaTypeBreakdown(invalidAddress, {}),
      ).rejects.toThrow(
        new HttpException('Invalid address format', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('address validation', () => {
    it('should accept valid Ethereum addresses', async () => {
      const validAddresses = [
        '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        '0x0000000000000000000000000000000000000000',
      ];

      mockedAxios.post.mockResolvedValue(mockTokenBalancesResponse);

      for (const address of validAddresses) {
        await expect(
          service.getTokenBalances(address, {}),
        ).resolves.toBeDefined();
      }
    });

    it('should reject invalid Ethereum addresses', async () => {
      const invalidAddresses = [
        'invalid-address',
        '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf', // too short
        '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf12', // too long
        '849151d7d0bf1f34b70d5cad5149d28cc2308bf1', // missing 0x
        '0xgg9151d7d0bf1f34b70d5cad5149d28cc2308bf1', // invalid characters
      ];

      for (const address of invalidAddresses) {
        await expect(service.getTokenBalances(address, {})).rejects.toThrow(
          new HttpException('Invalid address format', HttpStatus.BAD_REQUEST),
        );
      }
    });
  });

  describe('HTTP error handling', () => {
    it('should handle 400 status codes as bad request', async () => {
      const error = {
        response: { status: 400 },
        message: 'Bad request',
      };
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(service.getTokenBalances(validAddress, {})).rejects.toThrow(
        new HttpException(
          'Invalid address or parameters',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should handle 404 status codes with specific message', async () => {
      const error = {
        response: { status: 404 },
        message: 'Not found',
      };
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(service.getTokenBalances(validAddress, {})).rejects.toThrow(
        new HttpException(
          'Zapper API endpoint not found. Please check the API URL configuration.',
          HttpStatus.NOT_FOUND,
        ),
      );
    });

    it('should handle other HTTP errors as internal server error', async () => {
      const error = {
        response: { status: 500 },
        message: 'Internal server error',
      };
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(service.getTokenBalances(validAddress, {})).rejects.toThrow(
        new HttpException(
          'Failed to fetch portfolio data',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('caching behavior', () => {
    it('should handle cache failures gracefully', async () => {
      // Mock cache get to throw an error
      mockCacheManager.get.mockRejectedValueOnce(new Error('Cache error'));
      mockedAxios.post.mockResolvedValueOnce(mockTokenBalancesResponse);

      const result = await service.getTokenBalances(validAddress, {});

      expect(result).toBeDefined();
      expect(mockedAxios.post).toHaveBeenCalled(); // Should still make API call
    });

    it('should handle cache set failures gracefully', async () => {
      // Mock cache set to throw an error
      mockCacheManager.set.mockRejectedValueOnce(new Error('Cache error'));
      mockedAxios.post.mockResolvedValueOnce(mockTokenBalancesResponse);

      const result = await service.getTokenBalances(validAddress, {});

      expect(result).toBeDefined(); // Should still return result
    });
  });
});
