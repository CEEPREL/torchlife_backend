import {
    BadRequestException,
    ForbiddenException,
    GoneException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ForgetPasswordDto, ResetPasswordDto, SignInDto, SignUpDto } from 'src/services/auth/dto/auth.dto';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { EmailTransportService } from '../email-transport/email-transport.service';
import { TokenService } from './token/token.service';
import { AuthUser } from 'src/shared/types/token-payload.types';
import VerifyEmail from 'src/domain/email-templates/verify-email';
import { render } from '@react-email/components';
import { OtpTokenService } from './otp-token.service';
import * as crypto from 'crypto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TooManyRequestsException } from 'src/domain/exceptions/custom.exception';
import { UserRole } from 'src/domain/enums/user-role.enum';
import { parseUserRole } from 'src/shared/utils/parse-user-role';
import { DbUser } from 'src/shared/types/db-user.types';
import PasswordResetEmail from 'src/domain/email-templates/password-reset';
import axios from 'axios';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly emailTransportService: EmailTransportService,
        private readonly tokenService: TokenService,
        private readonly otpTokenService: OtpTokenService,
    ) { }

    private async handleUnverifiedEmailLogin(user: DbUser): Promise<never> {
        let otpResent = false;
        let resendMessage = 'Enter the OTP already sent to your email to finish signing in.';

        try {
            await this.resendOtp({
                email: user.email,
                forWhat: { email: true },
            });
            otpResent = true;
            resendMessage = 'A fresh OTP has been sent to your email. Verify your account to continue.';
        } catch (error) {
            if (!(error instanceof TooManyRequestsException)) {
                throw error;
            }

            resendMessage = `${error.message}. Use the latest OTP already sent to your email.`;
        }

        throw new ForbiddenException({
            statusCode: 403,
            code: 'EMAIL_NOT_VERIFIED',
            message: resendMessage,
            data: {
                userId: user.id,
                email: user.email,
                otpResent,
            },
        });
    }

    // #region debug-point google-sso-backend-report
    private async reportGoogleSsoDebug(event: string, payload: Record<string, unknown> = {}) {
        try {
            await fetch('http://127.0.0.1:7777/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: 'google-sso',
                    source: 'backend',
                    event,
                    hypothesisId: payload.hypothesisId ?? null,
                    runId: 'pre',
                    ts: new Date().toISOString(),
                    payload,
                }),
            });
        } catch {
            // Intentionally ignore debug transport failures.
        }
    }
    // #endregion debug-point google-sso-backend-report

    // #region debug-point login-invalid-credentials-backend-report
    private async reportLoginDebug(event: string, payload: Record<string, unknown> = {}) {
        try {
            await fetch('http://127.0.0.1:7777/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: 'login-invalid-credentials',
                    source: 'backend',
                    event,
                    hypothesisId: payload.hypothesisId ?? null,
                    runId: 'pre',
                    ts: new Date().toISOString(),
                    payload,
                }),
            });
        } catch {
            // Intentionally ignore debug transport failures.
        }
    }
    // #endregion debug-point login-invalid-credentials-backend-report

    // ---------- SIGN UP ----------
    async signUp(
        signUpDto: SignUpDto,
        response: Response,
    ): Promise<{ data: Omit<DbUser, 'password'> }> {
        signUpDto.email = signUpDto.email.trim().toLowerCase();
        if (typeof signUpDto.phone_number === 'string') {
            signUpDto.phone_number = signUpDto.phone_number.trim();
        }

        try {
            const user = await this.userService.createUser(signUpDto);
            await this.attachSessionCookies(user, response);

            // OTP
            const otp = crypto.randomInt(100000, 999999);
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            const hashedOtp = await this.userService.hashPassword(otp.toString());

            await this.otpTokenService.create({
                token: hashedOtp,
                userId: user.id,
                expiryDate: otpExpiresAt,
            });

            const htmlContent = await render(
                VerifyEmail({
                    code: otp.toString(),
                    firstName: user.first_name!,
                }),
            );

            await this.emailTransportService.sendMail({
                to: user.email,
                subject: 'Welcome to Torchlife!',
                name: `${user.first_name} ${user.last_name}`,
                content: htmlContent,
            });

            return { data: user };
        } catch (error) {
            console.error('Failed to create user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('User creation failed.');
        }
    }

    // ---------- VERIFY USER ----------
    async verifyUser(signInDto: SignInDto): Promise<{ data: DbUser }> {
        const { identifier, password } = signInDto;
        await this.reportLoginDebug('backend_verify_user_start', {
            hypothesisId: 'D',
            identifier,
            normalizedIdentifier: identifier.trim().toLowerCase(),
            passwordLength: password.length,
        });

        const user = await this.userService.getUser(identifier);
        await this.reportLoginDebug('backend_verify_user_lookup_result', {
            hypothesisId: 'D',
            identifier,
            userFound: !!user,
            userId: user?.id ?? null,
            userEmail: user?.email ?? null,
            isVerified: user?.isverified ?? null,
            hasPassword: user ? this.userService.hasPassword(user) : null,
        });
        if (!user) throw new UnauthorizedException('Invalid credentials');
        if (!this.userService.hasPassword(user)) {
            const marketingMetadata =
                typeof user.marketing_metadata === 'object' && user.marketing_metadata
                    ? (user.marketing_metadata as Record<string, unknown>)
                    : {};
            const authMetadata =
                typeof marketingMetadata.auth === 'object' && marketingMetadata.auth
                    ? (marketingMetadata.auth as Record<string, unknown>)
                    : {};
            const authProvider = typeof authMetadata.provider === 'string' ? authMetadata.provider : null;
            await this.reportLoginDebug('backend_verify_user_google_only_account', {
                hypothesisId: 'D',
                userId: user.id,
                email: user.email,
            });
            if (authProvider === 'google') {
                throw new UnauthorizedException('This account uses Google sign in. Sign in with Google or set a password first.');
            }
            throw new UnauthorizedException('This account does not have a password yet. Complete sign up to continue.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        await this.reportLoginDebug('backend_verify_user_password_check', {
            hypothesisId: 'A',
            userId: user.id,
            email: user.email,
            isMatch,
        });
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');
        if (!user.isverified) {
            await this.reportLoginDebug('backend_verify_user_unverified_email', {
                hypothesisId: 'B',
                userId: user.id,
                email: user.email,
            });
            await this.handleUnverifiedEmailLogin(user);
        }

        await this.reportLoginDebug('backend_verify_user_success', {
            hypothesisId: 'E',
            userId: user.id,
            email: user.email,
        });
        return { data: user };
    }

    // ---------- SIGN IN ----------
    async signIn(signInDto: SignInDto, res: Response): Promise<Response> {
        signInDto.identifier = signInDto.identifier.trim().toLowerCase();
        await this.reportLoginDebug('backend_signin_start', {
            hypothesisId: 'D',
            identifier: signInDto.identifier,
        });

        try {
            const user = (await this.verifyUser(signInDto)).data;
            await this.reportLoginDebug('backend_signin_attach_session', {
                hypothesisId: 'E',
                userId: user.id,
                email: user.email,
            });
            return res.json(await this.attachSessionCookies(user, res));
        } catch (error) {
            await this.reportLoginDebug('backend_signin_failure', {
                hypothesisId: error instanceof ForbiddenException ? 'B' : 'D',
                errorName: error instanceof Error ? error.name : 'UnknownError',
                message: error instanceof Error ? error.message : 'Unknown sign in error',
                isHttpException: error instanceof HttpException,
                status:
                    error instanceof HttpException ? error.getStatus() : null,
            });
            if (error instanceof HttpException) {
                throw error;
            }

            throw new UnauthorizedException('Invalid credentials');
        }
    }

    async signInWithGoogle(credential: string, response: Response) {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        await this.reportGoogleSsoDebug('google_sso_backend_start', {
            hypothesisId: 'C',
            hasConfiguredClientId: !!clientId,
            clientIdSuffix: clientId ? clientId.slice(-24) : null,
            credentialLength: credential?.length ?? 0,
        });

        if (!clientId) {
            await this.reportGoogleSsoDebug('google_sso_backend_missing_client_id', {
                hypothesisId: 'C',
            });
            throw new BadRequestException('Google sign in is not configured');
        }

        const { data: payload } = await axios.get<{
            sub?: string;
            email?: string;
            email_verified?: string | boolean;
            aud?: string;
            given_name?: string;
            family_name?: string;
            name?: string;
            picture?: string;
        }>('https://oauth2.googleapis.com/tokeninfo', {
            params: { id_token: credential },
        });

        await this.reportGoogleSsoDebug('google_sso_backend_tokeninfo_received', {
            hypothesisId: 'C',
            audience: payload.aud ?? null,
            audienceMatches: payload.aud === clientId,
            hasSub: !!payload.sub,
            hasEmail: !!payload.email,
            emailVerified: payload.email_verified ?? null,
        });

        if (payload.aud !== clientId) {
            await this.reportGoogleSsoDebug('google_sso_backend_audience_mismatch', {
                hypothesisId: 'C',
                audience: payload.aud ?? null,
                clientIdSuffix: clientId.slice(-24),
            });
            throw new UnauthorizedException('Google token audience mismatch');
        }

        const isEmailVerified = payload.email_verified === true || payload.email_verified === 'true';
        if (!payload?.sub || !payload.email || !isEmailVerified) {
            await this.reportGoogleSsoDebug('google_sso_backend_invalid_google_account', {
                hypothesisId: 'C',
                hasSub: !!payload?.sub,
                hasEmail: !!payload.email,
                emailVerified: isEmailVerified,
            });
            throw new UnauthorizedException('Invalid Google account');
        }

        const email = payload.email.toLowerCase();
        const firstName = payload.given_name?.trim() || payload.name?.split(' ')[0] || 'Google';
        const lastName =
            payload.family_name?.trim() ||
            payload.name?.split(' ').slice(1).join(' ').trim() ||
            'User';

        let user = await this.userService.findUserByEmail(email);
        await this.reportGoogleSsoDebug('google_sso_backend_user_lookup', {
            hypothesisId: 'E',
            email,
            userFound: !!user,
        });

        if (!user) {
            const createdUser = await this.userService.createGoogleUser({
                email,
                firstName,
                lastName,
                googleId: payload.sub,
                picture: payload.picture,
            });
            user = { ...createdUser, password: '' } as DbUser;
            await this.reportGoogleSsoDebug('google_sso_backend_user_created', {
                hypothesisId: 'E',
                userId: user.id,
                email,
            });
        } else {
            await this.userService.upsertGoogleMetadata(user.id, {
                googleId: payload.sub,
                picture: payload.picture,
            });
            user = await this.userService.getUserById(user.id);
            await this.reportGoogleSsoDebug('google_sso_backend_user_linked', {
                hypothesisId: 'E',
                userId: user.id,
                email,
            });
        }

        await this.reportGoogleSsoDebug('google_sso_backend_attach_session', {
            hypothesisId: 'E',
            userId: user.id,
            email,
        });
        return response.json(await this.attachSessionCookies(user, response));
    }

    // ---------- RESEND OTP ----------
    async resendOtp(data: {
        email?: string;
        forWhat: { email?: boolean; phone?: boolean };
        userId?: string;
        phone?: string;
    }) {
        const user = data.email
            ? await this.userService.getUser(data.email)
            : await this.userService.getUser(data.userId!);

        if (!user) throw new NotFoundException('User not found');

        const existingToken = await this.otpTokenService.findOne(user.id);
        if (existingToken) {
            const now = new Date();

            if (existingToken.expiryDate > now) {
                const diffMs = existingToken.expiryDate.getTime() - now.getTime();
                const remaining = Math.ceil(diffMs / (1000 * 60));
                throw new TooManyRequestsException(`Wait ${remaining} minutes before requesting another code`);
            }
        }

        const otp = crypto.randomInt(100000, 999999);
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const hashedOtp = await this.userService.hashPassword(otp.toString());

        await this.otpTokenService.create({
            token: hashedOtp,
            userId: user.id,
            expiryDate: otpExpiresAt,
        });

        if (data.forWhat.email) {
            const htmlContent = await render(
                VerifyEmail({
                    code: otp.toString(),
                    firstName: user.first_name!,
                }),
            );

            await this.emailTransportService.sendMail({
                to: user.email,
                subject: 'Welcome to Torchlife!',
                name: `${user.first_name} ${user.last_name}`,
                content: htmlContent,
            });
        }
    }

    // ---------- RESET PASSWORD ----------
    async updatePassword(resetPasswordDto: ResetPasswordDto, authUser?: AuthUser): Promise<{ msg: string }> {
        if (authUser?.id) {
            const currentUser = await this.userService.getUserById(authUser.id);
            const normalizedIdentifier = resetPasswordDto.identifier.trim().toLowerCase();
            const sessionMatchesIdentifier =
                currentUser.email.toLowerCase() === normalizedIdentifier ||
                (!!currentUser.phone_number && currentUser.phone_number === resetPasswordDto.identifier);

            if (!sessionMatchesIdentifier) {
                throw new UnauthorizedException('You can only update your own password');
            }

            if (!this.userService.hasPassword(currentUser)) {
                await this.userService.setPasswordByUserId(currentUser.id, resetPasswordDto.newPassword);
                return { msg: 'Password set successfully' };
            }
        }

        if (!resetPasswordDto.oldPassword) {
            throw new UnauthorizedException('Current password is required');
        }

        const isUser = (await this.verifyUser({
            identifier: resetPasswordDto.identifier,
            password: resetPasswordDto.oldPassword,
        })).data;

        if (!isUser) throw new UnauthorizedException('Invalid credentials');

        await this.userService.updatePassword(resetPasswordDto.identifier, resetPasswordDto.newPassword);

        return { msg: 'Password reset successfully' };
    }

    // ---------- FORGET PASSWORD ----------
    async forgetPassword(dto: ForgetPasswordDto): Promise<{ msg: string }> {
        await this.userService.updatePassword(dto.identifier, dto.newPassword);
        return { msg: 'Password reset successfully' };
    }

    // ---------- PASSWORD CHANGE REQUEST ----------
    async requestPasswordChange(identifier: string): Promise<{ msg: string }> {
        const user = await this.userService.getUser(identifier);
        if (!user) throw new NotFoundException('User not found');

        const resetPasswordURL = this.configService.getOrThrow('resetPasswordURL');
        const token = this.tokenService.generateAccessToken({
            id: user.id,
            role: user.role ? parseUserRole(user.role) : UserRole.USER,
        });

        const resetURL = `${resetPasswordURL}?token=${token.token}`;
        const htmlContent = await render(
            PasswordResetEmail({
                firstName: user.first_name,
                resetUrl: resetURL,
            }),
        );

        await this.emailTransportService.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            name: user.first_name,
            content: htmlContent,
        });

        return { msg: 'Password change request sent' };
    }

    // ---------- VERIFY OTP ----------
    async verifyOtp(
        dto: VerifyOtpDto,
        forWhat: { email?: boolean; phone?: boolean } = { email: false, phone: false },
    ): Promise<DbUser> {
        const token = await this.otpTokenService.findOne(dto.userId);
        if (!token) throw new GoneException('OTP already used');

        const isCorrectOtp = await this.userService.comparePasswords(dto.otp.toString(), token.token);
        if (!isCorrectOtp) throw new UnauthorizedException('Invalid OTP');

        if (token.expiryDate < new Date()) throw new UnauthorizedException('OTP expired');

        await this.otpTokenService.delete(dto.userId);

        if (forWhat.email) await this.userService.verifiedEmail(dto.userId);

        return await this.userService.getUser(dto.userId);
    }

    // ---------- VERIFY ACCESS TOKEN ----------
    verifyAccessToken(token: string): AuthUser {
        return this.tokenService.verifyAccessToken(token);
    }

    // ---------- ME ----------
    async getMe(userId: string): Promise<{ data: Omit<DbUser, 'password'> }> {
        const user = await this.userService.getUserById(userId);
        const { password, ...result } = user;
        return { data: result };
    }

    // ---------- REFRESH TOKEN ----------
    async refreshToken(response: Response): Promise<{ accessToken: string }> {
        const refreshToken = response.req.cookies['refreshToken'];
        if (!refreshToken) throw new UnauthorizedException('Refresh token not found');

        const decoded = this.tokenService.verifyRefreshToken(refreshToken);
        const user = await this.userService.getUser(decoded.id);

        if (!user || !user.refreshToken) throw new UnauthorizedException('Invalid refresh token');

        const match = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!match) throw new UnauthorizedException('Invalid refresh token');

        const payload: AuthUser = {
            id: user.id,
            role: user.role ? parseUserRole(user.role) : UserRole.USER,
        };

        const { token: newAccessToken, expiresAt: newAccessExpiresAt } = this.tokenService.generateAccessToken(payload);
        const { token: newRefreshToken, expiresAt: newRefreshExpiresAt } = this.tokenService.generateRefreshToken(payload);

        const hashedNewRefresh = await bcrypt.hash(newRefreshToken, 10);
        await this.userService.updateRefreshToken(user.id, hashedNewRefresh);

        const isProd = this.configService.getOrThrow('NODE_ENV') === 'production';
        const sameSite = isProd ? 'none' : 'lax';

        response.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            expires: newAccessExpiresAt,
            secure: isProd,
            sameSite,
        });

        response.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            expires: newRefreshExpiresAt,
            secure: isProd,
            sameSite,
            path: '/auth/refresh',
        });

        return { accessToken: newAccessToken };
    }

    // ---------- LOGOUT ----------
    async logout(userId: string): Promise<void> {
        await this.userService.updateRefreshToken(userId, null);
    }

    private async attachSessionCookies(user: Pick<DbUser, 'id' | 'role'>, response: Response) {
        const authUser: AuthUser = {
            id: user.id,
            role: user.role ? parseUserRole(user.role) : UserRole.USER,
        };
        const { token: accessToken, expiresAt: accessExpiresAt } = this.tokenService.generateAccessToken(authUser);
        const { token: refreshToken, expiresAt: refreshExpiresAt } = this.tokenService.generateRefreshToken(authUser);

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.userService.updateRefreshToken(user.id, hashedRefreshToken);

        const isProd = this.configService.getOrThrow('NODE_ENV') === 'production';
        const sameSite = isProd ? 'none' : 'lax';

        response.cookie('accessToken', accessToken, {
            httpOnly: true,
            expires: accessExpiresAt,
            secure: isProd,
            sameSite,
        });

        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            expires: refreshExpiresAt,
            secure: isProd,
            sameSite,
            path: '/auth/refresh',
        });

        return {
            accessToken,
            tokenType: 'Bearer',
            expiresAt: accessExpiresAt,
        };
    }
}
