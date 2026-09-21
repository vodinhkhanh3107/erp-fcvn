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
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { Department } from './department.entity';
import { User } from './user.entity';

export enum PurchaseRequestStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SIGNED = 'SIGNED',
}

@Entity('purchase_requests')
export class PurchaseRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'request_key', length: 100, unique: true, nullable: true })
  requestKey?: string;

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

  @Column({ type: 'enum', enum: PurchaseRequestStatus, default: PurchaseRequestStatus.DRAFT })
  status: PurchaseRequestStatus;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: number;

  @Column({ name: 'reject_reason', length: 500, nullable: true })
  rejectReason?: string;

  @OneToMany(() => PurchaseRequestItem, (item) => item.purchaseRequest, { cascade: true })
  items?: PurchaseRequestItem[];

  @Column({ name: 'signature_file_url', length: 500, nullable: true })
  signatureFileUrl?: string;

  @Column({ name: 'signed_by', nullable: true })
  signedBy?: number;

  @Column({ name: 'signed_at', type: 'timestamp', nullable: true })
  signedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'po_issued_at', type: 'timestamp', nullable: true })
  poIssuedAt?: Date;
}
