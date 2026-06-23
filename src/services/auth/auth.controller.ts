import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ForgetPasswordDto, ResetPasswordDto, SignInDto, SignUpDto } from 'src/services/auth/dto/auth.dto';
import { Request, Response } from 'express';
import { IAuth } from 'src/domain/interface/auth.interface';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { DbUser } from 'src/shared/types/db-user.types';
import { ApiStandardResponse, ApiCommonErrors } from 'src/shared/decorators/swagger.decorator';
import { UserDto } from '../user/dto/user.dto';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user';
import { AuthUser } from 'src/shared/types/token-payload.types';
import { GoogleAuthDto } from './dto/google-auth.dto';

class AuthResponseDto {
  // Empty class for standard responses if no specific DTO exists
}

class TokenResponseDto {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
}

class SignUpResponseDto extends TokenResponseDto {
  user: UserDto;
}

@ApiTags('Auth')
@ApiCommonErrors()
@Controller('auth')
export class AuthController implements IAuth {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get current authenticated user',
    description: 'Returns the authenticated user profile from the current session (cookie or bearer token).',
  })
  @ApiStandardResponse(UserDto, 200, 'Authenticated user retrieved')
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.id);
  }

  @Post('signup')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account and sends a verification email OTP.',
  })
  @ApiStandardResponse(SignUpResponseDto, 201, 'User registered successfully')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    data: {
      user: Omit<DbUser, 'password'>;
      accessToken: string;
      tokenType: string;
      expiresAt: Date;
    };
  }> {
    return this.authService.signUp(signUpDto, response);
  }

  @Post('signin')
  @ApiOperation({
    summary: 'Login to account',
    description:
      'Authenticates user and returns access tokens. Also sets HttpOnly cookies for session management.',
  })
  @ApiStandardResponse(TokenResponseDto, 200, 'Login successful')
  async signIn(@Body() signInDto: SignInDto, @Res() res: Response): Promise<Response> {
    return this.authService.signIn(signInDto, res);
  }

  @Post('google')
  @ApiOperation({
    summary: 'Sign in with Google',
    description: 'Verifies a Google ID token, creates or links the user account, and sets backend auth cookies.',
  })
  @ApiStandardResponse(TokenResponseDto, 200, 'Google login successful')
  async googleAuth(@Body() dto: GoogleAuthDto, @Res() res: Response): Promise<Response> {
    return this.authService.signInWithGoogle(dto.credential, res);
  }

  async verifyUser(signInDto: SignInDto): Promise<{ data: DbUser }> {
    return this.authService.verifyUser(signInDto);
  }

  @Post('forget-password')
  @ApiOperation({
    summary: 'Initiate password recovery',
    description: 'Sends a password reset link to the registered email.',
  })
  @ApiStandardResponse(AuthResponseDto, 200, 'Reset link sent')
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto): Promise<{ msg: string }> {
    return this.authService.forgetPassword(forgetPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Complete password recovery',
    description: 'Updates the user password using a valid reset token.',
  })
  @ApiStandardResponse(AuthResponseDto, 200, 'Password updated successfully')
  async updatePassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() req: Request): Promise<{ msg: string }> {
    const accessToken = req.cookies?.accessToken;
    const authUser = accessToken ? this.authService.verifyAccessToken(accessToken) : undefined;
    return this.authService.updatePassword(resetPasswordDto, authUser);
  }

  @Post('request-password-change')
  @ApiOperation({
    summary: 'Request password change link',
    description: 'Generates a secure link for an authenticated user to change their password.',
  })
  @ApiStandardResponse(AuthResponseDto, 200, 'Change link sent')
  async requestPasswordChange(@Body() body: { identifier: string }): Promise<{ msg: string }> {
    return this.authService.requestPasswordChange(body.identifier);
  }

  @Post('resend-email-otp')
  @ApiOperation({
    summary: 'Resend email verification OTP',
    description: 'Triggers a new verification OTP to the user email if not already verified.',
  })
  @ApiStandardResponse(AuthResponseDto, 200, 'OTP resent successfully')
  async resendEmailOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp({
      email: dto.email,
      forWhat: { email: true },
    });
  }

  @Post('verify-email-otp')
  @ApiOperation({
    summary: 'Verify email OTP',
    description: 'Verifies the account using the OTP code received via email.',
  })
  @ApiStandardResponse(AuthResponseDto, 200, 'Account verified successfully')
  async verifyEmailOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto, { email: true });
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Uses the refresh token cookie to generate a new access token.',
  })
  @ApiStandardResponse(TokenResponseDto, 200, 'Token refreshed')
  async refreshToken(@Res({ passthrough: true }) response: Response) {
    return this.authService.refreshToken(response);
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Clears authentication cookies and invalidates the session.',
  })
  @ApiStandardResponse(AuthResponseDto, 200, 'Logged out successfully')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken =
      req.cookies['accessToken'] ??
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (accessToken) {
      const decoded = this.authService.verifyAccessToken(accessToken);
      await this.authService.logout(decoded.id);
    }

    const isProd = this.configService.getOrThrow('NODE_ENV') === 'production';
    const sameSite = isProd ? 'none' : 'lax';
    res.clearCookie('accessToken', { httpOnly: true, secure: isProd, sameSite });
    res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite, path: '/auth/refresh' });

    return { message: 'Logged out successfully' };
  }
}
