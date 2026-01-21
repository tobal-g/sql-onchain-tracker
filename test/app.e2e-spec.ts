import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

describe('Sync Endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let apiKey: string | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get the API key from config if set
    const configService = app.get(ConfigService);
    apiKey = configService.get<string>('SYNC_API_KEY');
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /sync/portfolio', () => {
    it('should sync portfolio and return summary', async () => {
      const req = request(app.getHttpServer()).post('/sync/portfolio');

      // Add API key header if configured
      if (apiKey) {
        req.set('x-api-key', apiKey);
      }

      const response = await req.expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('syncedAt');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('walletsProcessed');
      expect(response.body.summary).toHaveProperty('positionsUpdated');
      expect(response.body.summary).toHaveProperty('pricesUpdated');
      expect(response.body.summary).toHaveProperty('errors');
    }, 60000); // 60 second timeout for real API calls
  });

  describe('POST /sync/prices/stocks', () => {
    it('should sync stock prices and return summary', async () => {
      const req = request(app.getHttpServer()).post('/sync/prices/stocks');

      // Add API key header if configured
      if (apiKey) {
        req.set('x-api-key', apiKey);
      }

      const response = await req.expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('syncedAt');
      expect(response.body).toHaveProperty('cclRate');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('assetsProcessed');
      expect(response.body.summary).toHaveProperty('pricesUpdated');
    }, 60000); // 60 second timeout for real API calls
  });
});
