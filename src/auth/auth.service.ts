import {
  Injectable,
  UnauthorizedException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly passwordHash: string | undefined;
  private readonly accessExpirySeconds: number;
  private readonly refreshExpirySeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.passwordHash = this.configService.get<string>('AUTH_PASSWORD_HASH');
    // Default: 15 minutes for access token
    this.accessExpirySeconds = this.parseExpiry(
      this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
    );
    // Default: 7 days for refresh token
    this.refreshExpirySeconds = this.parseExpiry(
      this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
    );
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  onModuleInit() {
    if (!this.passwordHash) {
      this.logger.warn(
        'AUTH_PASSWORD_HASH not set - authentication is disabled. ' +
          'Set AUTH_PASSWORD_HASH in .env for production use.',
      );
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    // If no password hash is configured, allow any password (development mode)
    if (!this.passwordHash) {
      return true;
    }

    return bcrypt.compare(password, this.passwordHash);
  }

  async login(password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const isValid = await this.validatePassword(password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const accessToken = this.generateAccessToken();
    const refreshToken = this.generateRefreshToken();

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpirySeconds,
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const newAccessToken = this.generateAccessToken();
      const newRefreshToken = this.generateRefreshToken();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.accessExpirySeconds,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private generateAccessToken(): string {
    const payload: JwtPayload = {
      sub: 'user',
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.accessExpirySeconds,
    });
  }

  private generateRefreshToken(): string {
    const payload: JwtPayload = {
      sub: 'user',
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.refreshExpirySeconds,
    });
  }
}
