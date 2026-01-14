import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [PortfolioModule], // Import to access PortfolioService
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
