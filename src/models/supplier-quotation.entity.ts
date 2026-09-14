// src/modules/supplier/supplier-quotation.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supplier } from './supplier.entity';

@Entity('supplier_quotations')
export class SupplierQuotation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.supplier_quotations)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: number;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
