import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const connectionString = configService.get<string>('DATABASE_URL');

        if (!connectionString) {
          logger.error(
            'DATABASE_URL environment variable is not set. Please add it to your .env file.',
          );
          throw new Error(
            'DATABASE_URL is required. Add it to your .env file: DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require',
          );
        }

        logger.log('Initializing PostgreSQL connection pool');

        return new Pool({
          connectionString,
          ssl: { rejectUnauthorized: false }, // Required for Neon.tech
          max: 10, // Maximum connections in pool
          idleTimeoutMillis: 30000, // Close idle connections after 30s
          connectionTimeoutMillis: 10000, // Timeout after 10s if can't connect
        });
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
