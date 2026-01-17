import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PortfolioModule } from './portfolio/portfolio.module';
import { DatabaseModule } from './database/database.module';
import { SyncModule } from './sync/sync.module';
import { YahooFinanceModule } from './modules/yahoo-finance/yahoo-finance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    PortfolioModule,
    SyncModule,
    YahooFinanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
