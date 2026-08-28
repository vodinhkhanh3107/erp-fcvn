import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class CreateLeaveDto {
  @ApiProperty({ example: '2026-09-10' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-12' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Nghỉ phép năm' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}