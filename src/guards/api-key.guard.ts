import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly expectedKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.expectedKey = this.configService.get<string>('SYNC_API_KEY');

    if (!this.expectedKey) {
      this.logger.warn(
        'SYNC_API_KEY not set - sync endpoint is unprotected. ' +
          'Set SYNC_API_KEY in .env for production use.',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // If no key configured, allow all requests (development mode)
    if (!this.expectedKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-api-key'];

    if (!providedKey) {
      throw new UnauthorizedException(
        'Missing API key. Provide x-api-key header.',
      );
    }

    if (providedKey !== this.expectedKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
