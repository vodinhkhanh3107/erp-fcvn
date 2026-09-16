import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { CreatePrQuotationDto } from './create-purchase-quotation.dto';

export class CreatePrItemDto {
  @ApiProperty({ example: 'Màn hình máy tính' })
  @IsString()
  itemName: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  /** * Mỗi vật tư bắt buộc phải có ĐÚNG/ÍT NHẤT 2 báo giá từ 2 nhà cung cấp khác nhau — */
  @ApiProperty({ type: [CreatePrQuotationDto], minItems: 2 })
  @ValidateNested({ each: true })
  @Type(() => CreatePrQuotationDto)
  @ArrayUnique((q) => q.supplierId, { message: 'has-duplicate-supplier-in-quotations' })
  @ArrayMinSize(2, { message: 'each-item-must-have-at-least-2-supplier-quotations' })
  quotations: CreatePrQuotationDto[];
}
