import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectPurchaseRequestDto {
  @ApiProperty({ example: 'Vượt ngân sách quý III' })
  @IsNotEmpty({ message: 'reason là bắt buộc khi từ chối yêu cầu mua hàng' })
  @IsString()
  @MaxLength(500)
  reason: string;
}
