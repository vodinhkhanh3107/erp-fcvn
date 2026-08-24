import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Role } from '../common/constants/role.enum';
import { User, UserStatus } from '../modules/user/entities/user.entity';

dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Đã kết nối MySQL, bắt đầu seed dữ liệu mẫu...');

  const userRepo = dataSource.getRepository(User);

  const existed = await userRepo.findOne({ where: { email: 'khanh@fcvn.local' } });
  if (!existed) {
    const admin = userRepo.create({
      fullName: 'Admin',
      email: 'khanh@fcvn.local',
      phone: '0866830663',
      password: 'khanh123456@',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      avatar: "",
      departmentId: 1
    });
    await userRepo.save(admin);
    console.log('Đã tạo tài khoản Admin: admin@fcvn.local / Password@123');
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
