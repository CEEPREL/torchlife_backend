import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class BreetWebhookService {
    private logger = new Logger(BreetWebhookService.name);

    constructor(private prisma: PrismaService) { }

    async processWebhook(payload: any, headers: any) {
        const { label, amount, asset, status, txHash } = payload;

        if (!label) {
            throw new BadRequestException("Missing label");
        }

        const payment = await this.prisma.payment.findFirst({
            where: {
                custom_tx_ref: label,
                provider: "BREET",
            },
        });

        if (!payment) {
            this.logger.warn(`Payment not found: ${label}`);
            return { received: true };
        }

        if (payment.status === "SUCCESS") {
            return { received: true };
        }

        if (status !== "confirmed" && status !== "completed") {
            return { received: true };
        }

        await this.prisma.$transaction(async (tx) => {
            // update payment history
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: "SUCCESS",
                    synced_at: new Date(),
                    amount: Number(amount),
                    meta: {
                        ...(payment.meta as object),
                        asset,
                        txHash,
                    },
                },
            });

            // credit wallet
            if (payment.wallet_id) {
                await tx.wallet.update({
                    where: { id: payment.wallet_id },
                    data: {
                        balance: {
                            increment: Number(amount),
                        },
                    },
                });
            }

            // wallet ledger
            if (payment.wallet_id) {
                await tx.walletTransaction.create({
                    data: {
                        wallet_id: payment.wallet_id,
                        payment_id: payment.id,
                        reference: label,
                        amount: Number(amount),
                        type: "DEPOSIT",
                        status: "SUCCESS",
                        currency: "CRYPTO",
                    },
                });
            }
        });

        return { received: true };
    }
}