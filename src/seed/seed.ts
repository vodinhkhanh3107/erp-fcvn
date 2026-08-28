import { PERMISSIONS, ALL_PERMISSION_CODES } from "src/common/constants/permission.constants";
import { ROLES } from "src/common/constants/role.enum";
import { Department } from "src/models/department.entity";
import { Permission } from "src/models/permission.entity";
import { Role } from "src/models/role.entity";
import { User, UserStatus } from "src/models/user.entity";
import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: ALL_PERMISSION_CODES,
  [ROLES.HR]: [
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.DEPARTMENT_MANAGE,
    PERMISSIONS.TASK_MANAGE,
    PERMISSIONS.KPI_MANAGE,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.LEAVE_MANAGE,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.SUPPLIER_MANAGE,
    PERMISSIONS.SUPPLIER_GROUP_MANAGE,
    PERMISSIONS.TASK_MANAGE,
    PERMISSIONS.KPI_MANAGE,
    PERMISSIONS.LEAVE_MANAGE,
    PERMISSIONS.PURCHASE_REQUEST_MANAGE,
    PERMISSIONS.PURCHASE_ORDER_MANAGE,
  ],
  [ROLES.PURCHASING]: [
    PERMISSIONS.SUPPLIER_MANAGE,
    PERMISSIONS.SUPPLIER_GROUP_MANAGE,
    PERMISSIONS.PURCHASE_REQUEST_MANAGE,
    PERMISSIONS.PURCHASE_ORDER_MANAGE,
  ],
  // [ROLES.ACCOUNTANT]: [PERMISSIONS.PAYROLL_MANAGE],
  [ROLES.EMPLOYEE]: [], 
}
async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, Department, Role, Permission],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Đã kết nối MySQL, bắt đầu seed dữ liệu RBAC...');

  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);


  const permissionMap = new Map<string, Permission>();
  for (const code of ALL_PERMISSION_CODES) {
    let permission = await permissionRepo.findOne({ where: { code } });
    if (!permission) {
      permission = await permissionRepo.save(permissionRepo.create({ code }));
      console.log(`Tạo permission mới: ${code}`);
    }
    permissionMap.set(code, permission);
  }

  // ===== 2. Seed Role + gán Permission tương ứng =====
  const roleNames: Record<string, string> = {
    [ROLES.ADMIN]: 'Quản trị viên',
    [ROLES.HR]: 'Nhân sự',
    [ROLES.MANAGER]: 'Quản lý',
    [ROLES.PURCHASING]: 'Mua hàng',
    [ROLES.ACCOUNTANT]: 'Kế toán',
    [ROLES.EMPLOYEE]: 'Nhân viên',
    [ROLES.BOD]: 'Giám đốc',
    [ROLES.WAREHOUSE]: 'Nhân viên kho',
    [ROLES.EVENT_MANAGER]: 'Quản lý sự kiện',
  };

  const roleMap = new Map<string, Role>();
  for (const [code, permissionCodes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    let role = await roleRepo.findOne({ where: { code }, relations: { permissions: true } });
    const permissions = permissionCodes.map((c) => permissionMap.get(c)!);

    if (!role) {
      role = await roleRepo.save(roleRepo.create({ code, name: roleNames[code], permissions }));
      console.log(`Tạo role mới: ${code} (${permissions.length} quyền)`);
    } else {
      role.permissions = permissions;
      await roleRepo.save(role);
      console.log(`  … Role "${code}" đã tồn tại — đồng bộ lại quyền mặc định`);
    }
    roleMap.set(code, role);
  }

  // ===== 3. Seed tài khoản Admin đầu tiên =====
  const existedAdmin = await userRepo.findOne({ where: { email: 'khanh123@fcvn.local' } });
  if (!existedAdmin) {
    const adminRole = roleMap.get(ROLES.ADMIN)!;
    const admin = userRepo.create({
      fullName: 'khanh',
      email: 'khanh123@fcvn.local',
      phone: '0865836663',
      password: 'Password@123',
      roleId: adminRole.id,
      status: UserStatus.ACTIVE,
    });
    const saved = await userRepo.save(admin);

    const verify = await dataSource.query('SELECT LENGTH(password) as len FROM users WHERE id = ?', [saved.id]);
  } else {
    console.log('Tài khoản Admin đã tồn tại, bỏ qua.');
  }

  await dataSource.destroy();
  console.log('Seed RBAC xong.');
}

seed().catch((err) => {
  console.error('Seed lỗi:', err);
  process.exit(1);
});