import type { Position } from '../types';

export interface AggregatedAsset {
  symbol: string;
  name: string;
  assetType: string;
  totalQuantity: number;
  totalValueUsd: number;
  percentage: number;
  positionCount: number;
}

export interface AssetsByType {
  type: string;
  assets: AggregatedAsset[];
  totalValue: number;
  percentage: number;
}

export function aggregatePositionsByAsset(
  positions: Position[],
  totalValue: number
): AggregatedAsset[] {
  const assetMap = new Map<string, AggregatedAsset>();

  for (const position of positions) {
    const { symbol, name, asset_type } = position.asset;
    const existing = assetMap.get(symbol);

    if (existing) {
      existing.totalQuantity += position.quantity;
      existing.totalValueUsd += position.value_usd;
      existing.positionCount += 1;
    } else {
      assetMap.set(symbol, {
        symbol,
        name,
        assetType: asset_type,
        totalQuantity: position.quantity,
        totalValueUsd: position.value_usd,
        percentage: 0,
        positionCount: 1,
      });
    }
  }

  // Calculate percentages and convert to array
  const aggregated = Array.from(assetMap.values()).map((asset) => ({
    ...asset,
    percentage: totalValue > 0 ? (asset.totalValueUsd / totalValue) * 100 : 0,
  }));

  // Sort by value descending
  return aggregated.sort((a, b) => b.totalValueUsd - a.totalValueUsd);
}

export function groupAssetsByType(
  aggregatedAssets: AggregatedAsset[],
  totalPortfolioValue: number
): AssetsByType[] {
  const typeMap = new Map<string, AggregatedAsset[]>();

  for (const asset of aggregatedAssets) {
    const existing = typeMap.get(asset.assetType);
    if (existing) {
      existing.push(asset);
    } else {
      typeMap.set(asset.assetType, [asset]);
    }
  }

  // Convert to array and calculate type totals
  const grouped = Array.from(typeMap.entries()).map(([type, assets]) => {
    const totalValue = assets.reduce((sum, a) => sum + a.totalValueUsd, 0);
    return {
      type,
      assets: assets.sort((a, b) => b.totalValueUsd - a.totalValueUsd),
      totalValue,
      percentage: totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0,
    };
  });

  // Sort groups by total value descending
  return grouped.sort((a, b) => b.totalValue - a.totalValue);
}
