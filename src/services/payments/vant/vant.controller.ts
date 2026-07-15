import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { InitializeVantDonationDto } from './dto/initialize-vant-donation.dto';
import { ApiStandardResponse, ApiCommonErrors } from 'src/shared/decorators/swagger.decorator';
import { VantService } from './vant.service';

class VantCheckoutResponseDto {
  // Define response
}

class VantVerifyResponseDto {
  // Define response
}

@ApiTags('Payments')
@ApiCommonErrors()
@Controller('payments/vant')
export class VantPaymentsController {
  constructor(private readonly vantService: VantService) { }

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize a VANT donation checkout',
    description:
      'Creates a pending donation and payment record, then generates a temporary VANT virtual account for the donor to transfer funds into.',
  })
  @ApiStandardResponse(VantCheckoutResponseDto, 201, 'VANT checkout initialized successfully')
  async initializeDonation(@Body() dto: InitializeVantDonationDto) {
    return this.vantService.initializeDonation(dto);
  }

  @Get('verify/:reference')
  @ApiOperation({
    summary: 'Verify a VANT transaction',
    description:
      'Looks up a VANT transaction by reference, reconciles internal records, and prevents duplicate processing. Useful for polling from the frontend while waiting on the webhook.',
  })
  @ApiParam({ name: 'reference', description: 'The VANT transaction reference' })
  @ApiStandardResponse(VantVerifyResponseDto, 200, 'Payment verified')
  async verifyTransaction(@Param('reference') reference: string) {
    return this.vantService.verifyTransaction(reference);
  }
}