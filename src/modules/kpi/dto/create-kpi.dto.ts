import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, Min } from 'class-validator';

export class CreateKpiDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: '2026-08-23', description: 'Kỳ báo cáo: Month/Quarter/Year' })
  @IsDateString()
  period: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  targetValue: number;

  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  actualValue: number;
}
