import { Department } from "src/modules/department/entities/department.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PurchaseRequestItem } from "./purchase-request-item.entity";
import { PurchaseRequestQuotation } from "./purchase-request-quotation.entity";

export enum PurchaseRequestStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('purchase_requests')
export class PurchaseRequest {
  @PrimaryGeneratedColumn()
  id: number;

  // Idempotency key — chống tạo trùng khi client gửi lại request (giữ nguyên từ trước)
  @Column({ name: 'request_key', length: 100, unique: true, nullable: true })
  requestKey?: string;

  @Column({ name: 'department_id', nullable: true })
  departmentId?: number;

  @ManyToOne(() => Department, (deparment) => deparment.id, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ name: 'requester_id' })
  requesterId: number;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
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

  @OneToMany(() => PurchaseRequestQuotation, (q) => q.purchaseRequest, { cascade: true })
  quotations?: PurchaseRequestQuotation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}