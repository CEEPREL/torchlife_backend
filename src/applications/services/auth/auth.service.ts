import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DBx, PrismaService } from 'src/infrastructure/prisma/prisma.service';
// import { IAuth } from '../../../auth/auth.interface';
import * as bcrypt from 'bcryptjs';
import { SignInDto, SignUpDto } from '../../dtos/auth.dto';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/applications/services/user/user.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { TokenPayload } from 'src/shared/types/token-payload.types';
import { IAuth } from 'src/domain/interface/auth.interface';

@Injectable()
export class AuthService implements IAuth {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}
    async signUp(signUpDto: SignUpDto, response: Response): Promise<{ data: Omit<User, 'password' | 'id'> }> {
        const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
        signUpDto.password = hashedPassword;
        const user = await this.userService.createUser(signUpDto);
        const tokenPayload: TokenPayload = { id: user.id };
        const accessToken = this.jwtService.sign(tokenPayload, {
            secret: this.configService.getOrThrow('JWT_SECRET'),
            expiresIn: `${this.configService.getOrThrow('JWT_EXPIRATION')}ms`,
        });
        const expiresAt = new Date();
        response.cookie('accessToken', accessToken, {
            httpOnly: true,
            expires: expiresAt,
            secure: this.configService.getOrThrow('NODE_ENV') === 'production',
        });
        const { id, ...result } = user;
        return { data: result };
    }
    async signIn(signInDto: SignInDto, res: Response): Promise<Response> {
        const user = (await this.verifyUser(signInDto))?.data;
        const expiresAt = new Date();
        expiresAt.setMilliseconds(expiresAt.getTime() + parseInt(this.configService.getOrThrow('JWT_EXPIRATION')));
        const tokenPayload: TokenPayload = { id: user.id };
        const accessToken = this.jwtService.sign(tokenPayload, {
            secret: this.configService.getOrThrow('JWT_SECRET'),
            expiresIn: `${this.configService.getOrThrow('JWT_EXPIRATION')}ms`,
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            expires: expiresAt,
            secure: this.configService.getOrThrow('NODE_ENV') === 'production',
        });
        return res.json({ data: accessToken });
    }
    async verifyUser(signInDto: SignInDto): Promise<{ data: User }> {
        const { email, password } = signInDto;
        try {
            const user = await this.userService.getUser(email);
            if (!user) {
                throw new Error('User not found');
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            return { data: user };
        } catch (error) {
            console.error(error);
            throw new UnauthorizedException('Invalid credentials');
        }
    }

    requestResetPassword(): Promise<{ msg: string }> {
        throw new Error('Method not implemented.');
    }
    verifyRequestResetPassword(): Promise<{ msg: string }> {
        throw new Error('Method not implemented.');
    }
    updateResetPassword(): Promise<{ msg: string }> {
        throw new Error('Method not implemented.');
    }
    changePassword(): Promise<{ msg: string }> {
        throw new Error('Method not implemented.');
    }
}
