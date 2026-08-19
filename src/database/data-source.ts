import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

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
