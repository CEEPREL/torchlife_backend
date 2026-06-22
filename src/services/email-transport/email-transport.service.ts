import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { promises as fs } from 'fs';
import { join } from 'path';
import { SendEmailDto } from './dto/email.dto';

@Injectable()
export class EmailTransportService {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(EmailTransportService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow('EMAIL_HOST'),
      port: Number(this.configService.getOrThrow('EMAIL_PORT')) || 587,
      secure: this.configService.get('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.getOrThrow('EMAIL_USER'),
        pass: this.configService.getOrThrow('EMAIL_PASSWORD'),
      },
    });
  }

  async sendMail(sendEmailDto: SendEmailDto) {
    try {
      const html = await this.resolveHtml(sendEmailDto);

      const info = await this.transporter.sendMail({
        from: this.configService.getOrThrow('EMAIL_SENDER'),
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        html,
      });

      this.logger.log(
        `Email sent to ${sendEmailDto.to} (Message ID: ${info.messageId})`,
      );

      return info;
    } catch (error) {
      this.logger.error(`Email sending failed: ${error}`);
      throw error;
    }
  }

  private async resolveHtml(sendEmailDto: SendEmailDto) {
    if (this.looksLikeHtml(sendEmailDto.content)) {
      return sendEmailDto.content;
    }

    if (sendEmailDto.templateName) {
      const templateContent = await fs.readFile(await this.resolveTemplatePath(sendEmailDto.templateName), 'utf-8');

      return templateContent
        .replace(/{{\s*name\s*}}/g, sendEmailDto.name || '')
        .replace(/{{\s*content\s*}}/g, sendEmailDto.content || '');
    }

    return `<div><p>Hello ${sendEmailDto.name},</p><p>${sendEmailDto.content}</p></div>`;
  }

  private async resolveTemplatePath(templateName: string) {
    const templateFile = templateName.endsWith('.html') ? templateName : `${templateName}.html`;
    const candidatePaths = [
      join(process.cwd(), 'dist', 'domain', 'email-templates', templateFile),
      join(process.cwd(), 'src', 'domain', 'email-templates', templateFile),
      join(__dirname, '..', '..', 'domain', 'email-templates', templateFile),
    ];

    for (const candidatePath of candidatePaths) {
      try {
        await fs.access(candidatePath);
        return candidatePath;
      } catch {
        continue;
      }
    }

    return candidatePaths[0];
  }

  private looksLikeHtml(content: string) {
    return /<\/?[a-z][\s\S]*>/i.test(content);
  }

  // async sendMail(sendEmailDto: SendEmailDto) {
  //     // const isDev = process.env.NODE_ENV !== 'production';
  //     // const templatePath = isDev
  //     //     ? join(__dirname, '..', 'email-templates', 'welcome.html') // during dev
  //     //     : join(__dirname, '..', '..', 'email-templates', sendEmailDto.templateName); // in dist
  //     // const templateContent = fs.readFileSync(templatePath, 'utf-8');
  //     try {
  //         const info = await this.transporter.sendMail({
  //             from: this.configService.getOrThrow('EMAIL_SENDER'),
  //             to: sendEmailDto.to,
  //             subject: sendEmailDto.subject,
  //             html: sendEmailDto.content
  //                 .replace('{{content}}', sendEmailDto.content)
  //                 .replace('{{name}}', sendEmailDto.name),
  //         });
  //         this.logger.log(`Email sent: ${info.messageId}`);
  //         return info;
  //     } catch (error) {
  //         this.logger.error(`Failed to send email: ${error.message}`);
  //         throw error;
  //     }
  // }
}
