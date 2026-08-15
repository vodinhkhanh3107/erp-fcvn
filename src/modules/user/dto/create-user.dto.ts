import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '../../../common/constants/role.enum';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) // xóa khoảng trắng thừa 2 đầu trước khi validate
  @Matches(/\S/, { message: 'Tên không được chỉ chứa khoảng trắng' }) // bắt buộc có ít nhất 1 ký tự không phải khoảng trắng
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9,10}$/, {
    message: 'Điện thoại phải là số điện thoại Việt Nam hợp lệ (vd: 0912345678 hoặc +84912345678)',
  })
  phone?: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  avatar?: string;
  // @IsOptional()
  // @IsString()
  // jobTitle?: string;
}
