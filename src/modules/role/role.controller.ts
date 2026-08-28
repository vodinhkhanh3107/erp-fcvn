import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { PERMISSIONS } from '../../common/constants/permission.constants';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from '../permission/dto/asign-permission.dto';

@ApiTags('Role')
@ApiBearerAuth('access-token')
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermission(PERMISSIONS.ROLE_READ)
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.ROLE_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.ROLE_CREATE)
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.ROLE_UPDATE)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Put(':id/permissions')
  @RequirePermission(PERMISSIONS.ROLE_MANAGE)
  assignPermissions(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignPermissionsDto) {
    return this.roleService.assignPermissions(id, dto);
  }
}