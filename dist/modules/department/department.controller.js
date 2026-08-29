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
exports.DepartmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const create_department_dto_1 = require("./dto/create-department.dto");
const update_department_status_dto_1 = require("./dto/update-department-status.dto");
const update_department_dto_1 = require("./dto/update-department.dto");
const department_service_1 = require("./department.service");
const permission_guard_1 = require("../../common/guards/permission.guard");
const permission_decorator_1 = require("../../common/decorators/permission.decorator");
const permission_constants_1 = require("../../common/constants/permission.constants");
let DepartmentController = class DepartmentController {
    constructor(departmentService) {
        this.departmentService = departmentService;
    }
    create(dto, user) {
        return this.departmentService.createDepartment(dto, user.userId);
    }
    findAll(query) {
        return this.departmentService.list(query);
    }
    findOne(id) {
        return this.departmentService.findOne(id);
    }
    update(id, dto, user) {
        return this.departmentService.updateDepartment(id, dto, user.userId);
    }
    updateStatus(id, dto, user) {
        return this.departmentService.updateStatus(id, dto, user.userId);
    }
};
exports.DepartmentController = DepartmentController;
__decorate([
    (0, common_1.Post)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.DEPARTMENT_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_department_dto_1.CreateDepartmentDto, Object]),
    __metadata("design:returntype", void 0)
], DepartmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.DEPARTMENT_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], DepartmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.DEPARTMENT_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DepartmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.DEPARTMENT_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_department_dto_1.UpdateDepartmentDto, Object]),
    __metadata("design:returntype", void 0)
], DepartmentController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.DEPARTMENT_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_department_status_dto_1.UpdateDepartmentStatusDto, Object]),
    __metadata("design:returntype", void 0)
], DepartmentController.prototype, "updateStatus", null);
exports.DepartmentController = DepartmentController = __decorate([
    (0, swagger_1.ApiTags)('Department'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('departments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [department_service_1.DepartmentService])
], DepartmentController);
//# sourceMappingURL=department.controller.js.map