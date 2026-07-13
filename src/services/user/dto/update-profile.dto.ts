import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John', description: 'Updated first name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Updated last name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  last_name?: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Updated phone number',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone_number?: string;

  @ApiPropertyOptional({
    example: 'Boluwatife',
    description: 'Preferred philanthropic display name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  philanthropic_name?: string;
}
