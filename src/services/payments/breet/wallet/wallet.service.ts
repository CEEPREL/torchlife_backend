import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { BreetService } from "../breet.service";

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private breetService: BreetService,
  ) {}

  async initiateBreetDeposit(userId: string, walletId: string, assetId: string) {
    const custom_tx_ref = `DEP-${userId}-${Date.now()}`;

    // 1. Save payment record first
    const payment = await this.prisma.payment.create({
      data: {
        amount: 0,
        tx_ref: custom_tx_ref,
        custom_tx_ref,
        status: "PENDING",
        type: "DEPOSIT",
        currency: "CRYPTO",
        provider: "BREET",
        wallet_id: walletId,
        user_id: userId,
      },
    });

    // 2. Call Breet with that same ref as label
    const breetResponse = await this.breetService.generateDepositAddress(
      assetId,
      custom_tx_ref,
    );

    return {
      address: breetResponse.address,
      asset: breetResponse.asset,
      label: custom_tx_ref,
      payment_id: payment.id,
    };
  }
}