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
import { Department } from '../../department/entities/department.entity';
import { User } from '../../user/entities/user.entity';
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { PurchaseRequestQuotation } from './purchase-request-quotation'

export enum PurchaseRequestStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('purchase_requests')
export class PurchaseRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'department_id', nullable: true })
  departmentId?: number;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ name: 'requester_id' })
  requesterId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ name: 'purpose_of_use', length: 500 })
  purposeOfUse: string;

  @Column({ type: 'enum', enum: PurchaseRequestStatus, default: PurchaseRequestStatus.PENDING })
  status: PurchaseRequestStatus;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: number;

  @OneToMany(() => PurchaseRequestItem, (item) => item.purchaseRequest, { cascade: true })
  items?: PurchaseRequestItem[];

  @OneToMany(() => PurchaseRequestQuotation, (q) => q.purchaseRequest, { cascade: true })
  quotations?: PurchaseRequestQuotation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}