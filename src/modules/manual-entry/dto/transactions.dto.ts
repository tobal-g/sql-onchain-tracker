import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListTransactionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  asset_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  custodian_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to_date?: string;
}

export class CreateTransactionDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  asset_id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  custodian_id: number;

  @ApiProperty({
    enum: [
      'buy',
      'sell',
      'transfer_in',
      'transfer_out',
      'deposit',
      'withdrawal',
    ],
  })
  @IsString()
  transaction_type: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price_per_unit?: number;

  @ApiProperty()
  @IsDateString()
  transaction_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  asset_id: number;

  @ApiProperty()
  asset_symbol: string;

  @ApiProperty()
  custodian_id: number;

  @ApiProperty()
  custodian_name: string;

  @ApiProperty()
  transaction_type: string;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional()
  price_per_unit?: number;

  @ApiPropertyOptional()
  total_value_usd?: number;

  @ApiProperty()
  transaction_date: string;

  @ApiPropertyOptional()
  notes?: string;
}

export class TransactionsListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  transactions: TransactionResponseDto[];
}

export class CreateTransactionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  transaction: TransactionResponseDto;

  @ApiProperty()
  updated_position: { id: number; quantity: number };
}
