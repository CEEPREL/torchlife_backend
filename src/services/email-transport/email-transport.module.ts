import { Module } from '@nestjs/common';
import { EmailService } from './email-transport.service';
import { TestController } from "./email.controller"

@Module({
  controllers: [TestController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}