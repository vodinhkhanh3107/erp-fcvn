import { IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSupplierGroupDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/\S/, { message: 'name không được chỉ chứa khoảng trắng' })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
