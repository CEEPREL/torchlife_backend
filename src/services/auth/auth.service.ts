import {
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

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly emailTransportService: EmailTransportService,
        private readonly tokenService: TokenService,
        private readonly otpTokenService: OtpTokenService,
    ) { }

    // ---------- SIGN UP ----------
    async signUp(
        signUpDto: SignUpDto,
        response: Response,
    ): Promise<{ data: Omit<DbUser, 'password' | 'id'> }> {
        const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
        signUpDto.password = hashedPassword;
        signUpDto.email = signUpDto.email.toLowerCase();

        try {
            const user = await this.userService.createUser(signUpDto);

            const authUser: AuthUser = {
                id: user.id,
                role: user.role ? parseUserRole(user.role) : UserRole.USER,
            };
            const { token: accessToken, expiresAt: accessExpiresAt } = this.tokenService.generateAccessToken(authUser);
            const { token: refreshToken, expiresAt: refreshExpiresAt } = this.tokenService.generateRefreshToken(authUser);

            const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
            await this.userService.updateRefreshToken(user.id, hashedRefreshToken);

            response.cookie('accessToken', accessToken, {
                httpOnly: true,
                expires: accessExpiresAt,
                secure: this.configService.getOrThrow('NODE_ENV') === 'production',
            });

            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                expires: refreshExpiresAt,
                secure: this.configService.getOrThrow('NODE_ENV') === 'production',
                sameSite: 'strict',
                path: '/auth/refresh',
            });

            // OTP
            const otp = crypto.randomInt(100000, 999999);
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            const hashedOtp = await this.userService.hashPassword(otp.toString());

            await this.otpTokenService.create({
                token: hashedOtp,
                userId: user.id,
                expiryDate: otpExpiresAt,
            });

            // const htmlContent = await render(
            //     VerifyEmail({
            //         code: otp.toString(),
            //         firstName: user.first_name!,
            //     }),
            // );

            // await this.emailTransportService.sendMail({
            //     to: user.email,
            //     subject: 'Welcome to Torchlife!',
            //     name: `${user.first_name} ${user.last_name}`,
            //     content: htmlContent,
            //     templateName: 'verify-email',
            // });

            const { id, ...result } = user;
            return { data: result };
        } catch (error) {
            console.error('Failed to create user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('User creation failed.');
        }
    }

    // ---------- VERIFY USER ----------
    async verifyUser(signInDto: SignInDto): Promise<{ data: DbUser }> {
        const { identifier, password } = signInDto;

        const user = await this.userService.getUser(identifier);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        return { data: user };
    }

    // ---------- SIGN IN ----------
    async signIn(signInDto: SignInDto, res: Response): Promise<Response> {
        signInDto.identifier = signInDto.identifier.toLowerCase();

        try {
            const user = (await this.verifyUser(signInDto)).data;

            const authUser: AuthUser = {
                id: user.id,
                role: user.role ? parseUserRole(user.role) : UserRole.USER,
            };
            const { token: accessToken, expiresAt: accessExpiresAt } = this.tokenService.generateAccessToken(authUser);
            const { token: refreshToken, expiresAt: refreshExpiresAt } = this.tokenService.generateRefreshToken(authUser);

            const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
            await this.userService.updateRefreshToken(user.id, hashedRefreshToken);

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                expires: accessExpiresAt,
                secure: this.configService.getOrThrow('NODE_ENV') === 'production',
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                expires: refreshExpiresAt,
                secure: this.configService.getOrThrow('NODE_ENV') === 'production',
                sameSite: 'strict',
                path: '/auth/refresh',
            });

            return res.json({
                accessToken,
                tokenType: 'Bearer',
                expiresAt: accessExpiresAt,
            });
        } catch {
            throw new UnauthorizedException('Invalid credentials');
        }
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
                templateName: 'verify-email',
            });
        }
    }

    // ---------- RESET PASSWORD ----------
    async updatePassword(resetPasswordDto: ResetPasswordDto): Promise<{ msg: string }> {
        const isUser = (
            await this.verifyUser({
                identifier: resetPasswordDto.identifier,
                password: resetPasswordDto.oldPassword,
            })
        ).data;

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

        const resetURL = `${resetPasswordURL}?token=${token}`;

        await this.emailTransportService.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            name: user.first_name,
            content: `Click the link to reset your password: ${resetURL}`,
            templateName: 'passwordReset',
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

        response.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            expires: newAccessExpiresAt,
            secure: this.configService.getOrThrow('NODE_ENV') === 'production',
        });

        response.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            expires: newRefreshExpiresAt,
            secure: this.configService.getOrThrow('NODE_ENV') === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
        });

        return { accessToken: newAccessToken };
    }

    // ---------- LOGOUT ----------
    async logout(userId: string): Promise<void> {
        await this.userService.updateRefreshToken(userId, null);
    }
}
