import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Phòng Nhân sự' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/\S/, { message: 'name không được chỉ chứa khoảng trắng' })
  name: string;

  @ApiPropertyOptional({ example: 'Phụ trách tuyển dụng, chấm công, lương thưởng' })
  @IsOptional()
  @IsString()
  description?: string;
}
