import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewCampaignDto {
    @ApiPropertyOptional({
        description: 'Optional moderation notes recorded during approval or rejection',
        example: 'Documents verified against the hospital letter and patient information.',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}
