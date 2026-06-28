import { Transform } from 'class-transformer';
import { ApiHideProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CampaignStatus } from 'src/domain/enums/campaign-status.enum';
import { CreateCampaignDto } from './create-campaign.dto';

const normalizeString = (value: unknown) => {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const toNumber = (value: unknown) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
    }

    return value;
};

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
    @ApiPropertyOptional({
        enum: CampaignStatus,
        description: 'Administrative campaign status override',
        example: CampaignStatus.APPROVED,
    })
    @IsOptional()
    @IsEnum(CampaignStatus)
    status?: CampaignStatus;

    @ApiPropertyOptional({
        description: 'Administrative approval notes shown on campaign detail pages',
        example: 'Approved after document verification.',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.approvalNotes))
    @IsOptional()
    @IsString()
    approval_notes?: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    approvalNotes?: string;

    @ApiPropertyOptional({
        description: 'Hospital contact person name',
        example: 'Dr. Ada Okafor',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.hospitalContactPersonName))
    @IsOptional()
    @IsString()
    hospital_contact_person_name?: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    hospitalContactPersonName?: string;

    @ApiPropertyOptional({
        description: 'Updated target amount',
        example: 750000,
        minimum: 1,
    })
    @Transform(({ value, obj }) => toNumber(value ?? obj.targetAmount))
    @IsOptional()
    @IsInt()
    @Min(1)
    target_amount?: number;

    @ApiHideProperty()
    @Transform(({ value }) => toNumber(value))
    @IsOptional()
    @IsInt()
    @Min(1)
    targetAmount?: number;
}
