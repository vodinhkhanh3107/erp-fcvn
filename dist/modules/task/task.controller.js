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
exports.TaskController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const create_task_dto_1 = require("./dto/create-task.dto");
const list_task_dto_1 = require("./dto/list-task.dto");
const update_task_status_dto_1 = require("./dto/update-task-status.dto");
const task_service_1 = require("./task.service");
const permission_guard_1 = require("../../common/guards/permission.guard");
const permission_constants_1 = require("../../common/constants/permission.constants");
const permission_decorator_1 = require("../../common/decorators/permission.decorator");
let TaskController = class TaskController {
    constructor(taskService) {
        this.taskService = taskService;
    }
    create(dto, user) {
        return this.taskService.create(dto, user.userId);
    }
    findAll(query) {
        return this.taskService.findAll(query);
    }
    findOne(id) {
        return this.taskService.findOne(id);
    }
    updateStatus(id, dto, user) {
        return this.taskService.updateStatus(id, dto, user.userId);
    }
};
exports.TaskController = TaskController;
__decorate([
    (0, common_1.Post)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.TASK_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_dto_1.CreateTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TaskController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.TASK_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_task_dto_1.ListTaskDto]),
    __metadata("design:returntype", void 0)
], TaskController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.TASK_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TaskController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, permission_decorator_1.RequirePermission)(permission_constants_1.PERMISSIONS.TASK_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_task_status_dto_1.UpdateTaskStatusDto, Object]),
    __metadata("design:returntype", void 0)
], TaskController.prototype, "updateStatus", null);
exports.TaskController = TaskController = __decorate([
    (0, swagger_1.ApiTags)('Task'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [task_service_1.TaskService])
], TaskController);
//# sourceMappingURL=task.controller.js.map