import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module';
import {
  ListTransactionsQueryDto,
  CreateTransactionDto,
  TransactionsListResponseDto,
  CreateTransactionResponseDto,
} from '../dto/transactions.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async listTransactions(
    query: ListTransactionsQueryDto,
  ): Promise<TransactionsListResponseDto> {
    const conditions: string[] = ['1=1'];
    const params: (number | string)[] = [];
    let paramIndex = 1;

    if (query.asset_id) {
      conditions.push(`t.asset_id = $${paramIndex++}`);
      params.push(query.asset_id);
    }
    if (query.custodian_id) {
      conditions.push(`t.custodian_id = $${paramIndex++}`);
      params.push(query.custodian_id);
    }
    if (query.from_date) {
      conditions.push(`t.transaction_date >= $${paramIndex++}`);
      params.push(query.from_date);
    }
    if (query.to_date) {
      conditions.push(`t.transaction_date <= $${paramIndex++}`);
      params.push(query.to_date);
    }

    const sql = `
      SELECT
        t.id,
        t.asset_id,
        a.symbol AS asset_symbol,
        t.custodian_id,
        c.name AS custodian_name,
        t.transaction_type,
        t.quantity,
        t.price_per_unit,
        t.total_value_usd,
        t.transaction_date,
        t.notes
      FROM transactions t
      JOIN assets a ON t.asset_id = a.id
      JOIN custodians c ON t.custodian_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `;

    const result = await this.pool.query(sql, params);
    return {
      transactions: result.rows.map((row) => ({
        id: row.id,
        asset_id: row.asset_id,
        asset_symbol: row.asset_symbol,
        custodian_id: row.custodian_id,
        custodian_name: row.custodian_name,
        transaction_type: row.transaction_type,
        quantity: parseFloat(row.quantity),
        price_per_unit: row.price_per_unit
          ? parseFloat(row.price_per_unit)
          : undefined,
        total_value_usd: row.total_value_usd
          ? parseFloat(row.total_value_usd)
          : undefined,
        transaction_date: row.transaction_date.toISOString().split('T')[0],
        notes: row.notes,
      })),
    };
  }

  async createTransaction(
    dto: CreateTransactionDto,
  ): Promise<CreateTransactionResponseDto> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Calculate total value
      const totalValueUsd = dto.price_per_unit
        ? dto.quantity * dto.price_per_unit
        : null;

      // Insert transaction
      const insertSql = `
        INSERT INTO transactions (
          asset_id, custodian_id, transaction_type, quantity,
          price_per_unit, total_value_usd, transaction_date, notes, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id, asset_id, custodian_id, transaction_type, quantity,
          price_per_unit, total_value_usd, transaction_date, notes
      `;
      const txResult = await client.query(insertSql, [
        dto.asset_id,
        dto.custodian_id,
        dto.transaction_type,
        dto.quantity,
        dto.price_per_unit || null,
        totalValueUsd,
        dto.transaction_date,
        dto.notes || null,
      ]);
      const txRow = txResult.rows[0];

      // Determine quantity delta for position update
      let quantityDelta = dto.quantity;
      if (['sell', 'transfer_out', 'withdrawal'].includes(dto.transaction_type)) {
        quantityDelta = -dto.quantity;
      }

      // Update position
      const positionSql = `
        INSERT INTO positions (asset_id, custodian_id, quantity, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (asset_id, custodian_id)
        DO UPDATE SET
          quantity = positions.quantity + $3,
          updated_at = NOW()
        RETURNING id, quantity
      `;
      const posResult = await client.query(positionSql, [
        dto.asset_id,
        dto.custodian_id,
        quantityDelta,
      ]);
      const posRow = posResult.rows[0];

      // Get asset symbol for response
      const assetResult = await client.query(
        'SELECT symbol FROM assets WHERE id = $1',
        [dto.asset_id],
      );
      const custodianResult = await client.query(
        'SELECT name FROM custodians WHERE id = $1',
        [dto.custodian_id],
      );

      await client.query('COMMIT');

      this.logger.log(
        `Transaction created: type=${dto.transaction_type}, asset_id=${dto.asset_id}, quantity=${dto.quantity}`,
      );

      return {
        success: true,
        transaction: {
          id: txRow.id,
          asset_id: txRow.asset_id,
          asset_symbol: assetResult.rows[0].symbol,
          custodian_id: txRow.custodian_id,
          custodian_name: custodianResult.rows[0].name,
          transaction_type: txRow.transaction_type,
          quantity: parseFloat(txRow.quantity),
          price_per_unit: txRow.price_per_unit
            ? parseFloat(txRow.price_per_unit)
            : undefined,
          total_value_usd: txRow.total_value_usd
            ? parseFloat(txRow.total_value_usd)
            : undefined,
          transaction_date: txRow.transaction_date.toISOString().split('T')[0],
          notes: txRow.notes,
        },
        updated_position: {
          id: posRow.id,
          quantity: parseFloat(posRow.quantity),
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
