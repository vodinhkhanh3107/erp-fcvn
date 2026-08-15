import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

/**
 * @Global() — chỉ cần import TokenModule đúng 1 lần ở AppModule.
 * Mọi module khác (Employee, Auth, và các module thêm sau này) dùng
 * JwtAuthGuard hay cần JwtService thì cứ inject thẳng, KHÔNG cần
 * import lại JwtModule.register(...) ở từng module con nữa.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') as any },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class TokenModule {}
