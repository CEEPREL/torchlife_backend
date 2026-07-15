import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class InitializeVantDonationDto {
  @ApiProperty({
    description: 'The unique identifier of the campaign being donated to',
    example: '4316c5d5-1432-487b-8e43-0acf60162a7b',
  })
  @IsString()
  @IsNotEmpty()
  campaignId!: string;

  @ApiProperty({
    description: 'Donation amount in Naira (e.g. 5000 for 5,000 NGN)',
    example: 5000,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({
    description: 'Donor email used for payment, receipts, and donation-to-user linking',
    example: 'donor@example.com',
  })
  @IsEmail()
  donorEmail!: string;

  @ApiProperty({
    description: 'Donor email confirmation. Must exactly match donorEmail',
    example: 'donor@example.com',
  })
  @IsEmail()
  confirmDonorEmail!: string;

  @ApiPropertyOptional({
    description: 'Optional support tip added on top of the donation amount',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  tipAmount?: number = 0;

  @ApiPropertyOptional({
    description: 'Whether the donation should be recorded as anonymous on the campaign',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean = false;
}