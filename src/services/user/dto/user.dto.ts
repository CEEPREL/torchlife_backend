import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from 'class-validator';

export enum UserRole {
    USER = 'USER',
    PROXY = 'PROXY',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export class UserDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'The email address of the user',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'StrongPassword123!',
        description: 'User password (must contain upper, lower, number, and symbol)',
        minLength: 8,
    })
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;

    @ApiProperty({
        example: 'John',
        description: 'User first name',
    })
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @ApiProperty({
        example: 'Doe',
        description: 'User last name',
    })
    @IsString()
    @IsNotEmpty()
    last_name: string;

    @ApiPropertyOptional({
        example: '+2348012345678',
        description: 'User phone number in international format',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    phone_number?: string;

    @ApiProperty({
        example: 'Boluwatife',
        description: 'Preferred philanthropic display name (must be unique)',
    })
    @IsString()
    @IsNotEmpty()
    philanthropic_name: string;

    @ApiProperty({
        enum: UserRole,
        example: UserRole.USER,
        description: 'Role assigned to the user',
    })
    @IsOptional()
    @IsEnum(UserRole)
    role: UserRole;

    @ApiPropertyOptional({
        example: 'Nigeria',
        description: 'Country of residence for the user',
    })
    @IsOptional()
    @IsString()
    countryOfResidence?: string;
}
