import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export class IssuePoItemSelectionDto {
  @ApiProperty({ example: 5, description: 'ID của PurchaseRequestItem (vật tư) trong yêu cầu mua' })
  @IsInt()
  @Type(() => Number)
  itemId: number;

  @ApiProperty({ example: 2, description: 'ID nhà cung cấp được chọn cho RIÊNG vật tư này' })
  @IsInt()
  @Type(() => Number)
  selectedSupplierId: number;
}

export class IssuePoDto {
  @ApiPropertyOptional({ example: 'NET30' })
  @IsOptional()
  @IsString()
  paymentTerm?: string;

  @ApiProperty({ type: [IssuePoItemSelectionDto], minItems: 1 })
  @ValidateNested({ each: true })
  @Type(() => IssuePoItemSelectionDto)
  @ArrayMinSize(1)
  selections: IssuePoItemSelectionDto[];
}
