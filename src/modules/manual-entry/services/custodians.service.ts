import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module';
import {
  CreateCustodianDto,
  CustodiansListResponseDto,
  CreateCustodianResponseDto,
} from '../dto/custodians.dto';

@Injectable()
export class CustodiansService {
  private readonly logger = new Logger(CustodiansService.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async listCustodians(): Promise<CustodiansListResponseDto> {
    const sql = `
      SELECT
        c.id,
        c.name,
        c.type,
        c.description,
        c.wallet_address,
        COALESCE(SUM(p.quantity * COALESCE(ph.price_usd, 0)), 0) AS total_value_usd
      FROM custodians c
      LEFT JOIN positions p ON c.id = p.custodian_id AND p.quantity > 0
      LEFT JOIN assets a ON p.asset_id = a.id
      LEFT JOIN LATERAL (
        SELECT price_usd
        FROM price_history
        WHERE asset_id = a.id
        ORDER BY price_date DESC
        LIMIT 1
      ) ph ON p.asset_id IS NOT NULL
      GROUP BY c.id, c.name, c.type, c.description, c.wallet_address
      ORDER BY total_value_usd DESC
    `;

    const result = await this.pool.query(sql);
    return {
      custodians: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        description: row.description,
        wallet_address: row.wallet_address,
        total_value_usd: parseFloat(row.total_value_usd),
      })),
    };
  }

  async createCustodian(
    dto: CreateCustodianDto,
  ): Promise<CreateCustodianResponseDto> {
    const sql = `
      INSERT INTO custodians (name, type, description, wallet_address, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, name, type, description, wallet_address
    `;
    const result = await this.pool.query(sql, [
      dto.name,
      dto.type,
      dto.description || null,
      dto.wallet_address?.toLowerCase() || null,
    ]);
    const row = result.rows[0];

    this.logger.log(`Custodian created: name=${row.name}, id=${row.id}`);

    return {
      success: true,
      custodian: {
        id: row.id,
        name: row.name,
        type: row.type,
        description: row.description,
        wallet_address: row.wallet_address,
        total_value_usd: 0,
      },
    };
  }
}
