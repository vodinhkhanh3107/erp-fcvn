import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { PurchaseRequest } from './purchase-request.entity';
import { PurchaseRequestQuotation } from './purchase-request-quotation.entity';

@Entity('purchase_request_items')
export class PurchaseRequestItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseRequest, (pr) => pr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_request_id' })
  purchaseRequest: PurchaseRequest;

  @RelationId((item: PurchaseRequestItem) => item.purchaseRequest)
  purchaseRequestId: number;

  @Column({ name: 'item_name', length: 255 })
  itemName: string;

  @Column({ type: 'int' })
  quantity: number;

  @OneToMany(() => PurchaseRequestQuotation, (q) => q.item, { cascade: true })
  quotations: PurchaseRequestQuotation[];
}
