import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateCustodianDto {
  @ApiProperty({ description: 'Custodian name', example: 'Fidelity Account' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Custodian type',
    enum: [
      'hardware_wallet',
      'software_wallet',
      'broker',
      'exchange',
      'multisig_wallet',
      'hot_wallet',
      'bank',
      'cash',
    ],
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Wallet address (for blockchain wallets)',
  })
  @IsOptional()
  @IsString()
  wallet_address?: string;
}

export class CustodianDetailResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  wallet_address?: string;

  @ApiProperty()
  total_value_usd: number;
}

export class CustodiansListResponseDto {
  @ApiProperty({ type: [CustodianDetailResponseDto] })
  custodians: CustodianDetailResponseDto[];
}

export class CreateCustodianResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  custodian: CustodianDetailResponseDto;
}
