import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../models/audit-log.entity';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit-interceptor/audit.interceptor';
import { Role } from 'src/models/role.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog,Role])],
  controllers: [AuditLogController],
  providers: [AuditLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}