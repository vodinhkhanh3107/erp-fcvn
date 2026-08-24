import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApprovePurchaseRequestDto {
  @ApiPropertyOptional({ example: 'Đã kiểm tra ngân sách, đồng ý duyệt' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}