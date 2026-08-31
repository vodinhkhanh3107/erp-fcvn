import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../audit-log.service';
import { AuditAction } from '../../../models/audit-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/models/role.entity';
import { Repository } from 'typeorm';

const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'refreshToken', 'accessToken'];

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const clone: Record<string, any> = { ...(body as Record<string, any>) };
  for (const field of SENSITIVE_FIELDS) {
    if (field in clone) clone[field] = '***';
  }
  return clone;
}

function methodToAction(method: string): AuditAction | null {
  switch (method) {
    case 'POST':
      return AuditAction.CREATE;
    case 'PUT':
    case 'PATCH':
      return AuditAction.UPDATE;
    case 'DELETE':
      return AuditAction.DELETE;
    default:
      return null;
  }
}

function extractEntityType(path: string): string {
  return path.split('?')[0].split('/').filter(Boolean)[0] ?? 'unknown';
}

function extractEntityId(path: string): number | undefined {
  const segments = path.split('?')[0].split('/').filter(Boolean);
  const idSegment = segments[1];
  const id = Number(idSegment);
  return Number.isInteger(id) ? id : undefined;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, body, user } = request;

    const action = methodToAction(method);

    if (!action || !user) {
      return next.handle();
    }

    const role = await this.roleRepository.findOneBy({ id: user.roleId });


    return next.handle().pipe(
      tap({
        next: () => {
          void this.auditLogService.record({
            actorId: user.userId,
            actorRole: role.name,
            action,
            entityType: extractEntityType(originalUrl),
            entityId: extractEntityId(originalUrl),
            method,
            path: originalUrl,
            requestBody: sanitizeBody(body),
            statusCode: context.switchToHttp().getResponse().statusCode,
            success: true,
          });
        },
        error: (err) => {
          void this.auditLogService.record({
            actorId: user.userId,
            actorRole: role.name,
            action,
            entityType: extractEntityType(originalUrl),
            entityId: extractEntityId(originalUrl),
            method,
            path: originalUrl,
            requestBody: sanitizeBody(body),
            statusCode: err.status ?? 500,
            success: false,
            errorMessage: err.message,
          });
        },
      }),
    );
  }
}