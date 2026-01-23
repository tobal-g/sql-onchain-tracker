import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  LoginResponseDto,
  RefreshResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { accessToken, refreshToken, expiresIn } =
      await this.authService.login(dto.password);

    // Set refresh token as httpOnly cookie
    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken, expiresIn };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    } = await this.authService.refresh(refreshToken);

    // Rotate refresh token
    this.setRefreshTokenCookie(res, newRefreshToken);

    return { accessToken, expiresIn };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear tokens' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    // Clear the refresh token cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
    });

    return { success: true, message: 'Logged out successfully' };
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  }
}
