import { Injectable } from '@nestjs/common';
import * as brevo from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  private apiInstance: brevo.TransactionalEmailsApi;

  constructor() {
    this.apiInstance = new brevo.TransactionalEmailsApi();

    this.apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!,
    );
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
  ) {
    const email = new brevo.SendSmtpEmail();

    email.sender = {
      email: process.env.BREVO_SENDER_EMAIL!,
      name: process.env.BREVO_SENDER_NAME!,
    };

    email.to = [
      {
        email: to,
      },
    ];

    email.subject = subject;
    email.htmlContent = htmlContent;

    try {
      const response = await this.apiInstance.sendTransacEmail(email);
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}