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
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permission_cache_1 = require("../../common/utils/permission-cache");
const redis_service_1 = require("../../common/redis/redis.service");
const permission_entity_1 = require("../../models/permission.entity");
const role_entity_1 = require("../../models/role.entity");
let RoleService = class RoleService {
    constructor(roleRepository, permissionRepository, redisService) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.redisService = redisService;
    }
    async findAll() {
        return this.roleRepository.find({ relations: { permissions: true }, order: { id: 'ASC' } });
    }
    async findOne(id) {
        const role = await this.roleRepository.findOne({ where: { id }, relations: { permissions: true } });
        if (!role)
            throw new common_1.NotFoundException('role-not-found');
        return role;
    }
    async create(dto) {
        const existed = await this.roleRepository.findOne({ where: { code: dto.code } });
        if (existed)
            throw new common_1.ConflictException('role-code-already-exists');
        const saved = await this.roleRepository.save(this.roleRepository.create({ ...dto, permissions: [] }));
        return { message: 'Tạo role thành công', result: saved };
    }
    async update(id, dto) {
        const role = await this.findOne(id);
        Object.assign(role, dto);
        const saved = await this.roleRepository.save(role);
        return { message: 'Cập nhật role thành công', result: saved };
    }
    async assignPermissions(id, dto) {
        const role = await this.findOne(id);
        const permissions = await this.permissionRepository.findBy({ code: (0, typeorm_2.In)(dto.permissionCodes) });
        if (!permissions)
            throw new common_1.NotFoundException("not-found-permission");
        if (permissions.length !== dto.permissionCodes.length) {
            const foundCodes = new Set(permissions.map((p) => p.code));
            const missing = dto.permissionCodes.filter((c) => !foundCodes.has(c));
            throw new common_1.BadRequestException(`permission-codes-not-found: ${missing.join(', ')}`);
        }
        role.permissions = permissions;
        const saved = await this.roleRepository.save(role);
        await this.redisService.del((0, permission_cache_1.getRolePermissionsCacheKey)(id));
        return { message: 'Cập nhật quyền cho role thành công', result: saved };
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], RoleService);
//# sourceMappingURL=role.service.js.map