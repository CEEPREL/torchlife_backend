import { Module } from "@nestjs/common";
import { BreetService } from "./breet.service";
import { BreetController } from "./breet.controller";
import { BreetWebhookService } from "./webhook/breet-webhook.service";
import { BreetWebhookController } from "./webhook/breet-webhook.controller";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  controllers: [BreetController, BreetWebhookController],
  providers: [BreetService, BreetWebhookService, PrismaService],
  exports: [BreetService], // ← so WalletModule can use it
})
export class BreetModule {}