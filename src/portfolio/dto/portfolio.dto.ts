import { ApiProperty } from '@nestjs/swagger';

// Network DTOs
export class NetworkDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  slug?: string;

  @ApiProperty({ required: false })
  chainId?: number;

  @ApiProperty({ required: false })
  evmCompatible?: boolean;
}

// Token Balance DTOs
export class TokenBalanceDto {
  @ApiProperty()
  symbol: string;

  @ApiProperty()
  tokenAddress: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  balanceUSD: number;

  @ApiProperty()
  price: number;

  @ApiProperty({ required: false })
  imgUrlV2?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  network: NetworkDto;

  @ApiProperty({ required: false })
  decimals?: number;

  @ApiProperty({ required: false })
  balanceRaw?: string;
}

export class TokenBalancesDto {
  @ApiProperty()
  totalBalanceUSD: number;

  @ApiProperty({ type: [TokenBalanceDto] })
  byToken: TokenBalanceDto[];

  @ApiProperty()
  totalCount: number;
}

// App Balance DTOs
export class AppDto {
  @ApiProperty()
  displayName: string;

  @ApiProperty()
  imgUrl: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  category: {
    name: string;
  };
}

export class DisplayPropsDto {
  @ApiProperty()
  label: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty({ required: false })
  balanceDisplayMode?: string;
}

export class BaseTokenPositionBalanceDto {
  @ApiProperty()
  type: 'base-token';

  @ApiProperty()
  address: string;

  @ApiProperty()
  network: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  balanceUSD: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  decimals: number;
}

export class AppTokenPositionBalanceDto {
  @ApiProperty()
  type: 'app-token';

  @ApiProperty()
  address: string;

  @ApiProperty()
  network: string;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  decimals: number;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  balanceUSD: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  appId: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  groupLabel: string;

  @ApiProperty()
  supply: number;

  @ApiProperty({ type: [Number] })
  pricePerShare: number[];

  @ApiProperty({ type: [BaseTokenPositionBalanceDto], required: false })
  tokens?: BaseTokenPositionBalanceDto[];

  @ApiProperty({ required: false })
  displayProps?: DisplayPropsDto;
}

export class TokenWithMetaTypeDto {
  @ApiProperty({ enum: ['SUPPLIED', 'BORROWED', 'CLAIMABLE', 'VESTING', 'LOCKED'] })
  metaType: 'SUPPLIED' | 'BORROWED' | 'CLAIMABLE' | 'VESTING' | 'LOCKED';

  @ApiProperty()
  token: BaseTokenPositionBalanceDto | AppTokenPositionBalanceDto;
}

export class ContractPositionBalanceDto {
  @ApiProperty()
  type: 'contract-position';

  @ApiProperty()
  address: string;

  @ApiProperty()
  network: string;

  @ApiProperty()
  appId: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  groupLabel: string;

  @ApiProperty()
  balanceUSD: number;

  @ApiProperty({ type: [TokenWithMetaTypeDto] })
  tokens: TokenWithMetaTypeDto[];

  @ApiProperty({ required: false })
  displayProps?: DisplayPropsDto;
}

export class AppBalanceDto {
  @ApiProperty()
  balanceUSD: number;

  @ApiProperty()
  app: AppDto;

  @ApiProperty()
  network: NetworkDto;

  @ApiProperty({ type: [AppTokenPositionBalanceDto] })
  positionBalances: (AppTokenPositionBalanceDto | ContractPositionBalanceDto)[];
}

export class AppBalancesDto {
  @ApiProperty()
  totalBalanceUSD: number;

  @ApiProperty({ type: [AppBalanceDto] })
  byApp: AppBalanceDto[];
}

// NFT Balance DTOs
export class EstimatedValueDto {
  @ApiProperty()
  valueUsd: number;

  @ApiProperty()
  valueWithDenomination: number;

  @ApiProperty()
  denomination: {
    address: string;
    symbol: string;
    network: string;
  };
}

export class MediaDto {
  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  blurhash: string;

  @ApiProperty()
  height: number;

  @ApiProperty()
  width: number;

  @ApiProperty()
  originalUri: string;

  @ApiProperty()
  original: string;

  @ApiProperty()
  large: string;

  @ApiProperty()
  medium: string;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  predominantColor: string;
}

export class CollectionDto {
  @ApiProperty()
  network: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  deployer: string;

  @ApiProperty()
  deployedAt: number;

  @ApiProperty()
  owner: string;

  @ApiProperty()
  medias: {
    logo: MediaDto;
  };
}

export class NFTTokenDto {
  @ApiProperty()
  tokenId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  supply: string;

  @ApiProperty()
  circulatingSupply: string;

  @ApiProperty()
  estimatedValue: EstimatedValueDto;

  @ApiProperty()
  collection: CollectionDto;

  @ApiProperty()
  mediasV3: {
    images: {
      edges: Array<{ node: MediaDto }>;
    };
  };
}

export class NFTBalanceDto {
  @ApiProperty()
  lastReceived: number;

  @ApiProperty()
  token: NFTTokenDto;
}

export class NFTBalancesDto {
  @ApiProperty()
  totalBalanceUSD: number;

  @ApiProperty()
  totalTokensOwned: string;

  @ApiProperty({ type: [NFTBalanceDto] })
  byToken: NFTBalanceDto[];
}

// Portfolio Totals DTOs
export class NetworkBreakdownDto {
  @ApiProperty()
  network: NetworkDto;

  @ApiProperty()
  balanceUSD: number;
}

export class PortfolioTotalsDto {
  @ApiProperty()
  tokenBalances: {
    totalBalanceUSD: number;
    byNetwork: NetworkBreakdownDto[];
  };

  @ApiProperty()
  appBalances: {
    totalBalanceUSD: number;
    byNetwork: NetworkBreakdownDto[];
  };

  @ApiProperty()
  nftBalances: {
    totalBalanceUSD: number;
    byNetwork: NetworkBreakdownDto[];
  };

  @ApiProperty()
  totalPortfolioValue: number;
}

// Claimables DTOs
export class ClaimableTokenDto {
  @ApiProperty()
  app: AppDto;

  @ApiProperty()
  network: NetworkDto;

  @ApiProperty()
  address: string;

  @ApiProperty()
  balanceUSD: number;

  @ApiProperty({ type: [TokenWithMetaTypeDto] })
  claimableTokens: TokenWithMetaTypeDto[];

  @ApiProperty({ required: false })
  displayProps?: DisplayPropsDto;
}

export class ClaimablesDto {
  @ApiProperty()
  totalClaimableUSD: number;

  @ApiProperty({ type: [ClaimableTokenDto] })
  claimables: ClaimableTokenDto[];
}

// Request DTOs
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsInt, IsNumber, IsArray } from 'class-validator';

export class PortfolioQueryDto {
  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(v => parseInt(v.trim(), 10));
    }
    if (Array.isArray(value)) {
      return value.map(v => parseInt(v, 10));
    }
    return value;
  })
  chainIds?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  first?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minBalanceUSD?: number;
}

// Meta Type Breakdown DTOs
export class MetaTypeBreakdownDto {
  @ApiProperty({ enum: ['SUPPLIED', 'BORROWED', 'CLAIMABLE', 'VESTING', 'LOCKED', 'NFT', 'WALLET'] })
  metaType: string;

  @ApiProperty()
  positionCount: number;

  @ApiProperty()
  balanceUSD: number;
}

export class MetaTypeBreakdownsDto {
  @ApiProperty({ type: [MetaTypeBreakdownDto] })
  byMetaType: MetaTypeBreakdownDto[];

  @ApiProperty()
  totalCount: number;
} 