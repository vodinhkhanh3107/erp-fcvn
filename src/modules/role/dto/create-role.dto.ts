import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'marketing',
    description: 'Mã role — chữ thường, không dấu, dùng trong code',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'code chỉ gồm chữ thường, số, dấu gạch ngang' })
  code: string;

  @ApiProperty({ example: 'Marketing' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Phòng Marketing — chỉ xem, không sửa dữ liệu nhân sự' })
  @IsOptional()
  @IsString()
  description?: string;
}
