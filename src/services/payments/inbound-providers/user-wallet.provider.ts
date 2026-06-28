import { Injectable } from '@nestjs/common';
import { PaymentGatewayService } from 'src/domain/interface/payment-provider.interface';

@Injectable()
export class WalletPaymentGatewayService implements PaymentGatewayService {
    async initializePayment({ amount, tx_ref, currency, email }) {
        // Call Wallet init endpoint
        return {
            authorization_url: 'wallet://payment',
            reference: tx_ref,
        };
    }

    async verifyPayment(payload: any) {
        const success = payload?.data?.status === 'success';
        const amount = payload?.data?.amount ?? 0;
        const currency = payload?.data?.currency ?? 'NGN';

        return {
            success,
            amount: amount / 100,
            currency,
            provider: 'wallet',
            raw: payload,
        };
    }
}
