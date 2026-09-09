import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsString, Matches } from 'class-validator';
import { TaskPriority } from '../../../models/task.entity';

export class CreateTaskDto {
  @ApiProperty({ example: 'Chuẩn bị báo cáo Q3' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/\S/, { message: 'taskName không được chỉ chứa khoảng trắng' })
  taskName: string;

  @ApiProperty({ example: 'Báo cáo' })
  @IsNotEmpty()
  @IsString()
  taskType: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  deadline: string;

  @ApiProperty({ example: 1, description: 'ID nhân sự phụ trách' })
  @IsInt()
  assignedTo: number;
}
