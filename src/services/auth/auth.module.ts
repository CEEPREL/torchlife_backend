import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthService } from './auth.service';
import { EmailModule } from '../email-transport/email-transport.module';
import { TokenService } from './token/token.service';
import { OtpTokenService } from './otp-token.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, JwtStrategy, UserService, TokenService, OtpTokenService],
    imports: [
        PassportModule,
        JwtModule.register({}),
        UserModule,
        EmailModule,
    ],
    exports: [AuthService],
})
export class AuthModule {}
