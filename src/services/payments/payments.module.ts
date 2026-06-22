import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BullModule } from '@nestjs/bull';
import { PaymentsProcessor } from './queue-process/payment.processor';
import { PaymentGatewayResolver } from './queue-process/inbound-payment.resolver';
import { PaystackInboundService } from './inbound-providers/paystack.provider';
import { WalletPaymentGatewayService } from './inbound-providers/user-wallet.provider';
import { PaystackPaymentsController } from './paystack/paystack.controller';
import { PaystackWebhookController } from './paystack/paystack-webhook.controller';
import { PaystackService } from './paystack/paystack.service';
import { EmailTransportModule } from '../email-transport/email-transport.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [BullModule.registerQueue({ name: 'payment' }), EmailTransportModule, UserModule],
    controllers: [PaystackPaymentsController, PaystackWebhookController],
    providers: [
        PaymentsService,
        PaymentsProcessor,
        PaystackInboundService,
        PaystackService,
        PaymentGatewayResolver,
        WalletPaymentGatewayService,
    ],
    exports: [PaymentGatewayResolver],
})
export class PaymentsModule {}
