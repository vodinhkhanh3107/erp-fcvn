import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XxxEntity } from './entities/xxx.entity';
import { XxxController } from './xxx.controller';
import { XxxService } from './xxx.service';

@Module({
  imports: [TypeOrmModule.forFeature([XxxEntity])],
  controllers: [XxxController],
  providers: [XxxService],
})
export class XxxModule {}
