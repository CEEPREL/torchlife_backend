import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BullModule } from '@nestjs/bull';
import { PaymentsProcessor } from './queue-process/payment.processor';
import { PaymentGatewayResolver } from './queue-process/inbound-payment.resolver';
import { PaystackInboundService } from './inbound-providers/paystack.provider';
import { VantInboundService } from './inbound-providers/vant.provider';
import { WalletPaymentGatewayService } from './inbound-providers/user-wallet.provider';
import { PaystackPaymentsController } from './paystack/paystack.controller';
import { PaystackWebhookController } from './paystack/paystack-webhook.controller';
import { PaystackService } from './paystack/paystack.service';
import { VantPaymentsController } from './vant/vant.controller';
import { VantWebhookController } from './vant/vant-webhook.controller';
import { VantService } from './vant/vant.service';
import { EmailModule } from '../email-transport/email-transport.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [BullModule.registerQueue({ name: 'payment' }), EmailModule, UserModule],
    controllers: [
        PaystackPaymentsController,
        PaystackWebhookController,
        VantPaymentsController,
        VantWebhookController,
    ],
    providers: [
        PaymentsService,
        PaymentsProcessor,
        PaystackInboundService,
        PaystackService,
        VantInboundService,
        VantService,
        PaymentGatewayResolver,
        WalletPaymentGatewayService,
    ],
    exports: [PaymentGatewayResolver],
})
export class PaymentsModule {}