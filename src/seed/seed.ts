import { PERMISSIONS, ALL_PERMISSION_CODES } from "src/common/constants/permission.constants";
import { ROLES } from "src/common/constants/role.enum";
import { Permission } from "src/models/permission.entity";
import { Role } from "src/models/role.entity";
import { User, UserStatus } from "src/models/user.entity";
import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';
import { Department, DepartmentStatus } from "src/models/department.entity";
dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, Role, Permission, Department],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Đã kết nối MySQL, bắt đầu seed dữ liệu RBAC...');

  // ===== 2. Seed Role + gán Permission tương ứng =====
  const roleNames: Record<string, string> = {
    [ROLES.ADMIN]: 'Quản trị viên'
  };


  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const departmentRepo = dataSource.getRepository(Department);

  const permissionMap = new Map<string, Permission>();
  for (const code of ALL_PERMISSION_CODES) {
    let permission = await permissionRepo.findOne({ where: { code } });
    if (!permission) {
      permission = await permissionRepo.save(permissionRepo.create({ code }));
      console.log(`Tạo permission mới: ${code}`);
    }
    else{
      console.log(`Quyền ${code} đã tồn tại`);
    }
    permissionMap.set(code, permission);
  }


  const roleMap = new Map<string, Role>();
  for (const [code, permissionCodes] of Object.entries({[ROLES.ADMIN]: ALL_PERMISSION_CODES})) {
    let role = await roleRepo.findOne({ where: { code }, relations: { permissions: true } });
    const permissions = permissionCodes.map((c) => permissionMap.get(c)!);

    if (!role) {
      role = await roleRepo.save(roleRepo.create({ code, name: roleNames[code], permissions }));
      console.log(`Tạo role mới: ${code} (${permissions.length} quyền)`);
    } else {
      role.permissions = permissions;
      await roleRepo.save(role);
      console.log(`Role "${code}" đã tồn tại — đồng bộ lại quyền mặc định`);
    }
    roleMap.set(code, role);
  }

  const newDepartment = departmentRepo.create({
    name: "Admin",
    status: DepartmentStatus.ACTIVE
  })

  const saveDepartment = await departmentRepo.save(newDepartment);

  // ===== 3. Seed tài khoản Admin đầu tiên =====
  const existedAdmin = await userRepo.findOne({ where: { email: `${process.env.EMAIL_USER}@fcvn.local` } });
  if (!existedAdmin) {
    const adminRole = roleMap.get(ROLES.ADMIN)!;
    const admin = userRepo.create({
      fullName: 'khanh',
      email: `${process.env.EMAIL_USER}@fcvn.local`,
      phone: '0865836663',
      password: process.env.PASSWORD_USER,
      roleId: adminRole.id,
      status: UserStatus.ACTIVE,
      departmentId: saveDepartment.id
    });
    const saved = await userRepo.save(admin);

    const verify = await dataSource.query('SELECT LENGTH(password) as len FROM users WHERE id = ?', [saved.id]);
  } else {
    console.log('Tài khoản Admin đã tồn tại, bỏ qua.');
  }

  await dataSource.destroy();
  console.log('Seed xong.');
}

seed().catch((err) => {
  console.error('Seed lỗi:', err);
  process.exit(1);
});