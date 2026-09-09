export function getRolePermissionsCacheKey(roleId: number): string {
  return `role_permissions:${roleId}`;
}
