import { Module } from '@nestjs/common';
import { PositionsController } from './controllers/positions.controller';
import { PositionsService } from './services/positions.service';
import { AssetsController } from './controllers/assets.controller';
import { AssetsService } from './services/assets.service';
import { CustodiansController } from './controllers/custodians.controller';
import { CustodiansService } from './services/custodians.service';
import { AssetTypesController } from './controllers/asset-types.controller';
import { AssetTypesService } from './services/asset-types.service';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { PortfolioSummaryController } from './controllers/portfolio-summary.controller';
import { PortfolioSummaryService } from './services/portfolio-summary.service';

@Module({
  controllers: [
    PositionsController,
    AssetsController,
    CustodiansController,
    AssetTypesController,
    TransactionsController,
    PortfolioSummaryController,
  ],
  providers: [
    PositionsService,
    AssetsService,
    CustodiansService,
    AssetTypesService,
    TransactionsService,
    PortfolioSummaryService,
  ],
  exports: [
    PositionsService,
    AssetsService,
    CustodiansService,
    PortfolioSummaryService,
  ],
})
export class ManualEntryModule {}
