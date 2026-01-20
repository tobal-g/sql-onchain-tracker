import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module';
import { PortfolioSummaryResponseDto } from '../dto/portfolio-summary.dto';

@Injectable()
export class PortfolioSummaryService {
  private readonly logger = new Logger(PortfolioSummaryService.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getPortfolioSummary(): Promise<PortfolioSummaryResponseDto> {
    // Get breakdown by asset type
    const byTypeSql = `
      SELECT
        at.name AS asset_type,
        SUM(p.quantity * COALESCE(ph.price_usd, 0)) AS value_usd
      FROM positions p
      JOIN assets a ON p.asset_id = a.id
      JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN LATERAL (
        SELECT price_usd
        FROM price_history
        WHERE asset_id = a.id
        ORDER BY price_date DESC
        LIMIT 1
      ) ph ON true
      WHERE p.quantity > 0
      GROUP BY at.name
      ORDER BY value_usd DESC
    `;
    const byTypeResult = await this.pool.query(byTypeSql);

    // Get breakdown by custodian
    const byCustodianSql = `
      SELECT
        c.name AS custodian_name,
        SUM(p.quantity * COALESCE(ph.price_usd, 0)) AS value_usd
      FROM positions p
      JOIN custodians c ON p.custodian_id = c.id
      JOIN assets a ON p.asset_id = a.id
      LEFT JOIN LATERAL (
        SELECT price_usd
        FROM price_history
        WHERE asset_id = a.id
        ORDER BY price_date DESC
        LIMIT 1
      ) ph ON true
      WHERE p.quantity > 0
      GROUP BY c.id, c.name
      HAVING SUM(p.quantity * COALESCE(ph.price_usd, 0)) > 0
      ORDER BY value_usd DESC
    `;
    const byCustodianResult = await this.pool.query(byCustodianSql);

    // Get top holdings
    const topHoldingsSql = `
      SELECT
        a.symbol,
        SUM(p.quantity * COALESCE(ph.price_usd, 0)) AS value_usd
      FROM positions p
      JOIN assets a ON p.asset_id = a.id
      LEFT JOIN LATERAL (
        SELECT price_usd
        FROM price_history
        WHERE asset_id = a.id
        ORDER BY price_date DESC
        LIMIT 1
      ) ph ON true
      WHERE p.quantity > 0
      GROUP BY a.id, a.symbol
      HAVING SUM(p.quantity * COALESCE(ph.price_usd, 0)) > 0
      ORDER BY value_usd DESC
      LIMIT 10
    `;
    const topHoldingsResult = await this.pool.query(topHoldingsSql);

    // Calculate total and percentages
    const totalValueUsd = byTypeResult.rows.reduce(
      (sum, row) => sum + parseFloat(row.value_usd || 0),
      0,
    );

    const byAssetType = byTypeResult.rows.map((row) => ({
      type: row.asset_type,
      value_usd: parseFloat(row.value_usd),
      percentage:
        totalValueUsd > 0
          ? Math.round((parseFloat(row.value_usd) / totalValueUsd) * 1000) / 10
          : 0,
    }));

    const byCustodian = byCustodianResult.rows.map((row) => ({
      name: row.custodian_name,
      value_usd: parseFloat(row.value_usd),
      percentage:
        totalValueUsd > 0
          ? Math.round((parseFloat(row.value_usd) / totalValueUsd) * 1000) / 10
          : 0,
    }));

    const topHoldings = topHoldingsResult.rows.map((row) => ({
      symbol: row.symbol,
      value_usd: parseFloat(row.value_usd),
      percentage:
        totalValueUsd > 0
          ? Math.round((parseFloat(row.value_usd) / totalValueUsd) * 1000) / 10
          : 0,
    }));

    return {
      total_value_usd: totalValueUsd,
      by_asset_type: byAssetType,
      by_custodian: byCustodian,
      top_holdings: topHoldings,
      last_updated: new Date().toISOString(),
    };
  }
}
