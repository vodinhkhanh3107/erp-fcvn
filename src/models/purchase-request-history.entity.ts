import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseRequest, PurchaseRequestStatus } from './purchase-request.entity';
import { User } from './user.entity';

@Entity('purchase_request_histories')
export class PurchaseRequestHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'purchase_request_id' })
  purchaseRequestId: number;

  @ManyToOne(() => PurchaseRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_request_id' })
  purchaseRequest: PurchaseRequest;

  @Column({ name: 'from_status', type: 'enum', enum: PurchaseRequestStatus, nullable: true })
  fromStatus?: PurchaseRequestStatus;

  @Column({ name: 'to_status', type: 'enum', enum: PurchaseRequestStatus })
  toStatus: PurchaseRequestStatus;

  @Column({ name: 'actor_id' })
  actorId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ length: 500, nullable: true })
  note?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
