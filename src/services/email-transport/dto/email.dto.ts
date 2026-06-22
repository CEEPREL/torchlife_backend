import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendEmailDto {
    @ApiProperty({
        description: 'Recipient email address',
        example: 'user@example.com',
    })
    @IsEmail()
    to: string;

    @ApiProperty({
        description: 'Subject of the email',
        example: 'Welcome to our service!',
    })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({
        description: 'Name of the recipient',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Main content or message to include in the email',
        example: "Thanks for signing up! We're glad to have you.",
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiPropertyOptional({
        description: 'The name of the HTML template file to use (without extension)',
        example: 'welcome',
    })
    @IsOptional()
    @IsString()
    templateName?: string;
}
