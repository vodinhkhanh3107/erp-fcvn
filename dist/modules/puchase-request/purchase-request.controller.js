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
exports.PurchaseRequestController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const role_enum_1 = require("../../common/constants/role.enum");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const purchase_request_service_1 = require("./purchase-request.service");
const create_purchase_request_dto_1 = require("./dto/create-purchase-request.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const update_purchase_request_dto_1 = require("./dto/update-purchase-request.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const reject_purchase_request_dto_1 = require("./dto/reject-purchase-request.dto");
const issue_purchase_order_dto_1 = require("./dto/issue-purchase-order.dto");
const list_purchase_request_dto_1 = require("./dto/list-purchase-request.dto");
const permission_guard_1 = require("../../common/guards/permission.guard");
const permission_decorator_1 = require("../../common/decorators/permission.decorator");
const permission_constants_1 = require("../../common/constants/permission.constants");
let PurchaseRequestController = class PurchaseRequestController {
    constructor(purchaseRequestService) {
        this.purchaseRequestService = purchaseRequestService;
    }
    create(dto, user) {
        return this.purchaseRequestService.createDraft(dto, user.userId);
    }
    update(id, dto, user) {
        return this.purchaseRequestService.update(id, dto, user.userId);
    }
    submit(id, user) {
        return this.purchaseRequestService.submit(id, user.userId);
    }
    approve(id, user) {
        return this.purchaseRequestService.approve(id, user.userId, user.role);
    }
    reject(id, dto, user) {
        return this.purchaseRequestService.reject(id, dto, user.userId, user.role);
    }
    getHistory(id) {
        return this.purchaseRequestService.getHistory(id);
    }
    faindAll(query) {
        return this.purchaseRequestService.findAll(query);
    }
    findOne(id) {
        return this.purchaseRequestService.findOne(id);
    }
    issuePO(id, dto, user) {
        return this.purchaseRequestService.issuePO(id, dto, user.userId);
    }
};
exports.PurchaseRequestController = PurchaseRequestController;
__decorate([
    (0, common_1.Post)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.PURCHASE_REQUEST_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_request_dto_1.CreatePurchaseRequestDto, Object]),
    __metadata("design:returntype", void 0)
], PurchaseRequestController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.PURCHASE_REQUEST_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_purchase_request_dto_1.UpdatePurchaseRequestDto, Object]),
    __metadata("design:returntype", void 0)
], PurchaseRequestController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/submit'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.PURCHASE_REQUEST_SUBMIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PurchaseRequestController.prototype, "submit", null);
__decorate([
    (0, common_1.Put)(':id/approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.ROLES.ADMIN, role_enum_1.ROLES.MANAGER),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.PURCHASE_REQUEST_APPROVE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PurchaseRequestController.prototype, "approve", null);
__decorate([
    (0, common_1.Put)(':id/reject'),
    (0, roles_decorator_1.Roles)(role_enum_1.ROLES.ADMIN, role_enum_1.ROLES.MANAGER),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.PURCHASE_REQUEST_REJECT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, reject_purchase_request_dto_1.RejectPurchaseRequestDto, Object]),
    __metadata("design:returntype", void 0)
], PurchaseRequestController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PurchaseRequestController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.PURCHASE_REQUEST_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_purchase_request_dto_1.ListPurchaseRequestDto]),
    __metadata("design:returntype", void 0)
], PurchaseRequestController.prototype, "faindAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.PURCHASE_REQUEST_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PurchaseRequestController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/issue-po'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, issue_purchase_order_dto_1.IssuePoDto, Object]),
    __metadata("design:returntype", void 0)
], PurchaseRequestController.prototype, "issuePO", null);
exports.PurchaseRequestController = PurchaseRequestController = __decorate([
    (0, swagger_1.ApiTags)('Purchase Request'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('purchase-requests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [purchase_request_service_1.PurchaseRequestService])
], PurchaseRequestController);
//# sourceMappingURL=purchase-request.controller.js.map