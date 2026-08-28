import { IsEnum } from 'class-validator';
import { UserStatus } from '../../../models/user.entity';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
