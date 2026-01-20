import {
  Injectable,
  Inject,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module';
import {
  ListAssetsQueryDto,
  CreateAssetDto,
  AssetsListResponseDto,
  CreateAssetResponseDto,
} from '../dto/assets.dto';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async listAssets(query: ListAssetsQueryDto): Promise<AssetsListResponseDto> {
    const conditions: string[] = ['1=1'];
    const params: (number | string)[] = [];
    let paramIndex = 1;

    if (query.asset_type_id) {
      conditions.push(`a.asset_type_id = $${paramIndex++}`);
      params.push(query.asset_type_id);
    }
    if (query.price_api_source) {
      conditions.push(`a.price_api_source = $${paramIndex++}`);
      params.push(query.price_api_source);
    }

    const sql = `
      SELECT
        a.id,
        a.symbol,
        a.name,
        at.id AS asset_type_id,
        at.name AS asset_type_name,
        a.price_api_source,
        a.api_identifier,
        ph.price_usd AS current_price,
        ph.price_date
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN LATERAL (
        SELECT price_usd, price_date
        FROM price_history
        WHERE asset_id = a.id
        ORDER BY price_date DESC
        LIMIT 1
      ) ph ON true
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.symbol
    `;

    const result = await this.pool.query(sql, params);
    return {
      assets: result.rows.map((row) => ({
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        asset_type: {
          id: row.asset_type_id,
          name: row.asset_type_name,
        },
        price_api_source: row.price_api_source,
        api_identifier: row.api_identifier,
        current_price: row.current_price
          ? parseFloat(row.current_price)
          : undefined,
        price_as_of: row.price_date
          ? row.price_date.toISOString().split('T')[0]
          : undefined,
      })),
    };
  }

  async createAsset(dto: CreateAssetDto): Promise<CreateAssetResponseDto> {
    try {
      const sql = `
        INSERT INTO assets (symbol, name, asset_type_id, price_api_source, api_identifier, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, symbol, name, asset_type_id, price_api_source, api_identifier, created_at
      `;
      const result = await this.pool.query(sql, [
        dto.symbol.toUpperCase(),
        dto.name,
        dto.asset_type_id,
        dto.price_api_source || null,
        dto.api_identifier || null,
      ]);
      const row = result.rows[0];

      // Get asset type name
      const typeResult = await this.pool.query(
        'SELECT name FROM asset_types WHERE id = $1',
        [row.asset_type_id],
      );

      this.logger.log(`Asset created: symbol=${row.symbol}, id=${row.id}`);

      return {
        success: true,
        asset: {
          id: row.id,
          symbol: row.symbol,
          name: row.name,
          asset_type: {
            id: row.asset_type_id,
            name: typeResult.rows[0]?.name,
          },
          price_api_source: row.price_api_source,
          api_identifier: row.api_identifier,
        },
      };
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          `Asset with symbol "${dto.symbol}" already exists`,
        );
      }
      throw error;
    }
  }
}
