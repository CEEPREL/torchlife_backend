import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
    @ApiProperty({
        description: 'Google ID token credential returned by Google Identity Services',
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
    })
    @IsString()
    @IsNotEmpty()
    credential: string;
}
