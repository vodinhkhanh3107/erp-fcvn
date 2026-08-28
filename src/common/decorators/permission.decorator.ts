import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS } from '../constants/permission.constants';

export const PERMISSION_KEY = 'permission';

type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const RequirePermission = (...permissions: PermissionCode[]) => SetMetadata(PERMISSION_KEY, permissions);