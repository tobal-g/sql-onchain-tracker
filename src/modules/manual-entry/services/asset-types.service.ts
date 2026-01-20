import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module';
import { AssetTypesListResponseDto } from '../dto/asset-types.dto';

@Injectable()
export class AssetTypesService {
  private readonly logger = new Logger(AssetTypesService.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async listAssetTypes(): Promise<AssetTypesListResponseDto> {
    const sql = 'SELECT id, name, description FROM asset_types ORDER BY id';
    const result = await this.pool.query(sql);
    return {
      asset_types: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
      })),
    };
  }
}
