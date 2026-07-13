export interface PaymentGatewayService {
    initializePayment(data: {
        email: string;
        amount: number;
        tx_ref: string;
        currency: string;
        metadata?: Record<string, unknown>;
        channels?: string[];
        callback_url?: string;
    }): Promise<{ authorization_url: string; reference: string; access_code?: string }>;

    verifyPayment(payload: any): Promise<{
        success: boolean;
        amount: number;
        currency: string;
        provider: string;
        raw: any;
    }>;
}
