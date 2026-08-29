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
exports.PurchaseOrderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const list_purchase_order_dto_1 = require("./dto/list-purchase-order.dto");
const purchase_order_service_1 = require("./purchase-order.service");
const permission_guard_1 = require("../../common/guards/permission.guard");
const permission_decorator_1 = require("../../common/decorators/permission.decorator");
const permission_constants_1 = require("../../common/constants/permission.constants");
let PurchaseOrderController = class PurchaseOrderController {
    constructor(purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }
    findAll(query) {
        return this.purchaseOrderService.findAll(query);
    }
    findOne(id) {
        return this.purchaseOrderService.findOne(id);
    }
};
exports.PurchaseOrderController = PurchaseOrderController;
__decorate([
    (0, common_1.Get)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.PURCHASE_ORDER_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_purchase_order_dto_1.ListPurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], PurchaseOrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.PURCHASE_ORDER_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PurchaseOrderController.prototype, "findOne", null);
exports.PurchaseOrderController = PurchaseOrderController = __decorate([
    (0, swagger_1.ApiTags)('Purchase Order'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('purchase-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [purchase_order_service_1.PurchaseOrderService])
], PurchaseOrderController);
//# sourceMappingURL=purchase-order.controller.js.map