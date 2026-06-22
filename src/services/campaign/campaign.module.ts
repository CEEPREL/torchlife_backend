import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { UploadService } from 'src/services/upload/upload.service';
import { CLOUDINARY, CloudinaryProvider } from 'src/services/upload/providers/cloudinary.provider';
import { EmailTransportModule } from '../email-transport/email-transport.module';

@Module({
    imports: [EmailTransportModule],
    controllers: [CampaignController],
    providers: [CampaignService, UploadService, CloudinaryProvider],
})
export class CampaignModule {}
