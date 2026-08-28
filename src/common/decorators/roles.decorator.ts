import { SetMetadata } from '@nestjs/common';
import { ROLES } from '../constants/role.enum';

export const ROLES_KEY = 'roles';

/** Khai báo role được phép gọi 1 endpoint, dùng chung với RolesGuard */
export const Roles = (...roles: ROLES[]) => SetMetadata(ROLES_KEY, roles);
