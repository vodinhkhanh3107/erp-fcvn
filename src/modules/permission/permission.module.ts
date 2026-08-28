import { Global, Module } from '@nestjs/common';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RoleModule } from '../role/role.module';
import { PermissionService } from './permission.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RoleModule])], 
  providers: [PermissionGuard],
  exports: [PermissionGuard],
})
export class PermissionsModule {}