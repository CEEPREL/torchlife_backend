import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ReviewDocumentRequestDto {
    @ApiProperty({
        description: 'Whether the supporting document request should be approved',
        example: true,
    })
    @IsBoolean()
    approve: boolean;
}
