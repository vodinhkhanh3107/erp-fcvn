import { Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListAuditLogDto } from './dto/list-audit-log.dto';
import { AuditAction, AuditLog } from './entities/audit-log.entity';
import { AppLogger } from 'src/common/logger/app-logger.service';

export interface RecordAuditLogInput {
    actorId: number;
    actorRole: string;
    action: AuditAction;
    entityType: string;
    entityId?: number;
    method: string;
    path: string;
    requestBody?: unknown;
    statusCode: number;
    success: boolean;
    errorMessage?: string;
}

@Injectable()
export class AuditLogService {
    private readonly logger = new AppLogger();
    constructor(
        @InjectRepository(AuditLog)
        private readonly repository: Repository<AuditLog>,

    ) { }

    async record(input: RecordAuditLogInput): Promise<void> {
        try {
            const entity = this.repository.create({
                ...input,
                requestBody: input.requestBody ? JSON.stringify(input.requestBody) : undefined,
            });
            await this.repository.save(entity);
        } catch (err) {
            this.logger.error('Ghi audit log thất bại');
        }
    }

    async findAll(query: ListAuditLogDto) {
        const { page, limit, entityType, entityId, actorId, action } = query;

        const where: Record<string, any> = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (actorId) where.actorId = actorId;
        if (action) where.action = action;

        const [items, total] = await this.repository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
}