// src/services/payments/payment-gateway.resolver.ts
import { Injectable, Inject, NotFoundException, forwardRef } from '@nestjs/common';
import { PaymentGatewayService } from 'src/domain/interface/payment-provider.interface';
import { PaymentProviderKey } from 'src/domain/constants/payment-provider';
import { PaystackInboundService } from '../inbound-providers/paystack.provider';
import { VantInboundService } from '../inbound-providers/vant.provider';
import { WalletPaymentGatewayService } from '../inbound-providers/user-wallet.provider';

@Injectable()
export class PaymentGatewayResolver {
    private readonly providers: Record<string, PaymentGatewayService>;

    constructor(
        private readonly paystack: PaystackInboundService,
        private readonly vant: VantInboundService,
        private readonly userWallet: WalletPaymentGatewayService,
    ) {
        this.providers = {
            paystack: this.paystack,
            vant: this.vant,
            user_wallet: this.userWallet,
        };
    }

    resolve(providerKey: string): PaymentGatewayService {
        const service = this.providers[providerKey];
        if (!service) {
            throw new NotFoundException(`Unsupported payment provider: ${providerKey}`);
        }
        return service;
    }

    resolveByCurrency(currency: string): PaymentGatewayService {
        const map: Record<string, string> = {
            NGN: 'paystack',
            USD: 'flutterwave',
            WALLET: 'user_wallet',
        };

        const providerKey = map[currency.toUpperCase()];
        if (!providerKey) {
            throw new NotFoundException(`No provider found for currency: ${currency}`);
        }

        return this.resolve(providerKey);
    }
}