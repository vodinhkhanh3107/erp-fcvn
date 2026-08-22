import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../purchase-order/entities/purchase-order.entitty';
import { PurchaseOrderItem } from '../purchase-order/entities/purchase-order-item.entity';
import { ApprovePurchaseRequestDto } from './dto/approve-purchase-request.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { ListPurchaseRequestDto } from './dto/list-purchase-request.dto';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { PurchaseRequest, PurchaseRequestStatus } from './entities/purchase-request.entity';

@Injectable()
export class PurchaseRequestService {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(PurchaseRequest)
    private readonly prRepository: Repository<PurchaseRequest>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepository: Repository<PurchaseOrderItem>,
  ) {
    this.logger.setContext('PurchaseRequestService');
  }

  async create(dto: CreatePurchaseRequestDto, requesterId: number) {
    const entity = this.prRepository.create({
      departmentId: dto.departmentId,
      purposeOfUse: dto.purposeOfUse,
      requesterId,
      status: PurchaseRequestStatus.PENDING,
      items: dto.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity })),
      quotations: dto.quotations.map((q) => ({
        supplierId: q.supplierId,
        quotedAmount: q.quotedAmount,
        quotationFileUrl: q.quotationFileUrl,
      })),
    });

    const saved = await this.prRepository.save(entity);
    this.logger.log(`Nhân sự #${requesterId} đã tạo PR #${saved.id} — chờ duyệt`);

    return { message: 'Tạo yêu cầu mua hàng thành công, đang chờ duyệt', result: saved };
  }

  async findAll(query: ListPurchaseRequestDto) {
    const { page, limit, status } = query;

    const where: Record<string, any> = {};
    if (status) where.status = status;

    const [items, total] = await this.prRepository.findAndCount({
      where,
      relations: { requester: true, department: true },
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const pr = await this.prRepository.findOne({
      where: { id },
      relations: { requester: true, department: true, items: true, quotations: { supplier: true } },
    });
    if (!pr) throw new NotFoundException('purchase-request-not-found');
    return pr;
  }

  async approveAndIssuePO(id: number, dto: ApprovePurchaseRequestDto, approverId: number) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('purchase-request-not-pending');
    }

    const selectedQuotation = pr.quotations.find((q) => q.supplierId === dto.selectedSupplierId);
    if (!selectedQuotation) {
      throw new BadRequestException('selected-supplier-did-not-submit-a-quotation-for-this-pr');
    }

    pr.status = PurchaseRequestStatus.APPROVED;
    pr.approvedBy = approverId;
    await this.prRepository.save(pr);

    const po = this.poRepository.create({
      purchaseRequestId: pr.id,
      supplierId: dto.selectedSupplierId,
      totalAmount: selectedQuotation.quotedAmount,
      paymentTerm: dto.paymentTerm,
      status: PurchaseOrderStatus.RELEASED,
      createdBy: approverId,
    });
    const savedPo = await this.poRepository.save(po);

    const poItems = pr.items.map((item) =>
      this.poItemRepository.create({
        purchaseOrderId: savedPo.id,
        itemName: item.itemName,
        quantity: item.quantity,
      }),
    );
    await this.poItemRepository.save(poItems);

    this.logger.log(
      `PR #${id} đã được duyệt bởi #${approverId} → phát hành PO #${savedPo.id} cho NCC #${dto.selectedSupplierId}`,
    );

    return {
      message: 'Duyệt yêu cầu mua hàng và phát hành đơn mua hàng (PO) thành công',
      result: { purchaseRequest: pr, purchaseOrder: { ...savedPo, items: poItems } },
    };
  }

  async reject(id: number, dto: RejectPurchaseRequestDto, approverId: number) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('purchase-request-not-pending');
    }

    pr.status = PurchaseRequestStatus.REJECTED;
    pr.approvedBy = approverId;
    const saved = await this.prRepository.save(pr);

    this.logger.log(`PR #${id} đã bị từ chối bởi #${approverId}${dto.reason ? `: ${dto.reason}` : ''}`);
    return { message: 'Từ chối yêu cầu mua hàng thành công', result: saved };
  }
}