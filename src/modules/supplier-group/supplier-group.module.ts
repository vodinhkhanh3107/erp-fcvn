import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from '../../models/supplier.entity';
import { SupplierGroup } from '../../models/supplier-group.entity';
import { SupplierGroupController } from './supplier-group.controller';
import { SupplierGroupService } from './supplier-group.service';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierGroup, Supplier])],
  controllers: [SupplierGroupController],
  providers: [SupplierGroupService],
  exports: [SupplierGroupService],
})
export class SupplierGroupModule {}