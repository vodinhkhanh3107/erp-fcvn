import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { CreatePrItemDto } from "./create-purchase-item.dto";
import { Type } from "class-transformer";
import { CreatePrQuotationDto } from "./create-purchase-quotation.dto";
import { PrimaryGeneratedColumn } from "typeorm";

export class CreatePurchaseRequestDto {

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-...', description: 'Idempotency key do client tự sinh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestKey?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ example: 'Mua laptop phục vụ nhân sự mới onboard' })
  @IsOptional()
  @IsString()
  purposeOfUse?: string;

  @ApiPropertyOptional({ type: [CreatePrItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePrItemDto)
  items?: CreatePrItemDto[];

  @ApiPropertyOptional({ type: [CreatePrQuotationDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePrQuotationDto)
  quotations?: CreatePrQuotationDto[];
}