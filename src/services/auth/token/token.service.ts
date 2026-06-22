import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthUser, JwtPayload } from 'src/shared/types/token-payload.types';
import { parseUserRole } from 'src/shared/utils/parse-user-role';

const parseDurationMs = (value: string): number => {
    const normalized = value.trim();
    if (/^\d+$/.test(normalized)) {
        return Number(normalized);
    }

    const match = normalized.match(/^(\d+)(ms|s|m|h|d)$/i);
    if (!match) {
        throw new Error(`Invalid duration format: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplierMap: Record<string, number> = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return amount * multiplierMap[unit];
};

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    generateAccessToken(user: AuthUser) {
        const expiresIn = this.configService.getOrThrow('JWT_EXPIRATION');
        const expiresInMs = parseDurationMs(expiresIn);
        const payload: JwtPayload = { sub: user.id, role: user.role };
        const token = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow('JWT_SECRET'),
            expiresIn,
        });
        return {
            token,
            expiresAt: new Date(Date.now() + expiresInMs),
        };
    }

    generateRefreshToken(user: AuthUser) {
        const expiresIn = this.configService.getOrThrow('JWT_REFRESH_EXPIRATION');
        const expiresInMs = parseDurationMs(expiresIn);
        const payload: JwtPayload = { sub: user.id, role: user.role };
        const token = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn,
        });
        return {
            token,
            expiresAt: new Date(Date.now() + expiresInMs),
        };
    }

    verifyRefreshToken(token: string): AuthUser {
        const payload = this.jwtService.verify<JwtPayload>(token, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        });
        return { id: payload.sub, role: parseUserRole(payload.role) };
    }

    verifyAccessToken(token: string): AuthUser {
        const payload = this.jwtService.verify<JwtPayload>(token, {
            secret: this.configService.getOrThrow('JWT_SECRET'),
        });
        return { id: payload.sub, role: parseUserRole(payload.role) };
    }
}
