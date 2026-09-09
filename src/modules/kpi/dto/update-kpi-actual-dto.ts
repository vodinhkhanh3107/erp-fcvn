import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateKpiActualDto {
  @ApiProperty({ example: 92 })
  @IsNumber()
  @Min(0)
  actualValue: number;
}
