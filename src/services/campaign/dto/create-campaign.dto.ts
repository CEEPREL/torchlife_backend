import { Transform } from 'class-transformer';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    ValidateIf,
    IsPhoneNumber,
    IsEmail,
    IsDateString,
    IsInt,
    Min,
    IsEnum,
    IsOptional,
} from 'class-validator';

export enum CampaignType {
    USER = 'USER',
    PROXY = 'PROXY',
}

export enum CampaignPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

export enum CampaignCurrency {
    NGN = 'NGN',
    USD = 'USD',
}

const normalizeString = (value: unknown) => {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const toStringArray = (value: unknown) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    if (Array.isArray(value)) {
        return value
            .map((entry) => normalizeString(entry))
            .filter((entry): entry is string => typeof entry === 'string');
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();

        if (!trimmed) {
            return undefined;
        }

        try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (Array.isArray(parsed)) {
                return parsed
                    .map((entry) => normalizeString(entry))
                    .filter((entry): entry is string => typeof entry === 'string');
            }
        } catch {
            return [trimmed];
        }

        return [trimmed];
    }

    return undefined;
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

export class CreateCampaignDto {
    @ApiProperty({
        enum: CampaignType,
        enumName: 'CampaignType',
        description: 'Whether the campaign is for self or as a proxy for another beneficiary',
        example: CampaignType.USER,
    })
    @IsEnum(CampaignType)
    type: CampaignType;

    @ApiProperty({
        description: 'Title of the crowdfunding campaign',
        example: 'Medical Support for Baby John',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: 'The compelling story behind the campaign',
        example: 'John is a 2-year old battling a rare condition...',
    })
    @IsString()
    @IsNotEmpty()
    story: string;

    @ApiPropertyOptional({
        type: [String],
        description: 'URLs to medical records or additional proof docs. Accepts `records` or legacy `record`.',
        example: ['https://res.cloudinary.com/demo/image/upload/records.jpg'],
    })
    @Transform(({ value, obj }) => toStringArray(value ?? obj.record))
    @IsOptional()
    @IsString({ each: true })
    records?: string[];

    @ApiHideProperty()
    @Transform(({ value }) => toStringArray(value))
    @IsOptional()
    @IsString({ each: true })
    record?: string[];

    @ApiPropertyOptional({
        description: 'URL to certified PDF document from a medical institution',
        example: 'https://res.cloudinary.com/demo/image/upload/cert.pdf',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.certifiedPdf))
    @IsOptional()
    @IsString()
    certified_pdf?: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    certifiedPdf?: string;

    @ApiPropertyOptional({
        description: 'Main cover image for the campaign',
        example: 'https://res.cloudinary.com/demo/image/upload/cover.jpg',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.imageUrl))
    @IsOptional()
    @IsString()
    image_url?: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiPropertyOptional({
        description: 'The target date when the campaign should end',
        example: '2024-12-31T23:59:59Z',
    })
    @IsOptional()
    @IsDateString()
    deadline?: string;

    @ApiProperty({
        description: 'The total amount of money needed for the campaign',
        example: 500000,
        minimum: 1,
    })
    @Transform(({ value, obj }) => toNumber(value ?? obj.targetAmount))
    @IsInt()
    @Min(1)
    target_amount: number;

    @ApiHideProperty()
    @Transform(({ value }) => toNumber(value))
    @IsOptional()
    @IsInt()
    @Min(1)
    targetAmount?: number;

    @ApiPropertyOptional({
        description: 'Campaign location',
        example: 'Lagos, Nigeria',
    })
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({
        description: 'Hospital or medical facility name',
        example: 'Lagos University Teaching Hospital',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.hospitalName))
    @IsOptional()
    @IsString()
    hospital_name?: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    hospitalName?: string;

    @ApiPropertyOptional({
        description: 'Hospital contact information',
        example: '+2348012345678',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.hospitalContact))
    @IsOptional()
    @IsString()
    hospital_contact?: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    hospitalContact?: string;

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
        enum: CampaignPriority,
        example: CampaignPriority.LOW,
    })
    @IsOptional()
    @IsEnum(CampaignPriority)
    priority?: CampaignPriority;

    @ApiPropertyOptional({
        enum: CampaignCurrency,
        example: CampaignCurrency.NGN,
    })
    @IsOptional()
    @IsEnum(CampaignCurrency)
    currency?: CampaignCurrency;

    @ApiProperty({
        required: false,
        description: 'Name of the beneficiary if the campaign is a proxy type',
        example: 'John Smith',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.proxy_name))
    @ValidateIf((o) => o.type === CampaignType.PROXY)
    @IsString()
    @IsNotEmpty()
    proxyName: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    proxy_name?: string;

    @ApiProperty({
        required: false,
        description: 'Phone number of the beneficiary if the campaign is a proxy type',
        example: '+2348012345678',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.proxy_phone))
    @ValidateIf((o) => o.type === CampaignType.PROXY)
    @IsPhoneNumber('NG')
    proxyPhone: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    proxy_phone?: string;

    @ApiProperty({
        required: false,
        description: 'Email of the beneficiary if the campaign is a proxy type',
        example: 'john.smith@example.com',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.proxy_email))
    @ValidateIf((o) => o.type === CampaignType.PROXY)
    @IsEmail()
    proxyEmail: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    proxy_email?: string;

    @ApiPropertyOptional({
        description: 'Campaign manager notes or additional guidance for reviewers and donors',
        example: 'Doctors have asked that this emergency surgery is completed before the weekend.',
    })
    @Transform(({ value, obj }) => normalizeString(value ?? obj.proxy_note))
    @IsOptional()
    @IsString()
    proxyNote?: string;

    @ApiHideProperty()
    @Transform(({ value }) => normalizeString(value))
    @IsOptional()
    @IsString()
    proxy_note?: string;
}
