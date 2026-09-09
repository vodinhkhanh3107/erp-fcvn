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
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_log_service_1 = require("../audit-log.service");
const audit_log_entity_1 = require("../../../models/audit-log.entity");
const typeorm_1 = require("@nestjs/typeorm");
const role_entity_1 = require("../../../models/role.entity");
const typeorm_2 = require("typeorm");
const SENSITIVE_FIELDS = [
    'password',
    'currentPassword',
    'newPassword',
    'refreshToken',
    'accessToken',
];
function sanitizeBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const clone = { ...body };
    for (const field of SENSITIVE_FIELDS) {
        if (field in clone)
            clone[field] = '***';
    }
    return clone;
}
function methodToAction(method) {
    switch (method) {
        case 'POST':
            return audit_log_entity_1.AuditAction.CREATE;
        case 'PUT':
        case 'PATCH':
            return audit_log_entity_1.AuditAction.UPDATE;
        case 'DELETE':
            return audit_log_entity_1.AuditAction.DELETE;
        default:
            return null;
    }
}
function extractEntityType(path) {
    return path.split('?')[0].split('/').filter(Boolean)[0] ?? 'unknown';
}
function extractEntityId(path) {
    const segments = path.split('?')[0].split('/').filter(Boolean);
    const idSegment = segments[1];
    const id = Number(idSegment);
    return Number.isInteger(id) ? id : undefined;
}
let AuditInterceptor = class AuditInterceptor {
    constructor(auditLogService, roleRepository) {
        this.auditLogService = auditLogService;
        this.roleRepository = roleRepository;
    }
    async intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, originalUrl, body, user } = request;
        const action = methodToAction(method);
        if (!action || !user) {
            return next.handle();
        }
        const role = await this.roleRepository.findOneBy({ id: user.roleId });
        return next.handle().pipe((0, operators_1.tap)({
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
        }));
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService,
        typeorm_2.Repository])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map