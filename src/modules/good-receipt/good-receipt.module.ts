import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodReceiptService } from './good-receipt.service';
import { GoodReceiptController } from './good-receipt.controller';
import { GoodReceipt } from 'src/models/good-receipt.entity';
import { PurchaseOrder } from 'src/models/purchase-order.entity';
import { Stock } from 'src/models/stock.entity';
import { GoodReceiptItem } from 'src/models/good-receipt-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GoodReceipt, PurchaseOrder, Stock, GoodReceiptItem])],
  providers: [GoodReceiptService],
  controllers: [GoodReceiptController],
})
export class GoodReceiptModule {}

// @Module({
//   // Cần cả PurchaseOrder (kiểm tra PO đã Released chưa) và Stock (cập nhật tồn kho lúc confirm)
//   imports: [TypeOrmModule.forFeature([Grn, GrnItem, PurchaseOrder, Stock])],
//   controllers: [GrnController],
//   providers: [GrnService],
//   exports: [TypeOrmModule], // để StockOutModule sau này tái dùng Repository<Stock> nếu cần
// })
// export class GrnModule {}
