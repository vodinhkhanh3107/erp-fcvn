import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Supplier } from '../../supplier/entities/supplier.entity';

export enum SupplierGroupStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('supplier_groups')
export class SupplierGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: SupplierGroupStatus, default: SupplierGroupStatus.ACTIVE })
  status: SupplierGroupStatus;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: number;

  @OneToMany(() => Supplier, (supplier) => supplier.group)
  suppliers: Supplier[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}