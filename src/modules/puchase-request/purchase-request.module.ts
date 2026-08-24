import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderModule } from '../purchase-order/purchase-order.module';
import { PurchaseRequest } from './entities/purchase-request.entity';
import { PurchaseRequestItem } from './entities/purchase-request-item.entity';
import { PurchaseRequestQuotation } from './entities/purchase-request-quotation.entity';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequestHistory } from './entities/purchase-request-history.entity';
import { Department } from '../department/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseRequest, PurchaseRequestHistory, Department, PurchaseRequestItem, PurchaseRequestQuotation]),
    PurchaseOrderModule,
  ],
  controllers: [PurchaseRequestController],
  providers: [PurchaseRequestService],
})
export class PurchaseRequestModule {}
