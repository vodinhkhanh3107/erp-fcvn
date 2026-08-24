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
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
const typeorm_1 = require("typeorm");
const role_enum_1 = require("../common/constants/role.enum");
const user_entity_1 = require("../modules/user/entities/user.entity");
dotenv.config();
async function seed() {
    const dataSource = new typeorm_1.DataSource({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [user_entity_1.User],
        synchronize: false,
    });
    await dataSource.initialize();
    console.log('Đã kết nối MySQL, bắt đầu seed dữ liệu mẫu...');
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const existed = await userRepo.findOne({ where: { email: 'khanh@fcvn.local' } });
    if (!existed) {
        const admin = userRepo.create({
            fullName: 'Admin',
            email: 'khanh@fcvn.local',
            phone: '0866830663',
            password: 'khanh123456@',
            role: role_enum_1.Role.ADMIN,
            status: user_entity_1.UserStatus.ACTIVE,
            avatar: "",
            departmentId: 1
        });
        await userRepo.save(admin);
        console.log('Đã tạo tài khoản Admin: admin@fcvn.local / Password@123');
    }
    else {
        console.log('Tài khoản Admin đã tồn tại, bỏ qua.');
    }
    await dataSource.destroy();
    console.log('Seed xong.');
}
seed().catch((err) => {
    console.error('Seed lỗi:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map