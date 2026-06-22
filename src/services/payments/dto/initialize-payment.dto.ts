import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentProviderKey } from 'src/domain/constants/payment-provider';

export class InitializePaymentDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({ description: 'The donor email address' })
    email: string;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ description: 'The amount to pay' })
    amount: number;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'The payment provider key' })
    provider?: PaymentProviderKey;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The transaction reference' })
    tx_ref: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The currency' })
    currency: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Additional provider metadata' })
    metadata?: Record<string, unknown>;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ApiPropertyOptional({ description: 'Allowed payment channels', type: [String] })
    channels?: string[];

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Optional callback URL' })
    callback_url?: string;
}
