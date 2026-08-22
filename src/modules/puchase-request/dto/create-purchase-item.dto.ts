import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Min } from "class-validator";

export class CreatePrItemDto {
  @ApiProperty({ example: 'Laptop Dell XPS 15' })
  @IsNotEmpty()
  @IsString()
  itemName: string;

  @ApiProperty({ example: 2 })
  @Min(1, { message: 'quantity phải > 0 (BR-03)' }) // BR-03
  quantity: number;
}