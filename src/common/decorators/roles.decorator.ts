import { SetMetadata } from '@nestjs/common';
import { Role } from '../constants/role.enum';

export const ROLES_KEY = 'roles';

/** Khai báo role được phép gọi 1 endpoint, dùng chung với RolesGuard */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
