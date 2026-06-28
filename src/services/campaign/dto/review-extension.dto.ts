import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ReviewCampaignExtensionDto {
  @ApiProperty({
    description: 'Approve (true) or reject (false) the pending extension request',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  approve: boolean;
}
