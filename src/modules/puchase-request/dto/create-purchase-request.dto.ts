import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePrItemDto } from './create-purchase-item.dto';

export class CreatePurchaseRequestDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-...',
    description: 'Idempotency key do client tự sinh',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestKey?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ example: 'Mua laptop phục vụ nhân sự mới onboard' })
  @IsString()
  purposeOfUse?: string;

  @ApiPropertyOptional({ type: [CreatePrItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePrItemDto)
  items?: CreatePrItemDto[];
}
