"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permission_decorator_1 = require("../decorators/permission.decorator");
const redis_service_1 = require("../redis/redis.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../../models/role.entity");
const permission_cache_1 = require("../utils/permission-cache");
const ROLE_PERMISSIONS_CACHE_TTL_SECONDS = 300;
let PermissionGuard = class PermissionGuard {
    constructor(reflector, redisService, roleRepository) {
        this.reflector = reflector;
        this.redisService = redisService;
        this.roleRepository = roleRepository;
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permission_decorator_1.PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPermissions || requiredPermissions.length === 0)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user?.roleId)
            throw new common_1.ForbiddenException('not-have-role-for-user');
        const permissionCodes = await this.getRolePermissionCodes(user.roleId);
        const hasPermission = requiredPermissions.some((required) => {
            const resource = required.split('.')[0];
            return permissionCodes.has(required) || permissionCodes.has(`${resource}.manage`);
        });
        if (!hasPermission)
            throw new common_1.ForbiddenException('not-have-permission');
        return true;
    }
    async getRolePermissionCodes(roleId) {
        const cacheKey = (0, permission_cache_1.getRolePermissionsCacheKey)(roleId);
        const cached = await this.redisService.get(cacheKey);
        if (cached)
            return new Set(JSON.parse(cached));
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
            relations: { permissions: true },
        });
        const codes = (role?.permissions ?? []).map((p) => p.code);
        await this.redisService.set(cacheKey, JSON.stringify(codes), ROLE_PERMISSIONS_CACHE_TTL_SECONDS);
        return new Set(codes);
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [core_1.Reflector,
        redis_service_1.RedisService,
        typeorm_2.Repository])
], PermissionGuard);
//# sourceMappingURL=permission.guard.js.map