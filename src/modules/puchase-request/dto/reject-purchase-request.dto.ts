import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class RejectPurchaseRequestDto {
  @ApiPropertyOptional({ example: 'Vượt ngân sách quý' })
  @IsOptional()
  @IsString()
  reason?: string;
}