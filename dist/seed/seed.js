"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const permission_constants_1 = require("../common/constants/permission.constants");
const role_enum_1 = require("../common/constants/role.enum");
const department_entity_1 = require("../models/department.entity");
const permission_entity_1 = require("../models/permission.entity");
const role_entity_1 = require("../models/role.entity");
const user_entity_1 = require("../models/user.entity");
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const DEFAULT_ROLE_PERMISSIONS = {
    [role_enum_1.ROLES.ADMIN]: permission_constants_1.ALL_PERMISSION_CODES,
    [role_enum_1.ROLES.HR]: [
        permission_constants_1.PERMISSIONS.USER_MANAGE,
        permission_constants_1.PERMISSIONS.DEPARTMENT_MANAGE,
        permission_constants_1.PERMISSIONS.TASK_MANAGE,
        permission_constants_1.PERMISSIONS.KPI_MANAGE,
        permission_constants_1.PERMISSIONS.ATTENDANCE_MANAGE,
        permission_constants_1.PERMISSIONS.LEAVE_MANAGE,
    ],
    [role_enum_1.ROLES.MANAGER]: [
        permission_constants_1.PERMISSIONS.SUPPLIER_MANAGE,
        permission_constants_1.PERMISSIONS.SUPPLIER_GROUP_MANAGE,
        permission_constants_1.PERMISSIONS.TASK_MANAGE,
        permission_constants_1.PERMISSIONS.KPI_MANAGE,
        permission_constants_1.PERMISSIONS.LEAVE_MANAGE,
        permission_constants_1.PERMISSIONS.PURCHASE_REQUEST_MANAGE,
        permission_constants_1.PERMISSIONS.PURCHASE_ORDER_MANAGE,
    ],
    [role_enum_1.ROLES.PURCHASING]: [
        permission_constants_1.PERMISSIONS.SUPPLIER_MANAGE,
        permission_constants_1.PERMISSIONS.SUPPLIER_GROUP_MANAGE,
        permission_constants_1.PERMISSIONS.PURCHASE_REQUEST_MANAGE,
        permission_constants_1.PERMISSIONS.PURCHASE_ORDER_MANAGE,
    ],
    [role_enum_1.ROLES.EMPLOYEE]: [],
};
async function seed() {
    const dataSource = new typeorm_1.DataSource({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [user_entity_1.User, department_entity_1.Department, role_entity_1.Role, permission_entity_1.Permission],
        synchronize: false,
    });
    await dataSource.initialize();
    console.log('Đã kết nối MySQL, bắt đầu seed dữ liệu RBAC...');
    const permissionRepo = dataSource.getRepository(permission_entity_1.Permission);
    const roleRepo = dataSource.getRepository(role_entity_1.Role);
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const permissionMap = new Map();
    for (const code of permission_constants_1.ALL_PERMISSION_CODES) {
        let permission = await permissionRepo.findOne({ where: { code } });
        if (!permission) {
            permission = await permissionRepo.save(permissionRepo.create({ code }));
            console.log(`Tạo permission mới: ${code}`);
        }
        permissionMap.set(code, permission);
    }
    const roleNames = {
        [role_enum_1.ROLES.ADMIN]: 'Quản trị viên',
        [role_enum_1.ROLES.HR]: 'Nhân sự',
        [role_enum_1.ROLES.MANAGER]: 'Quản lý',
        [role_enum_1.ROLES.PURCHASING]: 'Mua hàng',
        [role_enum_1.ROLES.ACCOUNTANT]: 'Kế toán',
        [role_enum_1.ROLES.EMPLOYEE]: 'Nhân viên',
        [role_enum_1.ROLES.BOD]: 'Giám đốc',
        [role_enum_1.ROLES.WAREHOUSE]: 'Nhân viên kho',
        [role_enum_1.ROLES.EVENT_MANAGER]: 'Quản lý sự kiện',
    };
    const roleMap = new Map();
    for (const [code, permissionCodes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        let role = await roleRepo.findOne({ where: { code }, relations: { permissions: true } });
        const permissions = permissionCodes.map((c) => permissionMap.get(c));
        if (!role) {
            role = await roleRepo.save(roleRepo.create({ code, name: roleNames[code], permissions }));
            console.log(`Tạo role mới: ${code} (${permissions.length} quyền)`);
        }
        else {
            role.permissions = permissions;
            await roleRepo.save(role);
            console.log(`  … Role "${code}" đã tồn tại — đồng bộ lại quyền mặc định`);
        }
        roleMap.set(code, role);
    }
    const existedAdmin = await userRepo.findOne({ where: { email: 'khanh123@fcvn.local' } });
    if (!existedAdmin) {
        const adminRole = roleMap.get(role_enum_1.ROLES.ADMIN);
        const admin = userRepo.create({
            fullName: 'khanh',
            email: 'khanh123@fcvn.local',
            phone: '0865836663',
            password: 'Password@123',
            roleId: adminRole.id,
            status: user_entity_1.UserStatus.ACTIVE,
        });
        const saved = await userRepo.save(admin);
        const verify = await dataSource.query('SELECT LENGTH(password) as len FROM users WHERE id = ?', [saved.id]);
    }
    else {
        console.log('Tài khoản Admin đã tồn tại, bỏ qua.');
    }
    await dataSource.destroy();
    console.log('Seed RBAC xong.');
}
seed().catch((err) => {
    console.error('Seed lỗi:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map