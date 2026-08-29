"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const user_module_1 = require("./modules/user/user.module");
const token_module_1 = require("./common/token/token.module");
const auth_module_1 = require("./modules/auth/auth.module");
const redis_module_1 = require("./common/redis/redis.module");
const supplier_module_1 = require("./modules/supplier/supplier-module");
const supplier_group_module_1 = require("./modules/supplier-group/supplier-group.module");
const attendence_module_1 = require("./modules/attendence/attendence.module");
const department_module_1 = require("./modules/department/department.module");
const task_module_1 = require("./modules/task/task.module");
const kpi_module_1 = require("./modules/kpi/kpi.module");
const purchase_order_module_1 = require("./modules/purchase-order/purchase-order.module");
const purchase_request_module_1 = require("./modules/puchase-request/purchase-request.module");
const audit_log_module_1 = require("./modules/audit-log/audit-log.module");
const leave_module_1 = require("./modules/leave/leave.module");
const permission_role_module_1 = require("./modules/permission-role/permission-role.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DB_HOST,
                port: Number(process.env.DB_PORT) || 3306,
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
                autoLoadEntities: true,
                synchronize: false,
                logging: true,
            }),
            token_module_1.TokenModule,
            user_module_1.UserModule,
            auth_module_1.AuthModule,
            redis_module_1.RedisModule,
            audit_log_module_1.AuditLogModule,
            permission_role_module_1.PermissionRoleModule,
            supplier_module_1.SupplierModule,
            supplier_group_module_1.SupplierGroupModule,
            attendence_module_1.AttendanceModule,
            department_module_1.DepartmentModule,
            task_module_1.TaskModule,
            kpi_module_1.KpiModule,
            leave_module_1.LeaveModule,
            purchase_order_module_1.PurchaseOrderModule,
            purchase_request_module_1.PurchaseRequestModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map