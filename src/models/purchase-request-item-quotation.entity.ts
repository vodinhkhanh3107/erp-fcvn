import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { Supplier } from './supplier.entity';

@Entity('purchase_request_item_quotations')
export class PurchaseRequestItemQuotation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseRequestItem, (item) => item.quotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_request_item_id' })
  item: PurchaseRequestItem;

  @RelationId((q: PurchaseRequestItemQuotation) => q.item)
  purchaseRequestItemId: number;

  @Column({ name: 'supplier_id' })
  supplierId: number;

  @ManyToOne(() => Supplier, { nullable: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'quoted_amount', type: 'decimal', precision: 18, scale: 2 })
  quotedAmount: number;

  // @Column({ name: 'quotation_file_url', length: 500, nullable: true })
  // quotationFileUrl?: string;
}
