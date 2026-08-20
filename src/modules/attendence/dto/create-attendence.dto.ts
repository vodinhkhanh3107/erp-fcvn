import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMilitaryTime, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateAttendanceDto {
  @ApiProperty({ example: 1, description: 'ID nhân sự chấm công' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '08:00', description: 'Giờ vào (HH:mm)' })
  @IsNotEmpty()
  @IsMilitaryTime()
  checkIn: string;

  @ApiProperty({ example: '17:30', description: 'Giờ ra (HH:mm)' })
  @IsNotEmpty()
  @IsMilitaryTime()
  checkOut: string;
}
