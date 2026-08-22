import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePrQuotationDto {
  @ApiProperty({ example: 1, description: 'ID nhà cung cấp báo giá' })
  @IsInt()
  supplierId: number;

  @ApiProperty({ example: 45000000 })
  @IsNumber()
  @Min(0)
  quotedAmount: number;

  @ApiPropertyOptional({ example: 'https://files.example.com/quote-ncc1.pdf' })
  @IsOptional()
  @IsString()
  quotationFileUrl?: string;
}
