import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListPurchaseOrderDto } from './dto/list-purchase-order.dto';
import { PurchaseOrder } from './entities/purchase-order.entity';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly repository: Repository<PurchaseOrder>,
  ) {}

  async findAll(query: ListPurchaseOrderDto) {
    const { page, limit, supplierId, status } = query;

    const where: Record<string, any> = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    const [items, total] = await this.repository.findAndCount({
      where,
      relations: { supplier: true, items: true },
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const po = await this.repository.findOne({ where: { id }, relations: { supplier: true, items: true } });
    if (!po) throw new NotFoundException('purchase-order-not-found');
    return po;
  }
}
