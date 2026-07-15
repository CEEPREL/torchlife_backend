import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { PaymentGatewayService } from 'src/domain/interface/payment-provider.interface';

export interface VantCheckoutResult {
    // Kept for structural compatibility with PaymentGatewayService.
    // VANT has no hosted redirect page, so this is always empty.
    authorization_url: string;
    reference: string;
    access_code?: string;

    // VANT-specific: a temporary virtual account the payer must transfer into.
    accountNumber: string;
    accountName: string;
    bank: string;
    validTill: string | null;
    amount: number;
    currency: string;
    raw: any;
}

export interface VantVerificationResult {
    success: boolean;
    amount: number;
    currency: string;
    provider: 'vant';
    channel: string;
    gatewayResponse: string | null;
    reference: string;
    paidAt: string | null;
    transactionId: string | null;
    metadata: Record<string, unknown>;
    raw: any;
}
/**
 * Low-level client for the VANT Partner API.
 * Docs: https://vantapi.readme.io/reference/getting-started-with-your-api
 */
@Injectable()
export class VantInboundService implements PaymentGatewayService {
    private readonly apiKey = process.env.VANT_SECRET_KEY || '';
    private readonly baseUrl = process.env.VANT_BASE_URL || 'https://dev.vantapp.com/api/partner';

    private get headers() {
        return {
            'X-VANT-KEY': this.apiKey,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Creates a temporary virtual account for the payer to transfer funds into.
     * There is no hosted checkout page/redirect URL with VANT — the frontend
     * must display the returned account details to the payer.
     */
    async initializePayment(data: {
        email?: string;
        amount: number;
        tx_ref: string;
        currency: string;
        metadata?: Record<string, unknown>;
    }): Promise<VantCheckoutResult> {
        if (!this.apiKey) {
            throw new InternalServerErrorException('VANT_SECRET_KEY is not configured');
        }

        const { amount, tx_ref, currency } = data;

        // Confirmed request shape (per VANT's Node SDK example):
        // vantapi.checkout({ amount: 100, reference: 'PAY_ved_1222222' })
        const payload = {
            amount,
            reference: tx_ref,
        };

        try {
            const endpoint = `${this.baseUrl}/checkout`;
            const response = await axios.post(endpoint, payload, { headers: this.headers });
            const body = response.data;

            // Confirmed response shape:
            // {
            //   "message": "Virtual account generated successfully, please transfer into the account",
            //   "account_number": "4700357060",
            //   "account_name": "GARRITECH",
            //   "bank": "VFD",
            //   "valid_till": "2024-10-23T11:20:34.994720Z",
            //   "amount": "100",
            //   "reference": "ASO_ved_1222222",
            //   "status": true
            // }
            if (body?.status !== true || !body?.account_number) {
                throw new Error(body?.message || 'VANT checkout did not return a virtual account');
            }

            return {
                authorization_url: '',
                // IMPORTANT: VANT rewrites the reference you send (adds its own prefix,
                // e.g. "PAY_ved_1222222" -> "ASO_ved_1222222"). Always persist the
                // reference VANT returns, not the one you sent.
                reference: body.reference,
                accountNumber: body.account_number,
                accountName: body.account_name,
                bank: body.bank,
                validTill: body.valid_till ?? null,
                amount: Number(body.amount),
                currency,
                raw: body,
            };
        } catch (err:any) {
            const message = err?.response?.data || err.message || 'Unknown error creating VANT checkout';
            throw new InternalServerErrorException(`Failed to initialize VANT checkout: ${JSON.stringify(message)}`);
        }
    }
    /**
     * VANT's Partner API does NOT expose a "get transaction by reference" endpoint.
     * The full documented endpoint list is: transfer/banks, transfer/verify-account,
     * transfer/initiate, client/create, client/all-wallets, client/enquire-walllet,
     * checkout, client/transfer — none of which look up a transaction by reference.
     *
     * For checkout payments, the inward-transfer webhook is the ONLY source of
     * truth. Do not call this method for checkout reconciliation — see
     * VantService.processWebhookEvent, which builds a verification result
     * directly from the webhook payload instead.
     */
    async verifyPayment(_payload: { reference: string; currency?: string }): Promise<VantVerificationResult> {
        throw new InternalServerErrorException(
            'VANT has no transaction-lookup-by-reference endpoint. Reconcile checkout payments via the /webhooks/vant/:secret listener instead.',
        );
    }
}