import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './services/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './services/user/user.module';
import { PaymentsModule } from './services/payments/payments.module';
import { EmailTransportService } from './services/email-transport/email-transport.service';
import { UploadModule } from './services/upload/upload.module';
import { CampaignModule } from './services/campaign/campaign.module';
import { BullModule } from '@nestjs/bull';
import { RedisHealthService } from './health/redis-health.service';
import { WalletModule } from './services/payments/breet/wallet/wallet.module';
import { BreetModule } from './services/payments/breet/breet.module'; 

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        ConfigModule.forRoot({ isGlobal: true }),
        UserModule,
        PaymentsModule,
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
            },
        }),
        UploadModule,
        CampaignModule,
        WalletModule,
        BreetModule,
    ],
    controllers: [AppController],
    providers: [AppService, EmailTransportService, RedisHealthService],
})
export class AppModule {}
