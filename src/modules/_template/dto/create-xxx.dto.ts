import { IsNotEmpty, IsString } from 'class-validator';

export class CreateXxxDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
