import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierQuotation } from 'src/models/supplier-quotation.entity';
import { SupplierQuotationController } from './supplier-quotation.controller';
import { SupplierQuotationService } from './supplier-quotation.service';
import { FileStorageModule } from 'src/common/file-storage/file-storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierQuotation]), FileStorageModule],
  controllers: [SupplierQuotationController],
  providers: [SupplierQuotationService],
})
export class SupplierQuotationModule {}
