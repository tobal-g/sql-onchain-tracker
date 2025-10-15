import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: false,
    }),
    CacheModule.register({
      ttl: 90000, // 90 seconds default
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
