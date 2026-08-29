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
exports.SupplierGroupController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const assign_suppliers_dto_1 = require("./dto/assign-suppliers.dto");
const create_supplier_group_dto_1 = require("./dto/create-supplier-group.dto");
const update_supplier_group_dto_1 = require("./dto/update-supplier-group.dto");
const update_supplier_group_status_dto_1 = require("./dto/update-supplier-group-status.dto");
const supplier_group_service_1 = require("./supplier-group.service");
const swagger_1 = require("@nestjs/swagger");
const permission_guard_1 = require("../../common/guards/permission.guard");
let SupplierGroupController = class SupplierGroupController {
    constructor(supplierGroupService) {
        this.supplierGroupService = supplierGroupService;
    }
    create(dto, user) {
        return this.supplierGroupService.createGroup(dto, user.userId);
    }
    findAll(query) {
        return this.supplierGroupService.findAll(query);
    }
    findOne(id) {
        return this.supplierGroupService.findOne(id);
    }
    update(id, dto, user) {
        return this.supplierGroupService.updateGroup(id, dto, user.userId);
    }
    updateStatus(id, dto, user) {
        return this.supplierGroupService.updateStatus(id, dto, user.userId);
    }
    assignSuppliers(id, dto, user) {
        return this.supplierGroupService.assignSuppliers(id, dto, user.userId);
    }
};
exports.SupplierGroupController = SupplierGroupController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_supplier_group_dto_1.CreateSupplierGroupDto, Object]),
    __metadata("design:returntype", void 0)
], SupplierGroupController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], SupplierGroupController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SupplierGroupController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_supplier_group_dto_1.UpdateSupplierGroupDto, Object]),
    __metadata("design:returntype", void 0)
], SupplierGroupController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_supplier_group_status_dto_1.UpdateSupplierGroupStatusDto, Object]),
    __metadata("design:returntype", void 0)
], SupplierGroupController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/assign-suppliers'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, assign_suppliers_dto_1.AssignSuppliersDto, Object]),
    __metadata("design:returntype", void 0)
], SupplierGroupController.prototype, "assignSuppliers", null);
exports.SupplierGroupController = SupplierGroupController = __decorate([
    (0, swagger_1.ApiTags)('Supplier Group'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('supplier-groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [supplier_group_service_1.SupplierGroupService])
], SupplierGroupController);
//# sourceMappingURL=supplier-group.controller.js.map