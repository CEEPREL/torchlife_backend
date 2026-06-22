import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class RequestCampaignExtensionDto {
  @ApiProperty({
    description: 'Requested new campaign deadline (ISO string)',
    example: '2026-12-31T23:59:59Z',
  })
  @IsNotEmpty()
  @IsDateString()
  requested_deadline: string;
}
