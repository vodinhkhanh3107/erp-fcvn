import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { GoodReceiptStatus } from '../../../models/good-receipt.entity';

export class ListGoodReceiptDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  poId?: number;

  @IsOptional()
  @IsEnum(GoodReceiptStatus)
  status?: GoodReceiptStatus;
}
