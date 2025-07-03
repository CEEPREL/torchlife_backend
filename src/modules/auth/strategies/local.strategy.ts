import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../../../applications/services/auth/auth.service';
import { SignInDto } from '../../../applications/dtos/auth.dto';
import { User } from '@prisma/client';
import { Response } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            usernameField: 'email',
        });
    }
    async validate(email: string, password: string): Promise<User> {
        const signInDto: SignInDto = { email, password };
        const { data: user } = await this.authService.verifyUser(signInDto);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }
}
