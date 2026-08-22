import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PurchaseRequest } from './purchase-request.entity';

@Entity('purchase_request_items')
export class PurchaseRequestItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'purchase_request_id' })
  purchaseRequestId: number;

  @ManyToOne(() => PurchaseRequest, (pr) => pr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_request_id' })
  purchaseRequest: PurchaseRequest;

  @Column({ name: 'item_name', length: 255 })
  itemName: string;

  @Column({ type: 'int' })
  quantity: number; 
}
