import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { PaymentGatewayService } from 'src/domain/interface/payment-provider.interface';
import { InitializePaymentDto } from '../dto/initialize-payment.dto';
import { InitializeResponseEntity } from '../entities/initialized-payment-response.entity';

@Injectable()
export class PaystackInboundService implements PaymentGatewayService {
    private readonly secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    private readonly baseUrl = process.env.PAYSTACK_URL || 'https://api.paystack.co';

    private get headers() {
        return {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
        };
    }

    async initializePayment(data: InitializePaymentDto): Promise<InitializeResponseEntity> {
        const { email, amount, tx_ref, currency, metadata, channels, callback_url } = data;

        const payload = {
            amount: String(amount * 100),
            email,
            currency,
            reference: tx_ref,
            metadata: JSON.stringify(metadata ?? {}),
            channels,
            callback_url,
        };

        try {
            const endpoint = `${this.baseUrl}/transaction/initialize`;
            const response = await axios.post(endpoint, payload, { headers: this.headers });
            const responseData = response.data.data;

            return {
                authorization_url: responseData.authorization_url,
                access_code: responseData.access_code,
                reference: responseData.reference,
                currency,
                amount: amount * 100,
                tx_ref,
                ...responseData,
            } as InitializeResponseEntity;
        } catch (err) {
            const message = err?.response?.data || err.message || 'Unknown error initializing payment';
            throw new InternalServerErrorException(`Failed to initialize payment: ${JSON.stringify(message)}`);
        }
    }

    async verifyPayment({ reference, currency }: { reference: string; currency: string }) {
        try {
            const endpoint = `${this.baseUrl}/transaction/verify/${reference}`;
            const response = await axios.get(endpoint, { headers: this.headers });
            const data = response.data.data;
            const metadata =
                typeof data.metadata === 'string'
                    ? JSON.parse(data.metadata || '{}')
                    : (data.metadata ?? {});

            return {
                success: data.status === 'success',
                amount: data.amount / 100,
                currency: data.currency,
                provider: 'paystack',
                channel: data.channel ?? null,
                gatewayResponse: data.gateway_response ?? null,
                reference: data.reference,
                paidAt: data.paid_at ?? null,
                transactionId: data.id ?? null,
                metadata,
                raw: response.data,
            };
        } catch (err) {
            const message = err?.response?.data || err.message || 'Unknown error verifying payment';
            throw new InternalServerErrorException(`Failed to verify payment: ${JSON.stringify(message)}`);
        }
    }
}
