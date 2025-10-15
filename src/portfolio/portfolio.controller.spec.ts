import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let service: PortfolioService;

  const validAddress = '0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1';

  // Mock data for responses
  const mockTokenBalances = {
    totalBalanceUSD: 251379.07705505722,
    totalCount: 6443,
    byToken: [
      {
        symbol: 'BKIT',
        tokenAddress: '0x262a9f4e84efa2816d87a68606bb4c1ea3874bf1',
        balance: 28980487535.238518,
        balanceUSD: 31298.9265380576,
        price: 0.00000108,
        imgUrlV2: 'https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x262a9f4e84efa2816d87a68606bb4c1ea3874bf1.png',
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
    ],
  };

  const mockAppBalances = {
    totalBalanceUSD: 23939642.91719707,
    byApp: [
      {
        balanceUSD: 23939642.91719707,
        app: {
          displayName: 'Lido',
          imgUrl: 'https://storage.googleapis.com/zapper-fi-assets/apps%2Flido.png',
          description: 'Simplified and secure participation in staking',
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
        positionBalances: [
          {
            type: 'app-token',
            address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
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
                address: '0x0000000000000000000000000000000000000000',
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
              images: ['https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x0000000000000000000000000000000000000000.png'],
              balanceDisplayMode: null,
            },
          },
        ],
      },
    ],
  };

  const mockNFTBalances = {
    totalBalanceUSD: 7330.6878496656,
    totalTokensOwned: '31134',
    byToken: [
      {
        lastReceived: 1734041699000,
        token: {
          tokenId: '10407',
          name: 'Lil Pudgy #10407',
          description: 'Lil Pudgys are a collection of 22,222 randomly generated NFTs minted on Ethereum.',
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
                originalUri: 'https://storage.googleapis.com/zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png',
                original: 'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&checksum=VklwQoOgHYKsPj8GPZ1FDTXN8hPPSaVBjHCmiQ7vZy8',
                large: 'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&width=500&checksum=NlRY3lUeBcOFw3CzxcAGAQKxOLw3JhreqJ38BZTC9D0',
                medium: 'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&width=250&checksum=VPxH2Ejt_0dOcWCesNcsfQYZgcGYPIFERQexdytLyP0',
                thumbnail: 'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&width=100&checksum=BFebU_PxxIAdlqld0-cJ_M0bjMTd3qTBRdFx02pBX5M',
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
                    blurhash: 'UPQ4c{$j_$+^{0n%CRX8s;jtS0bFtlbHv#n%',
                    height: 2700,
                    width: 2700,
                    originalUri: 'https://api.pudgypenguins.io/lil/image/10407',
                    original: 'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&checksum=fRHieiOCQj_0piw8VZc-HDP-f5Uy8cl4p99Dx-66ycM',
                    thumbnail: 'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&width=100&checksum=oDAXzMIzWvlGOLbb1nN8IWKl4_B26B840wd6CXwhSWw',
                    medium: 'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&width=250&checksum=jiyBP_I0JxBPasrg273qHzkTPOfnzRyMCdHakPTV-vk',
                    large: 'https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&width=500&checksum=Ndb7k_Uoscl4oQ8vjoCCLljQcDG7BvtTV-SQ6w6JDRM',
                    predominantColor: '#e35063',
                  },
                },
              ],
            },
          },
        },
      },
    ],
  };

  const mockPortfolioTotals = {
    tokenBalances: {
      totalBalanceUSD: 225590.09863164127,
      byNetwork: [
        {
          network: {
            name: 'Base',
            slug: 'base',
            chainId: 8453,
            evmCompatible: true,
          },
          balanceUSD: 221754.1899751895,
        },
      ],
    },
    appBalances: {
      totalBalanceUSD: 4410.540131308049,
      byNetwork: [
        {
          network: {
            name: 'Base',
            slug: 'base',
            chainId: 8453,
            evmCompatible: true,
          },
          balanceUSD: 4393.335087708013,
        },
      ],
    },
    nftBalances: {
      totalBalanceUSD: 62906.44492750787,
      byNetwork: [
        {
          network: {
            name: 'Base',
            slug: 'base',
            chainId: 8453,
            evmCompatible: true,
          },
          balanceUSD: 50749.39954198,
        },
      ],
    },
    totalPortfolioValue: 292907.0831822574,
  };

  const mockClaimables = {
    totalClaimableUSD: 43.06247168441369,
    claimables: [
      {
        app: {
          displayName: 'Uniswap V3',
          imgUrl: 'https://storage.googleapis.com/zapper-fi-assets/apps%2Funiswap-v3.png',
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
        address: '0x03a520b32c04bf3beef7beb72e919cf822ed34f1',
        balanceUSD: 43.06247168441369,
        claimableTokens: [
          {
            metaType: 'CLAIMABLE',
            token: {
              type: 'base-token',
              address: '0x4200000000000000000000000000000000000006',
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
          images: ['https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x4200000000000000000000000000000000000006.png'],
          balanceDisplayMode: null,
        },
      },
    ],
  };

  const mockMetaTypeBreakdown = {
    totalCount: 4,
    byMetaType: [
      {
        metaType: 'SUPPLIED',
        positionCount: 9,
        balanceUSD: 2440.56541427308,
      },
      {
        metaType: 'CLAIMABLE',
        positionCount: 3,
        balanceUSD: 755.86366790903,
      },
    ],
  };

  // Mock service
  const mockPortfolioService = {
    getTokenBalances: jest.fn(),
    getAppBalances: jest.fn(),
    getNFTBalances: jest.fn(),
    getPortfolioTotals: jest.fn(),
    getClaimables: jest.fn(),
    getMetaTypeBreakdown: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioService,
          useValue: mockPortfolioService,
        },
      ],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);
    service = module.get<PortfolioService>(PortfolioService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTokenBalances', () => {
    it('should return token balances for a valid address', async () => {
      mockPortfolioService.getTokenBalances.mockResolvedValue(mockTokenBalances);

      const result = await controller.getTokenBalances(validAddress, {});

      expect(result).toBe(mockTokenBalances);
      expect(mockPortfolioService.getTokenBalances).toHaveBeenCalledWith(validAddress, {});
    });

    it('should pass query parameters correctly', async () => {
      mockPortfolioService.getTokenBalances.mockResolvedValue(mockTokenBalances);

      const queryParams = {
        chainIds: [8453],
        first: 10,
        minBalanceUSD: 100,
      };

      await controller.getTokenBalances(validAddress, queryParams);

      expect(mockPortfolioService.getTokenBalances).toHaveBeenCalledWith(validAddress, queryParams);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
      mockPortfolioService.getTokenBalances.mockRejectedValue(error);

      await expect(controller.getTokenBalances('invalid-address', {})).rejects.toThrow(error);
    });
  });

  describe('getAppBalances', () => {
    it('should return app balances for a valid address', async () => {
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);

      const result = await controller.getAppBalances(validAddress, {});

      expect(result).toBe(mockAppBalances);
      expect(mockPortfolioService.getAppBalances).toHaveBeenCalledWith(validAddress, {});
    });

    it('should pass query parameters correctly', async () => {
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);

      const queryParams = {
        chainIds: [8453],
        first: 10,
      };

      await controller.getAppBalances(validAddress, queryParams);

      expect(mockPortfolioService.getAppBalances).toHaveBeenCalledWith(validAddress, queryParams);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
      mockPortfolioService.getAppBalances.mockRejectedValue(error);

      await expect(controller.getAppBalances('invalid-address', {})).rejects.toThrow(error);
    });
  });

  describe('getNFTBalances', () => {
    it('should return NFT balances for a valid address', async () => {
      mockPortfolioService.getNFTBalances.mockResolvedValue(mockNFTBalances);

      const result = await controller.getNFTBalances(validAddress, {});

      expect(result).toBe(mockNFTBalances);
      expect(mockPortfolioService.getNFTBalances).toHaveBeenCalledWith(validAddress, {});
    });

    it('should pass query parameters correctly', async () => {
      mockPortfolioService.getNFTBalances.mockResolvedValue(mockNFTBalances);

      const queryParams = {
        chainIds: [8453],
        first: 25,
        minBalanceUSD: 10,
      };

      await controller.getNFTBalances(validAddress, queryParams);

      expect(mockPortfolioService.getNFTBalances).toHaveBeenCalledWith(validAddress, queryParams);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
      mockPortfolioService.getNFTBalances.mockRejectedValue(error);

      await expect(controller.getNFTBalances('invalid-address', {})).rejects.toThrow(error);
    });
  });

  describe('getPortfolioTotals', () => {
    it('should return portfolio totals for a valid address', async () => {
      mockPortfolioService.getPortfolioTotals.mockResolvedValue(mockPortfolioTotals);

      const result = await controller.getPortfolioTotals(validAddress, {});

      expect(result).toBe(mockPortfolioTotals);
      expect(mockPortfolioService.getPortfolioTotals).toHaveBeenCalledWith(validAddress, {});
    });

    it('should pass query parameters correctly', async () => {
      mockPortfolioService.getPortfolioTotals.mockResolvedValue(mockPortfolioTotals);

      const queryParams = {
        chainIds: [8453],
        first: 20,
      };

      await controller.getPortfolioTotals(validAddress, queryParams);

      expect(mockPortfolioService.getPortfolioTotals).toHaveBeenCalledWith(validAddress, queryParams);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
      mockPortfolioService.getPortfolioTotals.mockRejectedValue(error);

      await expect(controller.getPortfolioTotals('invalid-address', {})).rejects.toThrow(error);
    });
  });

  describe('getClaimables', () => {
    it('should return claimable tokens for a valid address', async () => {
      mockPortfolioService.getClaimables.mockResolvedValue(mockClaimables);

      const result = await controller.getClaimables(validAddress, {});

      expect(result).toBe(mockClaimables);
      expect(mockPortfolioService.getClaimables).toHaveBeenCalledWith(validAddress, {});
    });

    it('should pass query parameters correctly', async () => {
      mockPortfolioService.getClaimables.mockResolvedValue(mockClaimables);

      const queryParams = {
        chainIds: [8453],
      };

      await controller.getClaimables(validAddress, queryParams);

      expect(mockPortfolioService.getClaimables).toHaveBeenCalledWith(validAddress, queryParams);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
      mockPortfolioService.getClaimables.mockRejectedValue(error);

      await expect(controller.getClaimables('invalid-address', {})).rejects.toThrow(error);
    });
  });

  describe('getMetaTypeBreakdown', () => {
    it('should return meta type breakdown for a valid address', async () => {
      mockPortfolioService.getMetaTypeBreakdown.mockResolvedValue(mockMetaTypeBreakdown);

      const result = await controller.getMetaTypeBreakdown(validAddress, {});

      expect(result).toBe(mockMetaTypeBreakdown);
      expect(mockPortfolioService.getMetaTypeBreakdown).toHaveBeenCalledWith(validAddress, {});
    });

    it('should pass query parameters correctly', async () => {
      mockPortfolioService.getMetaTypeBreakdown.mockResolvedValue(mockMetaTypeBreakdown);

      const queryParams = {
        chainIds: [8453],
        first: 10,
      };

      await controller.getMetaTypeBreakdown(validAddress, queryParams);

      expect(mockPortfolioService.getMetaTypeBreakdown).toHaveBeenCalledWith(validAddress, queryParams);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
      mockPortfolioService.getMetaTypeBreakdown.mockRejectedValue(error);

      await expect(controller.getMetaTypeBreakdown('invalid-address', {})).rejects.toThrow(error);
    });
  });

  describe('getCompletePortfolio', () => {
    it('should return complete portfolio data for a valid address', async () => {
      // Mock all service methods
      mockPortfolioService.getTokenBalances.mockResolvedValue(mockTokenBalances);
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);
      mockPortfolioService.getNFTBalances.mockResolvedValue(mockNFTBalances);
      mockPortfolioService.getPortfolioTotals.mockResolvedValue(mockPortfolioTotals);
      mockPortfolioService.getClaimables.mockResolvedValue(mockClaimables);
      mockPortfolioService.getMetaTypeBreakdown.mockResolvedValue(mockMetaTypeBreakdown);

      const result = await controller.getCompletePortfolio(validAddress, {});

      expect(result).toEqual({
        tokens: mockTokenBalances,
        apps: mockAppBalances,
        nfts: mockNFTBalances,
        totals: mockPortfolioTotals,
        claimables: mockClaimables,
        breakdown: mockMetaTypeBreakdown,
      });

      // Verify all service methods were called in parallel
      expect(mockPortfolioService.getTokenBalances).toHaveBeenCalledWith(validAddress, {});
      expect(mockPortfolioService.getAppBalances).toHaveBeenCalledWith(validAddress, {});
      expect(mockPortfolioService.getNFTBalances).toHaveBeenCalledWith(validAddress, {});
      expect(mockPortfolioService.getPortfolioTotals).toHaveBeenCalledWith(validAddress, {});
      expect(mockPortfolioService.getClaimables).toHaveBeenCalledWith(validAddress, {});
      expect(mockPortfolioService.getMetaTypeBreakdown).toHaveBeenCalledWith(validAddress, {});
    });

    it('should pass query parameters to all service methods', async () => {
      mockPortfolioService.getTokenBalances.mockResolvedValue(mockTokenBalances);
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);
      mockPortfolioService.getNFTBalances.mockResolvedValue(mockNFTBalances);
      mockPortfolioService.getPortfolioTotals.mockResolvedValue(mockPortfolioTotals);
      mockPortfolioService.getClaimables.mockResolvedValue(mockClaimables);
      mockPortfolioService.getMetaTypeBreakdown.mockResolvedValue(mockMetaTypeBreakdown);

      const queryParams = {
        chainIds: [8453],
        first: 10,
        minBalanceUSD: 100,
      };

      await controller.getCompletePortfolio(validAddress, queryParams);

      expect(mockPortfolioService.getTokenBalances).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getAppBalances).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getNFTBalances).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getPortfolioTotals).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getClaimables).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getMetaTypeBreakdown).toHaveBeenCalledWith(validAddress, queryParams);
    });

    it('should propagate HttpExceptions from service methods', async () => {
      const error = new HttpException('Invalid address format', HttpStatus.BAD_REQUEST);
      mockPortfolioService.getTokenBalances.mockRejectedValue(error);
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);
      mockPortfolioService.getNFTBalances.mockResolvedValue(mockNFTBalances);
      mockPortfolioService.getPortfolioTotals.mockResolvedValue(mockPortfolioTotals);
      mockPortfolioService.getClaimables.mockResolvedValue(mockClaimables);
      mockPortfolioService.getMetaTypeBreakdown.mockResolvedValue(mockMetaTypeBreakdown);

      await expect(controller.getCompletePortfolio('invalid-address', {})).rejects.toThrow(error);
    });

    it('should handle non-HttpException errors and convert to internal server error', async () => {
      const error = new Error('Unexpected error');
      mockPortfolioService.getTokenBalances.mockRejectedValue(error);
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);
      mockPortfolioService.getNFTBalances.mockResolvedValue(mockNFTBalances);
      mockPortfolioService.getPortfolioTotals.mockResolvedValue(mockPortfolioTotals);
      mockPortfolioService.getClaimables.mockResolvedValue(mockClaimables);
      mockPortfolioService.getMetaTypeBreakdown.mockResolvedValue(mockMetaTypeBreakdown);

      await expect(controller.getCompletePortfolio(validAddress, {})).rejects.toThrow(
        new HttpException('Failed to fetch complete portfolio data', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    it('should handle partial failures in parallel execution', async () => {
      const error = new HttpException('Service temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
      mockPortfolioService.getTokenBalances.mockResolvedValue(mockTokenBalances);
      mockPortfolioService.getAppBalances.mockRejectedValue(error);
      mockPortfolioService.getNFTBalances.mockResolvedValue(mockNFTBalances);
      mockPortfolioService.getPortfolioTotals.mockResolvedValue(mockPortfolioTotals);
      mockPortfolioService.getClaimables.mockResolvedValue(mockClaimables);
      mockPortfolioService.getMetaTypeBreakdown.mockResolvedValue(mockMetaTypeBreakdown);

      await expect(controller.getCompletePortfolio(validAddress, {})).rejects.toThrow(error);
    });
  });

  describe('Error handling across all endpoints', () => {
    const endpoints = [
      { method: 'getTokenBalances', serviceMock: 'getTokenBalances' },
      { method: 'getAppBalances', serviceMock: 'getAppBalances' },
      { method: 'getNFTBalances', serviceMock: 'getNFTBalances' },
      { method: 'getPortfolioTotals', serviceMock: 'getPortfolioTotals' },
      { method: 'getClaimables', serviceMock: 'getClaimables' },
      { method: 'getMetaTypeBreakdown', serviceMock: 'getMetaTypeBreakdown' },
    ];

    endpoints.forEach(({ method, serviceMock }) => {
      it(`should handle service errors in ${method}`, async () => {
        const error = new HttpException('Service error', HttpStatus.INTERNAL_SERVER_ERROR);
        mockPortfolioService[serviceMock].mockRejectedValue(error);

        await expect(controller[method](validAddress, {})).rejects.toThrow(error);
      });
    });
  });

  describe('Parameter validation', () => {
    it('should accept valid query parameters across all endpoints', async () => {
      const queryParams = {
        chainIds: [1, 8453, 137],
        first: 50,
        minBalanceUSD: 1000,
      };

      // Mock successful responses for all services
      mockPortfolioService.getTokenBalances.mockResolvedValue(mockTokenBalances);
      mockPortfolioService.getAppBalances.mockResolvedValue(mockAppBalances);
      mockPortfolioService.getNFTBalances.mockResolvedValue(mockNFTBalances);
      mockPortfolioService.getPortfolioTotals.mockResolvedValue(mockPortfolioTotals);
      mockPortfolioService.getClaimables.mockResolvedValue(mockClaimables);
      mockPortfolioService.getMetaTypeBreakdown.mockResolvedValue(mockMetaTypeBreakdown);

      // Test all endpoints accept the query parameters
      await controller.getTokenBalances(validAddress, queryParams);
      await controller.getAppBalances(validAddress, queryParams);
      await controller.getNFTBalances(validAddress, queryParams);
      await controller.getPortfolioTotals(validAddress, queryParams);
      await controller.getClaimables(validAddress, queryParams);
      await controller.getMetaTypeBreakdown(validAddress, queryParams);

      // Verify parameters were passed correctly
      expect(mockPortfolioService.getTokenBalances).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getAppBalances).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getNFTBalances).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getPortfolioTotals).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getClaimables).toHaveBeenCalledWith(validAddress, queryParams);
      expect(mockPortfolioService.getMetaTypeBreakdown).toHaveBeenCalledWith(validAddress, queryParams);
    });

    it('should handle empty query parameters', async () => {
      mockPortfolioService.getTokenBalances.mockResolvedValue(mockTokenBalances);

      await controller.getTokenBalances(validAddress, {});

      expect(mockPortfolioService.getTokenBalances).toHaveBeenCalledWith(validAddress, {});
    });
  });
});
