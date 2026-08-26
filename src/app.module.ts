import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { TokenModule } from './common/token/token.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './common/redis/redis.module';
import { SupplierModule } from './modules/supplier/supplier-module';
import { SupplierGroupModule } from './modules/supplier-group/supplier-group.module';
import { AttendanceModule } from './modules/attendence/attendence.module';
import { DepartmentModule } from './modules/department/department.module';
import { TaskModule } from './modules/task/task.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { PurchaseRequestModule } from './modules/puchase-request/purchase-request.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
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
    TokenModule,      
    UserModule,
    AuthModule,
    RedisModule,
    AuditLogModule,

    SupplierModule,
    SupplierGroupModule,
    AttendanceModule,
    DepartmentModule,
    TaskModule,
    KpiModule,
    PurchaseOrderModule,
    PurchaseRequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
