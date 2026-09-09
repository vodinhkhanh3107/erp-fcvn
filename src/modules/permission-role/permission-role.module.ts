import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from 'src/models/permission.entity';
import { Role } from 'src/models/role.entity';
import { RoleController } from '../role/role.controller';
import { PermissionController } from '../permission/permission.controller';
import { RoleService } from '../role/role.service';
import { PermissionService } from '../permission/permission.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  controllers: [RoleController, PermissionController],
  providers: [RoleService, PermissionService],
  exports: [TypeOrmModule],
})
export class PermissionRoleModule {}
