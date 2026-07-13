import { Module } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { BreetModule } from "../breet.module";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  imports: [BreetModule], // ← gives WalletService access to BreetService
  controllers: [WalletController],
  providers: [WalletService, PrismaService],
})
export class WalletModule {}