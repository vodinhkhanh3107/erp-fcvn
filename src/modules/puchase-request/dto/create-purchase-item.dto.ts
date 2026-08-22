import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreatePrItemDto {
  @ApiProperty({ example: 'Laptop Dell XPS 15' })
  @IsNotEmpty()
  @IsString()
  itemName: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1, { message: 'quantity phải > 0' })
  quantity: number;
}
