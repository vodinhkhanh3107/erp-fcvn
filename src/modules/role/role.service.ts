import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { getRolePermissionsCacheKey } from '../../common/utils/permission-cache';
import { RedisService } from '../../common/redis/redis.service';
import { AssignPermissionsDto } from '../permission/dto/asign-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permission } from '../../models/permission.entity';
import { Role } from '../../models/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly redisService: RedisService,
  ) {}

  async findAll() {
    return this.roleRepository.find({ relations: { permissions: true }, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({ where: { id }, relations: { permissions: true } });
    if (!role) throw new NotFoundException('role-not-found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existed = await this.roleRepository.findOne({ where: { code: dto.code } });
    if (existed) throw new ConflictException('role-code-already-exists');

    const saved = await this.roleRepository.save(this.roleRepository.create({ ...dto, permissions: [] }));
    return { message: 'Tạo role thành công', result: saved };
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.findOne(id);
    Object.assign(role, dto);
    const saved = await this.roleRepository.save(role);
    return { message: 'Cập nhật role thành công', result: saved };
  }

  async assignPermissions(id: number, dto: AssignPermissionsDto) {
    const role = await this.findOne(id);

    const permissions = await this.permissionRepository.findBy({ code: In(dto.permissionCodes) });

    if(!permissions) throw new NotFoundException("not-found-permission");

    if (permissions.length !== dto.permissionCodes.length) {
      const foundCodes = new Set(permissions.map((p) => p.code));
      const missing = dto.permissionCodes.filter((c) => !foundCodes.has(c));
      throw new BadRequestException(`permission-codes-not-found: ${missing.join(', ')}`);
    }

    role.permissions = permissions;
    const saved = await this.roleRepository.save(role);

    await this.redisService.del(getRolePermissionsCacheKey(id));

    return { message: 'Cập nhật quyền cho role thành công', result: saved };
  }
}