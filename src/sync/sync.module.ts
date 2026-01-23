import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ManualEntryModule } from '../modules/manual-entry/manual-entry.module';
import { ZerionModule } from '../modules/zerion/zerion.module';

@Module({
  imports: [PortfolioModule, ManualEntryModule, ZerionModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
