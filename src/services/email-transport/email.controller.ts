import { Controller, Get } from '@nestjs/common';
import { EmailService } from './email-transport.service';

@Controller('test')
export class TestController {
  constructor(private readonly emailService: EmailService) {}

  @Get('email')
  async testEmail() {
    try {
    await this.emailService.sendEmail(
      'bankoleazeezb98@gmail.com',
      'Brevo Test',
      `
      <h2>Brevo is working! 🎉</h2>',
      `
    );

    return { message: 'Email sent!' };
} catch (err: any) {
    console.error("Failed to test", err)
}
  }
}