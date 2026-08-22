import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreatePrItemDto } from './create-purchase-item.dto';
import { CreatePrQuotationDto } from './create-purchase-quotation.dto';

export class CreatePurchaseRequestDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-...',
    description:
      'Idempotency key do CLIENT tự sinh (khuyến nghị dùng UUID) — giữ NGUYÊN giá trị này ' +
      'nếu phải gửi lại request do lỗi mạng/timeout, KHÔNG sinh key mới. Server dùng để ' +
      'phát hiện và chặn tạo trùng khi cùng 1 lần submit bị gửi đi nhiều lần.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestKey?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @ApiProperty({ example: 'Mua laptop phục vụ nhân sự mới onboard' })
  @IsNotEmpty()
  @IsString()
  purposeOfUse: string;

  @ApiProperty({ type: [CreatePrItemDto] })
  @ArrayMinSize(1, { message: 'PR phải có ít nhất 1 item (BR-01)' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrItemDto)
  items: CreatePrItemDto[];

  @ApiProperty({ type: [CreatePrQuotationDto], minItems: 2 })
  @ArrayMinSize(2, { message: 'PR phải có tối thiểu 2 nhà cung cấp báo giá (BR-02)' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrQuotationDto)
  quotations: CreatePrQuotationDto[];
}
