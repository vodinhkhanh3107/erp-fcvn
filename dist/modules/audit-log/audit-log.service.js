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
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("../../models/audit-log.entity");
const app_logger_service_1 = require("../../common/logger/app-logger.service");
let AuditLogService = class AuditLogService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new app_logger_service_1.AppLogger();
    }
    async record(input) {
        try {
            const entity = this.repository.create({
                ...input,
                requestBody: input.requestBody ? JSON.stringify(input.requestBody) : undefined,
            });
            await this.repository.save(entity);
        }
        catch (err) {
            this.logger.error('Ghi audit log thất bại');
        }
    }
    async findAll(query) {
        const { page, limit, entityType, entityId, actorId, action } = query;
        const where = {};
        if (entityType)
            where.entityType = entityType;
        if (entityId)
            where.entityId = entityId;
        if (actorId)
            where.actorId = actorId;
        if (action)
            where.action = action;
        const [items, total] = await this.repository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map