import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './services/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './services/user/user.module';
import { PaymentsModule } from './services/payments/payments.module';
import { EmailModule } from './services/email-transport/email-transport.module';
import { UploadModule } from './services/upload/upload.module';
import { CampaignModule } from './services/campaign/campaign.module';
import { BullModule } from '@nestjs/bull';
import { RedisHealthService } from './health/redis-health.service';
import { WalletModule } from './services/payments/breet/wallet/wallet.module';
import { BreetModule } from './services/payments/breet/breet.module'; 
import { createBullConfig } from './config/redis.config';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        ConfigModule.forRoot({ isGlobal: true }),
        UserModule,
        PaymentsModule,
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => createBullConfig(configService),
        }),
        UploadModule,
        CampaignModule,
        WalletModule,
        BreetModule,
        EmailModule,
    ],
    controllers: [AppController],
    providers: [AppService, RedisHealthService],
})
export class AppModule { }
