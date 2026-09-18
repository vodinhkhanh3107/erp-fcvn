import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, ValidateNested } from 'class-validator';
import { CreateGoodReceiptItemDto } from './create-good-receipt-item.dto';

export class CreateGoodReceiptDto {
  @IsInt()
  poId: number;

  @ArrayMinSize(1, { message: 'GRN phải có ít nhất 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateGoodReceiptItemDto)
  items: CreateGoodReceiptItemDto[];
}
