import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreatePrItemDto } from "./create-purchase-item.dto";
import { CreatePrQuotationDto } from "./create-purchase-quotation.dto";

export class CreatePurchaseRequestDto {
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