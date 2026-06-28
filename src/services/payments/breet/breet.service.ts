import axios from "axios";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class BreetService {
  private readonly logger = new Logger(BreetService.name);

  private get baseURL() {
    return process.env.BREET_BASE_URL;
  }

  private getHeaders() {
    return {
      "x-app-id": process.env.BREET_APP_ID,
      "x-app-secret": process.env.BREET_APP_SECRET,
      "X-Breet-Env": process.env.BREET_ENV || "development",
    };
  }

  // 1. Fetch account details
  async getAccountDetails() {
    try {
      const res = await axios.get(
        `${this.baseURL}/users/fetch-integration`,
        { headers: this.getHeaders() }
      );
      return res.data;
    } catch (error: any) {
      this.logger.error("Failed to fetch account details", error.message);
      throw error;
    }
  }

  // 2. Get supported assets
  async getAssets() {
    try {
      const res = await axios.get(
        `${this.baseURL}/trades/assets`,
        { headers: this.getHeaders() }
      );
      return res.data;
    } catch (error: any) {
      this.logger.error("Failed to fetch assets", error.message);
      throw error;
    }
  }

  // 3. Generate deposit address (IMPORTANT PART)
  async generateDepositAddress(assetId: string, label: string) {
    try {
      const payload = { label };

      const res = await axios.post(
        `${this.baseURL}/trades/sell/assets/${assetId}/generate-address`,
        payload,
        { headers: this.getHeaders() }
      );

      this.logger.log(`Breet address generated for label: ${label}`);

      return res.data;
    } catch (error: any) {
      this.logger.error("Failed to generate deposit address", error.message);
      throw error;
    }
  }
}