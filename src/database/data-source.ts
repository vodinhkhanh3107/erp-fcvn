import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

/**
 * File này CHỈ dùng cho TypeORM CLI (lệnh `npm run migration:*`) — KHÔNG phải
 * DataSource mà app NestJS thật sự dùng lúc chạy (`npm run start:dev` vẫn dùng
 * DatabaseModule.forRootAsync() như cũ, không đổi gì).
 *
 * Lý do cần 1 file riêng: TypeORM CLI chạy ĐỘC LẬP bên ngoài NestJS, không đi qua
 * ConfigModule/DI container — nên phải tự đọc .env bằng dotenv thủ công như dưới đây.
 */
export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: ['src/**/*.entity.ts'],
  // entities: ['src/modules/!(_template)/**/*.entity.ts'],

  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,
});
