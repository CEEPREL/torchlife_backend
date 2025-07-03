import { Module } from '@nestjs/common';
import { AuthService } from '../../applications/services/auth/auth.service';
import { AuthController } from '../../controllers/auth/auth.controller';
import { UserModule } from 'src/modules/user/user.module';
import { LocalStrategy } from './strategies/local.strategy';
import { UserService } from 'src/applications/services/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Module({
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, UserService, JwtService],
    imports: [UserModule],
})
export class AuthModule {}
