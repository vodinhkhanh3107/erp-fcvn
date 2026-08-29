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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const attendence_service_1 = require("./attendence.service");
const create_attendence_dto_1 = require("./dto/create-attendence.dto");
const list_attendence_dto_1 = require("./dto/list-attendence.dto");
const permission_decorator_1 = require("../../common/decorators/permission.decorator");
const permission_constants_1 = require("../../common/constants/permission.constants");
const permission_guard_1 = require("../../common/guards/permission.guard");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    create(dto, user) {
        return this.attendanceService.create(dto, user.userId);
    }
    findAll(query) {
        return this.attendanceService.findAll(query);
    }
    findOne(id) {
        return this.attendanceService.findOne(id);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.ATTENDANCE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_attendence_dto_1.CreateAttendanceDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.ATTENDANCE_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_attendence_dto_1.ListAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.ATTENDANCE_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findOne", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('attendances'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [attendence_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendence.controller.js.map