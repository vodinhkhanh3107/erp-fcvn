import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'user.manage', description: 'Dạng "resource.action"' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+\.[a-z0-9-]+$/, { message: 'code phải đúng dạng "resource.action"' })
  code: string;

  @ApiPropertyOptional({ example: 'Toàn quyền quản lý nhân sự' })
  @IsOptional()
  @IsString()
  description?: string;
}
