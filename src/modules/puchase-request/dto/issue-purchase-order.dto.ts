import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class IssuePoDto {
  @ApiProperty({
    example: 1,
    description: 'ID nhà cung cấp được chọn (phải nằm trong danh sách đã báo giá)',
  })
  @IsInt()
  selectedSupplierId: number;

  @ApiPropertyOptional({
    example: 'NET30',
    description: 'Điều khoản thanh toán cho PO — bỏ trống nếu chưa xác định',
  })
  @IsOptional()
  @IsString()
  paymentTerm?: string;
}
