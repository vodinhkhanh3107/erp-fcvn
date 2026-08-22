import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Supplier } from '../../supplier/entities/supplier.entity';
import { PurchaseRequest } from './purchase-request.entity';

@Entity('purchase_request_quotations')
export class PurchaseRequestQuotation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'purchase_request_id' })
  purchaseRequestId: number;

  @ManyToOne(() => PurchaseRequest, (pr) => pr.quotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_request_id' })
  purchaseRequest: PurchaseRequest;

  @Column({ name: 'supplier_id' })
  supplierId: number;

  @ManyToOne(() => Supplier, { nullable: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'quoted_amount', type: 'decimal', precision: 18, scale: 2 })
  quotedAmount: number;

  @Column({ name: 'quotation_file_url', length: 500, nullable: true })
  quotationFileUrl?: string;
}