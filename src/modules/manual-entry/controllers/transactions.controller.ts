import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionsService } from '../services/transactions.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import {
  ListTransactionsQueryDto,
  CreateTransactionDto,
  TransactionsListResponseDto,
  CreateTransactionResponseDto,
} from '../dto/transactions.dto';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions' })
  @ApiResponse({ status: 200, type: TransactionsListResponseDto })
  async listTransactions(
    @Query() query: ListTransactionsQueryDto,
  ): Promise<TransactionsListResponseDto> {
    return this.transactionsService.listTransactions(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Log transaction',
    description: 'Creates transaction and updates position accordingly',
  })
  @ApiResponse({ status: 201, type: CreateTransactionResponseDto })
  async createTransaction(
    @Body() dto: CreateTransactionDto,
  ): Promise<CreateTransactionResponseDto> {
    return this.transactionsService.createTransaction(dto);
  }
}
