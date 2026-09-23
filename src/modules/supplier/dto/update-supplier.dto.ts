import { IsEmail, IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSupplierDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/\S/, { message: 'name không được chỉ chứa khoảng trắng' })
  name?: string;

  @IsOptional()
  @IsString()
  taxCode?: string;

  @IsOptional()
  @IsString()
  contactName: string;

  @IsOptional()
  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9,10}$/, {
    message: 'contactPhone phải là số điện thoại Việt Nam hợp lệ',
  })
  contactPhone: string;

  @IsOptional()
  @IsString()
  paymentTerm: string;

  @IsOptional()
  @IsInt()
  groupId: number;
}
