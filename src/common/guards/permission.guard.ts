import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { RedisService } from '../redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/models/role.entity';
import { getRolePermissionsCacheKey } from '../utils/permission-cache';

const ROLE_PERMISSIONS_CACHE_TTL_SECONDS = 300;
 
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}
 
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
 
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
 
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.roleId) throw new ForbiddenException('access-denied');
 
    const permissionCodes = await this.getRolePermissionCodes(user.roleId);
 
    const hasPermission = requiredPermissions.some((required) => {
      const resource = required.split('.')[0];
      return permissionCodes.has(required) || permissionCodes.has(`${resource}.manage`);
    });
 
    if (!hasPermission) throw new ForbiddenException('access-denied');
    return true;
  }
 
  private async getRolePermissionCodes(roleId: number): Promise<Set<string>> {
    const cacheKey = getRolePermissionsCacheKey(roleId);
 
    const cached = await this.redisService.get(cacheKey);
    if (cached) return new Set(JSON.parse(cached));
 
    const role = await this.roleRepository.findOne({ where: { id: roleId }, relations: { permissions: true } });
    const codes = (role?.permissions ?? []).map((p) => p.code);
 
    await this.redisService.set(cacheKey, JSON.stringify(codes), ROLE_PERMISSIONS_CACHE_TTL_SECONDS);
    return new Set(codes);
  }
}