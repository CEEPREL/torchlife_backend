import { Module } from "@nestjs/common";
import { BreetWebhookController } from "./breet-webhook.controller";
import { BreetWebhookService } from "./breet-webhook.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  controllers: [BreetWebhookController],
  providers: [BreetWebhookService, PrismaService],
})
export class BreetWebhookModule {}