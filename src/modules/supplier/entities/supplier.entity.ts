import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SupplierGroup } from '../../supplier-group/entities/supplier-group.entity';

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'tax_code', length: 50, unique: true })
  taxCode: string;

  @Column({ name: 'contact_name', length: 100, nullable: true })
  contactName?: string;

  @Column({ name: 'contact_email', length: 100, nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ name: 'payment_term', length: 20, nullable: true })
  paymentTerm?: string;

  @Column({ type: 'enum', enum: SupplierStatus, default: SupplierStatus.ACTIVE })
  status: SupplierStatus;

  @ManyToOne(() => SupplierGroup, (group) => group.suppliers, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group?: SupplierGroup;

  @Column({ name: 'group_id', nullable: true })
  groupId?: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
