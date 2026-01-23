import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module';
import {
  ListPositionsQueryDto,
  UpsertPositionDto,
  QuickCashUpdateDto,
  PositionsListResponseDto,
  UpsertPositionResponseDto,
  DeletePositionResponseDto,
} from '../dto/positions.dto';

@Injectable()
export class PositionsService {
  private readonly logger = new Logger(PositionsService.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async listPositions(
    query: ListPositionsQueryDto,
  ): Promise<PositionsListResponseDto> {
    const conditions: string[] = ['p.quantity > 0'];
    const params: (number | string)[] = [];
    let paramIndex = 1;

    if (query.custodian_id) {
      conditions.push(`c.id = $${paramIndex++}`);
      params.push(query.custodian_id);
    }
    if (query.asset_type_id) {
      conditions.push(`a.asset_type_id = $${paramIndex++}`);
      params.push(query.asset_type_id);
    }

    const sql = `
      SELECT
        p.id AS position_id,
        a.id AS asset_id,
        a.symbol,
        a.name AS asset_name,
        at.name AS asset_type,
        c.id AS custodian_id,
        c.name AS custodian_name,
        c.type AS custodian_type,
        p.quantity,
        COALESCE(ph.price_usd, 0) AS current_price,
        p.quantity * COALESCE(ph.price_usd, 0) AS value_usd,
        p.updated_at
      FROM positions p
      JOIN assets a ON p.asset_id = a.id
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN custodians c ON p.custodian_id = c.id
      LEFT JOIN LATERAL (
        SELECT price_usd
        FROM price_history
        WHERE asset_id = a.id
        ORDER BY price_date DESC
        LIMIT 1
      ) ph ON true
      WHERE ${conditions.join(' AND ')}
      ORDER BY value_usd DESC
    `;

    const result = await this.pool.query(sql, params);
    const positions = result.rows.map((row) => ({
      id: row.position_id,
      asset: {
        id: row.asset_id,
        symbol: row.symbol,
        name: row.asset_name,
        asset_type: row.asset_type,
      },
      custodian: {
        id: row.custodian_id,
        name: row.custodian_name,
        type: row.custodian_type,
      },
      quantity: parseFloat(row.quantity),
      current_price: parseFloat(row.current_price),
      value_usd: parseFloat(row.value_usd),
      updated_at: row.updated_at.toISOString(),
    }));

    const total_value_usd = positions.reduce((sum, p) => sum + p.value_usd, 0);

    return { positions, total_value_usd };
  }

  async upsertPosition(
    dto: UpsertPositionDto,
  ): Promise<UpsertPositionResponseDto> {
    // Resolve asset_id
    let assetId = dto.asset_id;
    if (!assetId && dto.asset_symbol) {
      const assetResult = await this.pool.query(
        'SELECT id FROM assets WHERE LOWER(symbol) = LOWER($1)',
        [dto.asset_symbol],
      );
      if (assetResult.rows.length === 0) {
        throw new BadRequestException(
          `Asset with symbol "${dto.asset_symbol}" not found`,
        );
      }
      assetId = assetResult.rows[0].id;
    }
    if (!assetId) {
      throw new BadRequestException(
        'Either asset_id or asset_symbol is required',
      );
    }

    // Resolve custodian_id
    let custodianId = dto.custodian_id;
    if (!custodianId && dto.custodian_name) {
      const custodianResult = await this.pool.query(
        'SELECT id FROM custodians WHERE LOWER(name) = LOWER($1)',
        [dto.custodian_name],
      );
      if (custodianResult.rows.length === 0) {
        throw new BadRequestException(
          `Custodian with name "${dto.custodian_name}" not found`,
        );
      }
      custodianId = custodianResult.rows[0].id;
    }
    if (!custodianId) {
      throw new BadRequestException(
        'Either custodian_id or custodian_name is required',
      );
    }

    // Check if position exists
    const existingResult = await this.pool.query(
      'SELECT id FROM positions WHERE asset_id = $1 AND custodian_id = $2',
      [assetId, custodianId],
    );
    const isUpdate = existingResult.rows.length > 0;

    // Upsert position
    const upsertSql = `
      INSERT INTO positions (asset_id, custodian_id, quantity, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (asset_id, custodian_id)
      DO UPDATE SET quantity = $3, updated_at = NOW()
      RETURNING id, asset_id, custodian_id, quantity, updated_at
    `;
    const result = await this.pool.query(upsertSql, [
      assetId,
      custodianId,
      dto.quantity,
    ]);
    const row = result.rows[0];

    this.logger.log(
      `Position ${isUpdate ? 'updated' : 'created'}: asset_id=${assetId}, custodian_id=${custodianId}, quantity=${dto.quantity}`,
    );

    return {
      success: true,
      position: {
        id: row.id,
        asset_id: row.asset_id,
        custodian_id: row.custodian_id,
        quantity: parseFloat(row.quantity),
        updated_at: row.updated_at.toISOString(),
      },
      action: isUpdate ? 'updated' : 'created',
    };
  }

  async deletePosition(id: number): Promise<DeletePositionResponseDto> {
    const result = await this.pool.query(
      'DELETE FROM positions WHERE id = $1 RETURNING id',
      [id],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Position with id ${id} not found`);
    }
    this.logger.log(`Position deleted: id=${id}`);
    return { success: true, deleted_id: id };
  }

  async quickCashUpdate(
    dto: QuickCashUpdateDto,
  ): Promise<UpsertPositionResponseDto> {
    // Find or validate the cash asset
    const assetResult = await this.pool.query(
      'SELECT id FROM assets WHERE LOWER(symbol) = LOWER($1)',
      [dto.currency],
    );
    if (assetResult.rows.length === 0) {
      throw new BadRequestException(
        `Currency "${dto.currency}" not found in assets. Please create it first.`,
      );
    }
    const assetId = assetResult.rows[0].id;

    // Verify custodian exists
    const custodianResult = await this.pool.query(
      'SELECT id FROM custodians WHERE id = $1',
      [dto.custodian_id],
    );
    if (custodianResult.rows.length === 0) {
      throw new BadRequestException(
        `Custodian with id ${dto.custodian_id} not found`,
      );
    }

    return this.upsertPosition({
      asset_id: assetId,
      custodian_id: dto.custodian_id,
      quantity: dto.amount,
    });
  }

  /**
   * Gets asset IDs for positions owned by a custodian where
   * the asset uses Zapper as the price source.
   * Used by sync to identify which positions to zero if not found in Zapper response.
   */
  async getZapperAssetIdsForCustodian(
    custodianId: number,
  ): Promise<Set<number>> {
    const query = `
      SELECT p.asset_id
      FROM positions p
      JOIN assets a ON p.asset_id = a.id
      WHERE p.custodian_id = $1
        AND a.price_api_source = 'zapper'
        AND p.quantity > 0
    `;
    const result = await this.pool.query(query, [custodianId]);
    return new Set(result.rows.map((row) => row.asset_id));
  }

  /**
   * Gets asset IDs for positions owned by a custodian where
   * the asset uses Zerion as the price source.
   * Used by sync to identify which positions to zero if not found in Zerion response.
   */
  async getZerionAssetIdsForCustodian(
    custodianId: number,
  ): Promise<Set<number>> {
    const query = `
      SELECT p.asset_id
      FROM positions p
      JOIN assets a ON p.asset_id = a.id
      WHERE p.custodian_id = $1
        AND a.price_api_source = 'zerion'
        AND p.quantity > 0
    `;
    const result = await this.pool.query(query, [custodianId]);
    return new Set(result.rows.map((row) => row.asset_id));
  }
}
