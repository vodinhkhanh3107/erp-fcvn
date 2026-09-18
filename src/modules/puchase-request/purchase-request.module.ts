import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderModule } from '../purchase-order/purchase-order.module';
import { PurchaseRequest } from '../../models/purchase-request.entity';
import { PurchaseRequestItem } from '../../models/purchase-request-item.entity';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequestHistory } from '../../models/purchase-request-history.entity';
import { Department } from '../../models/department.entity';
import { PurchaseRequestItemQuotation } from 'src/models/purchase-request-item-quotation.entity';
import { SupplierQuotation } from 'src/models/supplier-quotation.entity';
import { FileStorageModule } from 'src/common/file-storage/file-storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseRequest,
      PurchaseRequestHistory,
      Department,
      PurchaseRequestItem,
      PurchaseRequestItemQuotation,
      SupplierQuotation,
    ]),
    PurchaseOrderModule,
    FileStorageModule,
  ],
  controllers: [PurchaseRequestController],
  providers: [PurchaseRequestService],
})
export class PurchaseRequestModule {}
