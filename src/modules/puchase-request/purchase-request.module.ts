import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderModule } from '../purchase-order/purchase-order.module';
import { PurchaseRequest } from '../../models/purchase-request.entity';
import { PurchaseRequestItem } from '../../models/purchase-request-item.entity';
import { PurchaseRequestQuotation } from '../../models/purchase-request-quotation.entity';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequestHistory } from '../../models/purchase-request-history.entity';
import { Department } from '../../models/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseRequest, PurchaseRequestHistory, Department, PurchaseRequestItem, PurchaseRequestQuotation]),
    PurchaseOrderModule,
  ],
  controllers: [PurchaseRequestController],
  providers: [PurchaseRequestService],
})
export class PurchaseRequestModule {}
