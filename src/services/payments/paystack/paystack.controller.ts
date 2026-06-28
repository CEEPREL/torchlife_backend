import { Body, Controller, Get, Headers, HttpCode, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiHeader, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import * as crypto from 'crypto';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user';
import { AuthUser } from 'src/shared/types/token-payload.types';
import { InitializePaystackDonationDto } from './dto/initialize-paystack-donation.dto';
import { ApiStandardResponse, ApiCommonErrors } from 'src/shared/decorators/swagger.decorator';
import { PaystackService } from './paystack.service';

class PaymentInitResponseDto {
  // Define response
}

class AuthResponseDto {
  // Shared empty response for success messages
}

class DonationHistoryResponseDto {
  // Donation history response
}

@ApiTags('Payments')
@ApiCommonErrors()
@Controller('payments/paystack')
export class PaystackPaymentsController {
  constructor(
    private readonly paystackService: PaystackService,
  ) { }

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize donation',
    description:
      'Creates a pending donation and payment record for a donor email, then returns a Paystack checkout URL.',
  })
  @ApiStandardResponse(PaymentInitResponseDto, 201, 'Payment initialized successfully')
  async initializeDonation(@Body() dto: InitializePaystackDonationDto) {
    return this.paystackService.initializeDonation(dto);
  }

  @Get('verify/:reference')
  @ApiOperation({
    summary: 'Verify a Paystack transaction',
    description:
      'Verifies a Paystack transaction by reference, reconciles internal records, and prevents duplicate processing.',
  })
  @ApiParam({ name: 'reference', description: 'The Paystack transaction reference' })
  @ApiStandardResponse(AuthResponseDto, 200, 'Payment verified')
  async verifyTransaction(@Param('reference') reference: string) {
    return this.paystackService.verifyTransaction(reference);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiOperation({
    summary: 'Get authenticated user donation history',
    description:
      'Returns donation payments for the authenticated user so the dashboard reads backend payment records only.',
  })
  @ApiStandardResponse(DonationHistoryResponseDto, 200, 'Donation history retrieved')
  async getDonationHistory(@CurrentUser() user: AuthUser) {
    return this.paystackService.getDonationHistory(user);
  }

  @Get('ticker')
  @ApiOperation({
    summary: 'Get recent verified donation activity',
    description:
      'Returns a small rolling list of recent successful donations for the public donation ticker. Uses anonymous or philanthropic labels only.',
  })
  @ApiStandardResponse(DonationHistoryResponseDto, 200, 'Recent donation activity retrieved')
  async getRecentDonationTicker() {
    return this.paystackService.getRecentDonationTicker();
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Paystack webhook listener',
    description:
      'Receives events from Paystack. Performs HMAC signature verification, fetches transaction status from Paystack API, and reconciles the database (Payment, Donation, and Campaign amounts).',
  })
  @ApiHeader({
    name: 'x-paystack-signature',
    description: 'HMAC SHA512 signature of the request body, signed with your Paystack secret key.',
    required: true,
  })
  @ApiStandardResponse(AuthResponseDto, 200, 'Webhook processed')
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-paystack-signature') signature?: string,
  ) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new UnauthorizedException('Paystack secret not configured');

    const raw = (req as any).rawBody;
    if (!raw || !Buffer.isBuffer(raw)) {
      throw new UnauthorizedException('Missing raw body for signature verification');
    }

    const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
    if (!signature || signature !== expected) {
      throw new UnauthorizedException('Invalid Paystack signature');
    }

    const event = req.body as Record<string, any>;
    void this.paystackService.processWebhookEvent(event).catch((error) => {
      console.error('Failed to process Paystack webhook', error);
    });

    return { data: { received: true } };
  }
}
