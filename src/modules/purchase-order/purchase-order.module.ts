import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from '../../models/purchase-order.entity';
import { PurchaseOrderItem } from '../../models/purchase-order-item.entity';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem])],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  exports: [TypeOrmModule],
})
export class PurchaseOrderModule {}
