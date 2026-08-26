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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_log_service_1 = require("../audit-log.service");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'refreshToken', 'accessToken'];
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
    constructor(auditLogService) {
        this.auditLogService = auditLogService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, originalUrl, body, user } = request;
        const action = methodToAction(method);
        if (!action || !user) {
            return next.handle();
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                void this.auditLogService.record({
                    actorId: user.userId,
                    actorRole: user.role,
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
                    actorRole: user.role,
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
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map