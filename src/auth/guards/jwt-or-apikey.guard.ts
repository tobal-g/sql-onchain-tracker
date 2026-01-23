import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Guard that accepts either JWT Bearer token OR x-api-key header.
 * Useful for endpoints that need to support both user authentication (JWT)
 * and automated/service authentication (API key).
 */
@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(JwtOrApiKeyGuard.name);
  private readonly isAuthRequired: boolean;
  private readonly apiKey: string | undefined;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    // Auth is required only if AUTH_PASSWORD_HASH is configured
    this.isAuthRequired =
      !!this.configService.get<string>('AUTH_PASSWORD_HASH');
    this.apiKey = this.configService.get<string>('SYNC_API_KEY');

    if (!this.isAuthRequired && !this.apiKey) {
      this.logger.warn(
        'Neither AUTH_PASSWORD_HASH nor SYNC_API_KEY is set - authentication is disabled.',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // If no auth configured at all, allow all requests (development mode)
    if (!this.isAuthRequired && !this.apiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Try API key first (for automated/service calls)
    const providedApiKey = request.headers['x-api-key'];
    if (providedApiKey && this.apiKey) {
      if (providedApiKey === this.apiKey) {
        return true;
      }
      // If API key provided but invalid, don't fall through to JWT
      throw new UnauthorizedException('Invalid API key');
    }

    // Try JWT Bearer token (for user calls)
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException(
          'Invalid authorization header format. Use: Bearer <token>',
        );
      }

      try {
        const payload = this.authService.verifyAccessToken(token);
        request.user = payload;
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    // No authentication provided
    if (this.apiKey && this.isAuthRequired) {
      throw new UnauthorizedException(
        'Authentication required. Provide x-api-key header or Bearer token.',
      );
    } else if (this.apiKey) {
      throw new UnauthorizedException(
        'Missing API key. Provide x-api-key header.',
      );
    } else {
      throw new UnauthorizedException(
        'Missing authorization header. Provide Bearer token.',
      );
    }
  }
}
