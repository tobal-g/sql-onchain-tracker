import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module';
import {
  PnlQueryDto,
  PnlResponseDto,
  PnlPositionDto,
  PnlSummaryDto,
  CostBasisDto,
  UnrealizedPnlDto,
  RealizedPnlDto,
  PerformanceDto,
} from '../dto/pnl.dto';

interface RawAssetRow {
  asset_id: number;
  symbol: string;
  asset_name: string;
  asset_type: string;
  current_quantity: string;
  current_price_usd: string;
  total_qty_bought: string | null;
  total_qty_sold: string | null;
  total_cost_usd: string | null;
  total_proceeds_usd: string | null;
  first_buy_date: Date | null;
  avg_cost_per_unit: string | null;
}

@Injectable()
export class PnlService {
  private readonly logger = new Logger(PnlService.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getPnl(query: PnlQueryDto): Promise<PnlResponseDto> {
    const rows = await this.fetchAssetsWithCostBasis(query);
    const positions = rows.map((row) => this.buildPositionDto(row));
    const summary = this.calculateSummary(positions);

    return {
      summary,
      positions,
      generated_at: new Date().toISOString(),
    };
  }

  private async fetchAssetsWithCostBasis(
    query: PnlQueryDto,
  ): Promise<RawAssetRow[]> {
    // Aggregate positions by asset (sum quantity across all custodians)
    const sql = `
      WITH cost_basis AS (
        SELECT
          t.asset_id,
          SUM(CASE WHEN t.transaction_type = 'buy' THEN t.quantity ELSE 0 END) AS total_qty_bought,
          SUM(CASE WHEN t.transaction_type = 'buy' THEN COALESCE(t.total_value_usd, 0) ELSE 0 END) AS total_cost_usd,
          SUM(CASE WHEN t.transaction_type = 'sell' THEN t.quantity ELSE 0 END) AS total_qty_sold,
          SUM(CASE WHEN t.transaction_type = 'sell' THEN COALESCE(t.total_value_usd, 0) ELSE 0 END) AS total_proceeds_usd,
          MIN(CASE WHEN t.transaction_type = 'buy' THEN t.transaction_date END) AS first_buy_date
        FROM transactions t
        GROUP BY t.asset_id
      ),
      aggregated_positions AS (
        SELECT
          a.id AS asset_id,
          a.symbol,
          a.name AS asset_name,
          at.name AS asset_type,
          SUM(p.quantity) AS total_quantity
        FROM positions p
        JOIN assets a ON p.asset_id = a.id
        JOIN asset_types at ON a.asset_type_id = at.id
        WHERE p.quantity > 0 OR $2::boolean = true
        GROUP BY a.id, a.symbol, a.name, at.name
      )
      SELECT
        ap.asset_id,
        ap.symbol,
        ap.asset_name,
        ap.asset_type,
        ap.total_quantity AS current_quantity,
        COALESCE(ph.price_usd, 0) AS current_price_usd,
        cb.total_qty_bought,
        cb.total_qty_sold,
        cb.total_cost_usd,
        cb.total_proceeds_usd,
        cb.first_buy_date,
        CASE WHEN cb.total_qty_bought > 0
             THEN cb.total_cost_usd / cb.total_qty_bought
             ELSE NULL END AS avg_cost_per_unit
      FROM aggregated_positions ap
      LEFT JOIN LATERAL (
        SELECT price_usd FROM price_history
        WHERE asset_id = ap.asset_id ORDER BY price_date DESC LIMIT 1
      ) ph ON true
      LEFT JOIN cost_basis cb ON cb.asset_id = ap.asset_id
      WHERE ($1::int IS NULL OR ap.asset_id = $1)
        AND ($2::boolean = true OR ap.total_quantity > 0)
      ORDER BY ap.total_quantity * COALESCE(ph.price_usd, 0) DESC
    `;

    const result = await this.pool.query<RawAssetRow>(sql, [
      query.asset_id ?? null,
      query.include_zero_positions ?? false,
    ]);

    return result.rows;
  }

  private buildPositionDto(row: RawAssetRow): PnlPositionDto {
    const currentQuantity = parseFloat(row.current_quantity);
    const currentPriceUsd = parseFloat(row.current_price_usd);
    const currentValueUsd = currentQuantity * currentPriceUsd;

    const hasCostBasis =
      row.total_qty_bought !== null && parseFloat(row.total_qty_bought) > 0;

    let costBasis: CostBasisDto | null = null;
    let unrealizedPnl: UnrealizedPnlDto | null = null;
    let realizedPnl: RealizedPnlDto | null = null;
    let performance: PerformanceDto | null = null;

    if (hasCostBasis) {
      const avgCostPerUnit = parseFloat(row.avg_cost_per_unit!);
      const totalCostUsd = parseFloat(row.total_cost_usd!);
      const totalQtyBought = parseFloat(row.total_qty_bought!);
      const totalQtySold = parseFloat(row.total_qty_sold || '0');
      const totalProceedsUsd = parseFloat(row.total_proceeds_usd || '0');

      costBasis = {
        total_cost_usd: totalCostUsd,
        avg_cost_per_unit: avgCostPerUnit,
        total_qty_bought: totalQtyBought,
      };

      // Calculate unrealized P&L
      const costBasisUsd = currentQuantity * avgCostPerUnit;
      unrealizedPnl = this.calculateUnrealizedPnl(
        currentValueUsd,
        costBasisUsd,
      );

      // Calculate realized P&L
      realizedPnl = this.calculateRealizedPnl(
        totalQtySold,
        totalProceedsUsd,
        avgCostPerUnit,
      );

      // Calculate performance
      performance = this.calculatePerformance(
        currentValueUsd,
        costBasisUsd,
        row.first_buy_date,
      );
    }

    return {
      asset_id: row.asset_id,
      symbol: row.symbol,
      asset_name: row.asset_name,
      asset_type: row.asset_type,
      current_quantity: currentQuantity,
      current_price_usd: currentPriceUsd,
      current_value_usd: currentValueUsd,
      has_cost_basis: hasCostBasis,
      cost_basis: costBasis,
      unrealized_pnl: unrealizedPnl,
      realized_pnl: realizedPnl,
      performance,
    };
  }

  private calculateUnrealizedPnl(
    currentValue: number,
    costBasis: number,
  ): UnrealizedPnlDto {
    const amountUsd = currentValue - costBasis;
    const percent = costBasis > 0 ? (amountUsd / costBasis) * 100 : null;

    return {
      amount_usd: amountUsd,
      percent: percent !== null ? Math.round(percent * 100) / 100 : null,
    };
  }

  private calculateRealizedPnl(
    totalQtySold: number,
    totalProceedsUsd: number,
    avgCostPerUnit: number,
  ): RealizedPnlDto {
    const costOfSoldUnits = totalQtySold * avgCostPerUnit;
    const amountUsd = totalProceedsUsd - costOfSoldUnits;

    return {
      amount_usd: amountUsd,
      total_qty_sold: totalQtySold,
      total_proceeds_usd: totalProceedsUsd,
    };
  }

  private calculatePerformance(
    currentValue: number,
    costBasis: number,
    firstBuyDate: Date | null,
  ): PerformanceDto {
    if (!firstBuyDate || costBasis <= 0) {
      return {
        apy: null,
        holding_days: null,
        first_buy_date: null,
      };
    }

    const today = new Date();
    const holdingDays = Math.floor(
      (today.getTime() - firstBuyDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    let apy: number | null = null;
    if (holdingDays >= 1 && currentValue > 0 && costBasis > 0) {
      // APY = ((current_value / cost_basis) ^ (365 / holding_days)) - 1
      const ratio = currentValue / costBasis;
      apy = (Math.pow(ratio, 365 / holdingDays) - 1) * 100;
      apy = Math.round(apy * 100) / 100;
    }

    return {
      apy,
      holding_days: holdingDays,
      first_buy_date: firstBuyDate.toISOString().split('T')[0],
    };
  }

  private calculateSummary(positions: PnlPositionDto[]): PnlSummaryDto {
    let totalCostBasisUsd = 0;
    let totalCurrentValueUsd = 0;
    let totalUnrealizedPnlUsd = 0;
    let totalRealizedPnlUsd = 0;
    let positionsWithCostBasis = 0;
    let positionsWithoutCostBasis = 0;

    for (const pos of positions) {
      totalCurrentValueUsd += pos.current_value_usd;

      if (pos.has_cost_basis && pos.cost_basis && pos.unrealized_pnl) {
        const costBasisForPosition =
          pos.current_quantity * pos.cost_basis.avg_cost_per_unit;
        totalCostBasisUsd += costBasisForPosition;
        totalUnrealizedPnlUsd += pos.unrealized_pnl.amount_usd;
        positionsWithCostBasis++;

        if (pos.realized_pnl) {
          totalRealizedPnlUsd += pos.realized_pnl.amount_usd;
        }
      } else {
        positionsWithoutCostBasis++;
      }
    }

    const totalUnrealizedPnlPercent =
      totalCostBasisUsd > 0
        ? Math.round((totalUnrealizedPnlUsd / totalCostBasisUsd) * 10000) / 100
        : null;

    return {
      total_cost_basis_usd: Math.round(totalCostBasisUsd * 100) / 100,
      total_current_value_usd: Math.round(totalCurrentValueUsd * 100) / 100,
      total_unrealized_pnl_usd: Math.round(totalUnrealizedPnlUsd * 100) / 100,
      total_unrealized_pnl_percent: totalUnrealizedPnlPercent,
      total_realized_pnl_usd: Math.round(totalRealizedPnlUsd * 100) / 100,
      positions_with_cost_basis: positionsWithCostBasis,
      positions_without_cost_basis: positionsWithoutCostBasis,
    };
  }
}
