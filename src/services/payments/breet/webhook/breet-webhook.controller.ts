import { Controller, Post, Body, Headers } from "@nestjs/common";
import { BreetWebhookService } from "./breet-webhook.service";

@Controller("webhooks/breet")
export class BreetWebhookController {
  constructor(private readonly service: BreetWebhookService) {}

  @Post()
  async handle(@Body() payload: any, @Headers() headers: any) {
    return this.service.processWebhook(payload, headers);
  }
}