import { Controller, Post, Body, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from "@nestjs/swagger";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";

class InitiateBreetDepositDto {
  @ApiProperty({ example: "wallet-uuid-here" })
  walletId!: string;

  @ApiProperty({ example: "BTC" })
  assetId!: string;
}

@ApiTags("Wallet")
@ApiBearerAuth("access-token")
@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Post("deposit/crypto")
  @ApiOperation({
    summary: "Initiate a crypto deposit",
    description:
      "Creates a pending payment record and returns a Breet crypto deposit address for the user to send funds to.",
  })
  @ApiBody({ type: InitiateBreetDepositDto })
  @ApiResponse({
    status: 201,
    description: "Deposit address generated successfully",
    schema: {
      example: {
        address: "bc1q9xyz...",
        asset: "BTC",
        label: "DEP-user-uuid-1718500000",
        payment_id: "payment-uuid",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized — invalid or missing JWT" })
  initiateDeposit(@Body() body: InitiateBreetDepositDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.walletService.initiateBreetDeposit(
      userId,
      body.walletId,
      body.assetId,
    );
  }
}