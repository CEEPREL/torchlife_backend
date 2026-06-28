import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateMarketingMetadataDto {
    @ApiPropertyOptional({
        description: 'Interests the user has shown across campaigns',
        type: [String],
        example: ['maternal-health', 'emergency-care'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    campaignInterest?: string[];

    @ApiPropertyOptional({
        description: 'Campaign categories tracked on the client side',
        type: [String],
        example: ['urgent', 'milestone'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    campaignCategories?: string[];

    @ApiPropertyOptional({
        description: 'Recently viewed campaign identifiers',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    recentlyViewedCampaignIds?: string[];

    @ApiPropertyOptional({
        description: 'Tracking source for the user session',
        example: 'render-landing-page',
    })
    @IsOptional()
    @IsString()
    source?: string;

    @ApiPropertyOptional({
        description: 'Referrer captured on the client side',
        example: 'https://torchlife.co/campaigns',
    })
    @IsOptional()
    @IsString()
    referrer?: string;

    @ApiPropertyOptional({
        description: 'Additional cookie or browser metadata to persist for marketing analysis',
        example: { preferredCurrency: 'NGN', consent: true },
    })
    @IsOptional()
    @IsObject()
    cookieMetadata?: Record<string, unknown>;
}
