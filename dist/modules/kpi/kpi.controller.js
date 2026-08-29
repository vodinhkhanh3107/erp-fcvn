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
exports.KpiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const create_kpi_dto_1 = require("./dto/create-kpi.dto");
const list_kpi_dto_1 = require("./dto/list-kpi.dto");
const update_kpi_actual_dto_1 = require("./dto/update-kpi-actual-dto");
const kpi_service_1 = require("./kpi.service");
const permission_guard_1 = require("../../common/guards/permission.guard");
const permission_decorator_1 = require("../../common/decorators/permission.decorator");
const permission_constants_1 = require("../../common/constants/permission.constants");
let KpiController = class KpiController {
    constructor(kpiService) {
        this.kpiService = kpiService;
    }
    create(dto, user) {
        return this.kpiService.create(dto, user.userId);
    }
    findAll(query) {
        return this.kpiService.findAll(query);
    }
    findOne(id) {
        return this.kpiService.findOne(id);
    }
    updateActual(id, dto, user) {
        return this.kpiService.updateActual(id, dto, user.userId);
    }
};
exports.KpiController = KpiController;
__decorate([
    (0, common_1.Post)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.KPI_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_kpi_dto_1.CreateKpiDto, Object]),
    __metadata("design:returntype", void 0)
], KpiController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.KPI_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_kpi_dto_1.ListKpiDto]),
    __metadata("design:returntype", void 0)
], KpiController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.KPI_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], KpiController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/actual'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.KPI_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_kpi_actual_dto_1.UpdateKpiActualDto, Object]),
    __metadata("design:returntype", void 0)
], KpiController.prototype, "updateActual", null);
exports.KpiController = KpiController = __decorate([
    (0, swagger_1.ApiTags)('KPI'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('kpis'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [kpi_service_1.KpiService])
], KpiController);
//# sourceMappingURL=kpi.controller.js.map