import { Controller, Get, Param, Post, Body } from "@nestjs/common";
import { BreetService } from "./breet.service";

@Controller("breet")
export class BreetController {
  constructor(private readonly breetService: BreetService) {}

  @Get("account")
  getAccount() {
    return this.breetService.getAccountDetails();
  }

  @Get("assets")
  getAssets() {
    return this.breetService.getAssets();
  }
}