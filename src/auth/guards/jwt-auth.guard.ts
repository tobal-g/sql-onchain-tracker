import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly isAuthRequired: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    // Auth is required only if AUTH_PASSWORD_HASH is configured
    this.isAuthRequired = !!this.configService.get<string>('AUTH_PASSWORD_HASH');

    if (!this.isAuthRequired) {
      this.logger.warn(
        'AUTH_PASSWORD_HASH not set - JWT authentication is disabled. ' +
          'All requests will be allowed.',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // If no auth configured, allow all requests (development mode)
    if (!this.isAuthRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'Missing authorization header. Provide Bearer token.',
      );
    }

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
}
