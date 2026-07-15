import { PaystackInboundService } from './inbound-providers/paystack.provider';
import { VantInboundService } from './inbound-providers/vant.provider';
import { WalletPaymentGatewayService } from './inbound-providers/user-wallet.provider';

export const PaymentProvidersMap = {
    paystack: PaystackInboundService,
    vant: VantInboundService,
    user_wallet: WalletPaymentGatewayService,
} as const;

export type PaymentProviderKey = keyof typeof PaymentProvidersMap;