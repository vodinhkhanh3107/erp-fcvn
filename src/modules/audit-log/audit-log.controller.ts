import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogService } from './audit-log.service';
import { ListAuditLogDto } from './dto/list-audit-log.dto';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/common/constants/permission.constants';

@ApiTags('Audit Log')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @RequirePermission(PERMISSIONS.AUDIT_LOG_READ)
  findAll(@Query() query: ListAuditLogDto) {
    return this.auditLogService.findAll(query);
  }
}