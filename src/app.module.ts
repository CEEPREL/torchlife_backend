import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { PaymentsModule } from './payments/payments.module';
// import { ConversionService } from './currency/conversion/conversion.service';

@Module({
    imports: [PrismaModule, AuthModule, ConfigModule.forRoot({ isGlobal: true }), UserModule, PaymentsModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
