import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { User } from './user.entity';
import { GoodReceiptItem } from './good-receipt-item.entity';

export enum GoodReceiptStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
}

@Entity('good_receipts')
export class GoodReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'po_id' })
  poId: number;

  @ManyToOne(() => PurchaseOrder, { nullable: false })
  @JoinColumn({ name: 'po_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'received_at', type: 'datetime', nullable: true })
  receivedAt?: Date; // chỉ set khi CONFIRM (chuyển Completed), không phải lúc tạo phiếu

  @Column({ name: 'received_by' })
  receivedBy: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'received_by' })
  receiver: User;

  @Column({ type: 'enum', enum: GoodReceiptStatus, default: GoodReceiptStatus.PENDING })
  status: GoodReceiptStatus;

  @OneToMany(() => GoodReceiptItem, (item) => item.good_receipt, { cascade: true })
  items?: GoodReceiptItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
