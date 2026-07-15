import { Controller, HttpCode, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VantService } from './vant.service';

@ApiTags('Payments')
@Controller('webhooks')
export class VantWebhookController {
    constructor(private readonly vantService: VantService) { }

    /**
     * VANT does not document a webhook signing secret (unlike Paystack's
     * x-paystack-signature). As a minimum bar, the webhook URL you give VANT
     * should include a hard-to-guess secret segment (set VANT_WEBHOOK_SECRET
     * and configure the URL as /webhooks/vant/<that secret> with VANT support).
     * The payload itself is never trusted for the credit decision — we always
     * re-fetch the transaction from VANT's API before reconciling.
     */
    @Post('vant/:secret')
    @HttpCode(200)
    @ApiOperation({
        summary: 'VANT inward-transfer webhook listener',
        description:
            'Receives VANT webhooks (checkout virtual account credits), acknowledges immediately, and processes the event asynchronously by re-verifying against the VANT API.',
    })
    @ApiParam({ name: 'secret', description: 'Shared secret configured with VANT for this webhook URL' })
    async handleWebhook(@Req() req: Request, @Param('secret') secret: string) {
        const expectedSecret = process.env.VANT_WEBHOOK_SECRET;
        if (!expectedSecret) {
            throw new UnauthorizedException('VANT webhook secret not configured');
        }

        if (secret !== expectedSecret) {
            throw new UnauthorizedException('Invalid VANT webhook secret');
        }

        const event = req.body as Record<string, any>;
        void this.vantService.processWebhookEvent(event).catch((error) => {
            console.error('Failed to process VANT webhook', error);
        });

        return { data: { received: true } };
    }
}