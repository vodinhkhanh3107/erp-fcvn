import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GoodReceipt } from './good-receipt.entity';

@Entity('good_receipt_items')
export class GoodReceiptItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'grn_id' })
  grnId: number;

  @ManyToOne(() => GoodReceipt, (grn) => grn.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grn_id' })
  good_receipt: GoodReceipt;

  @Column({ name: 'item_name', length: 255 })
  itemName: string;

  @Column({ name: 'quantity_ordered', type: 'int' })
  quantityOrdered: number;

  @Column({ name: 'quantity_received', type: 'int' })
  quantityReceived: number;
}
