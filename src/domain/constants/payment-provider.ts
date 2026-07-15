export class PaymentProviderKey {
    static readonly paystack = 'paystack';
    static readonly flutterwave = 'flutterwave';
    static readonly vant = 'vant';
    static readonly user_wallet = 'user_wallet';
}

export type PaymentProviderType = 'paystack' | 'flutterwave' | 'vant' | 'user_wallet';