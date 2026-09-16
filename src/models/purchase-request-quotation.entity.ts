import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { Supplier } from './supplier.entity';
import { PurchaseRequestItem } from './purchase-request-item.entity';

@Entity('purchase_request_quotations')
export class PurchaseRequestQuotation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseRequestItem, (item) => item.quotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: PurchaseRequestItem;

  @RelationId((q: PurchaseRequestQuotation) => q.item)
  purchaseRequestItemId: number;

  @Column({ name: 'supplier_id' })
  supplierId: number;

  @ManyToOne(() => Supplier, { nullable: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'quoted_amount', type: 'decimal', precision: 18, scale: 2 })
  quotedAmount: number;
}
