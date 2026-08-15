import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO phân trang dùng chung — mọi module có API "xem danh sách" sau này
 * (Task, Department, KPI...) chỉ cần extends class này thay vì viết lại
 * page/limit/keyword từ đầu.
 */
export class PaginationDto {
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
  @IsString()
  keyword?: string;
}
