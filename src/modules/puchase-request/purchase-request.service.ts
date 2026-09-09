import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { PurchaseRequest, PurchaseRequestStatus } from '../../models/purchase-request.entity';
import { EntityManager, ILike, Repository } from 'typeorm';
import { PurchaseRequestHistory } from '../../models/purchase-request-history.entity';
import { Department } from '../../models/department.entity';
import { PurchaseOrder, PurchaseOrderStatus } from '../../models/purchase-order.entity';
import { PurchaseOrderItem } from '../../models/purchase-order-item.entity';
import { DataSource } from 'typeorm';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { PurchaseRequestItem } from '../../models/purchase-request-item.entity';
import { PurchaseRequestQuotation } from '../../models/purchase-request-quotation.entity';
import { ROLES } from '../../common/constants/role.enum';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { IssuePoDto } from './dto/issue-purchase-order.dto';
import { ListPurchaseRequestDto } from './dto/list-purchase-request.dto';

import * as crypto from 'crypto';

const MYSQL_DUPLICATE_ENTRY_ERROR_CODE = 'ER_DUP_ENTRY';

@Injectable()
export class PurchaseRequestService {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(PurchaseRequest)
    private readonly prRepository: Repository<PurchaseRequest>,
    @InjectRepository(PurchaseRequestHistory)
    private readonly historyRepository: Repository<PurchaseRequestHistory>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepository: Repository<PurchaseOrderItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('PurchaseRequestService');
  }

  private generateContentHash(dto: CreatePurchaseRequestDto, requesterId: number): string {
    const payload = JSON.stringify({
      requesterId,
      departmentId: dto.departmentId,
      purposeOfUse: dto.purposeOfUse,
      items: dto.items,
      quotations: dto.quotations,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  private async runInTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Transaction failed, rolled back');
    } finally {
      await queryRunner.release();
    }
  }

  // ===================== 1. TẠO NHÁP (Draft) =====================
  async createDraft(dto: CreatePurchaseRequestDto, requesterId: number) {
    const effectiveRequestKey = dto.requestKey ?? this.generateContentHash(dto, requesterId);

    const existedRequestKey = await this.prRepository.findOneBy({
      requestKey: effectiveRequestKey,
    });
    if (existedRequestKey) {
      this.logger.error(
        `Request trùng (requestKey="${existedRequestKey.requestKey}") → trả lại PR #${existedRequestKey.id} cũ`,
      );
      return {
        message: 'Yêu cầu đã được ghi nhận trước đó (request trùng lặp)',
        result: existedRequestKey,
      };
    }

    const existedDepartment = await this.departmentRepository.findOneBy({ id: dto.departmentId });
    if (!existedDepartment) {
      throw new NotFoundException('Not-found-deparment');
    }

    const saved = await this.runInTransaction(async (manager) => {
      const pr = manager.create(PurchaseRequest, {
        requestKey: effectiveRequestKey,
        departmentId: dto.departmentId,
        purposeOfUse: dto.purposeOfUse ?? '',
        requesterId,
        status: PurchaseRequestStatus.DRAFT,
      });
      const saved = await manager.save(pr);

      if (dto.items?.length) {
        const items = dto.items.map((i) =>
          manager.create(PurchaseRequestItem, {
            itemName: i.itemName,
            quantity: i.quantity,
            purchaseRequestId: saved.id,
          }),
        );
        await manager.save(items);
      }

      if (dto.quotations?.length) {
        const quotations = dto.quotations.map((q) =>
          manager.create(PurchaseRequestQuotation, {
            supplierId: q.supplierId,
            quotedAmount: q.quotedAmount,
            quotationFileUrl: q.quotationFileUrl,
            purchaseRequestId: saved.id,
          }),
        );
        await manager.save(quotations);
      }

      await manager.save(
        manager.create(PurchaseRequestHistory, {
          purchaseRequestId: Number(saved.id),
          fromStatus: null,
          toStatus: PurchaseRequestStatus.DRAFT,
          actorId: requesterId,
        }),
      );

      return saved;
    });
    this.logger.log('Tạo nháp yêu cầu mua hàng thành công');
    return { message: 'Tạo nháp yêu cầu mua hàng thành công', result: saved };
  }

  // ===================== 2. CẬP NHẬT — chỉ khi status = DRAFT =====================
  async update(id: number, dto: UpdatePurchaseRequestDto, actorId: number) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.DRAFT) {
      throw new BadRequestException('only-draft-purchase-request-can-be-updated');
    }
    if (pr.requesterId !== actorId) {
      throw new ForbiddenException('only-the-requester-can-update-their-own-draft');
    }

    const saved = await this.runInTransaction(async (manager) => {
      if (dto.departmentId !== undefined) pr.departmentId = dto.departmentId;
      if (dto.purposeOfUse !== undefined) pr.purposeOfUse = dto.purposeOfUse;

      if (dto.items !== undefined) {
        await manager.delete(PurchaseRequestItem, { purchaseRequestId: id });
        pr.items = dto.items.map((i) =>
          manager.create(PurchaseRequestItem, {
            purchaseRequestId: id,
            itemName: i.itemName,
            quantity: i.quantity,
          }),
        );
        await manager.save(pr.items);
      }
      if (dto.quotations !== undefined) {
        await manager.delete(PurchaseRequestQuotation, { purchaseRequestId: id });
        pr.quotations = dto.quotations.map((q) =>
          manager.create(PurchaseRequestQuotation, {
            purchaseRequestId: id,
            supplierId: q.supplierId,
            quotedAmount: q.quotedAmount,
            quotationFileUrl: q.quotationFileUrl,
          }),
        );
        await manager.save(pr.quotations);
      }

      const saved = await manager.save(pr);
      return saved;
    });
    this.logger.log(`PR #${id} đã được cập nhật bởi #${actorId}`);
    return { message: 'Cập nhật yêu cầu mua hàng thành công', result: saved };
  }

  // ===================== 3. GỬI DUYỆT (Submit) — DRAFT -> PENDING =====================
  async submit(id: number, actorId: number) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.DRAFT) {
      throw new BadRequestException('only-draft-purchase-request-can-be-submitted');
    }
    if (pr.requesterId !== actorId) {
      throw new ForbiddenException('only-the-requester-can-submit-their-own-draft');
    }
    if (!pr.items || pr.items.length < 1) {
      throw new BadRequestException('purchase-request-must-have-at-least-1-item'); // BR-01
    }
    if (!pr.quotations || pr.quotations.length < 2) {
      throw new BadRequestException('purchase-request-must-have-at-least-2-supplier-quotations'); // BR-02
    }

    const saved = await this.runInTransaction(async (manager) => {
      const fromStatus = pr.status;
      pr.status = PurchaseRequestStatus.PENDING;
      const saved = await manager.save(pr);

      // cập nhật lại status trong bảng purchase request
      manager.update(PurchaseRequest, { id }, { status: PurchaseRequestStatus.PENDING });

      await manager.save(
        manager.create(PurchaseRequestHistory, {
          purchaseRequestId: id,
          fromStatus,
          toStatus: PurchaseRequestStatus.PENDING,
          actorId,
        }),
      );

      return saved;
    });
    this.logger.log(`PR #${id} đã được gửi duyệt bởi #${actorId}`);
    return { message: 'Gửi duyệt yêu cầu mua hàng thành công', result: saved };
  }

  // ===== Dùng chung cho Duyệt & Từ chối: kiểm tra "ĐÚNG Manager" của đúng phòng ban PR đó =====
  private async assertIsAuthorizedApprover(pr: PurchaseRequest, actorId: number, actorRole: ROLES) {
    if (actorRole === ROLES.ADMIN) return;

    if (!pr.departmentId) {
      if (actorRole !== ROLES.MANAGER)
        throw new ForbiddenException('only-manager-or-admin-can-approve-or-reject');
      return;
    }

    const department = await this.departmentRepository.findOne({ where: { id: pr.departmentId } });
    if (department?.managerId && department.managerId !== actorId) {
      throw new ForbiddenException(
        'only-the-department-manager-or-admin-can-approve-or-reject-this-request',
      );
    }
    if (!department?.managerId && actorRole !== ROLES.MANAGER) {
      throw new ForbiddenException('only-manager-or-admin-can-approve-or-reject');
    }
  }

  // ===================== 4. PHÊ DUYỆT — PENDING -> APPROVED =====================
  async approve(id: number, actorId: number, actorRole: ROLES) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('purchase-request-not-pending-approval');
    }

    await this.assertIsAuthorizedApprover(pr, actorId, actorRole);

    const saved = await this.runInTransaction(async (manager) => {
      const fromStatus = pr.status;
      pr.status = PurchaseRequestStatus.APPROVED;
      pr.approvedBy = actorId;
      const saved = await manager.save(pr);

      await manager.save(
        manager.create(PurchaseRequestHistory, {
          purchaseRequestId: id,
          fromStatus,
          toStatus: PurchaseRequestStatus.APPROVED,
          actorId,
        }),
      );

      return saved;
    });
    this.logger.log(`PR #${id} đã được duyệt bởi #${actorId}`);
    return { message: 'Phê duyệt yêu cầu mua hàng thành công', result: saved };
  }

  // ===================== 5. TỪ CHỐI — PENDING -> REJECTED (bắt buộc lý do) =====================
  async reject(id: number, dto: RejectPurchaseRequestDto, actorId: number, actorRole: ROLES) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('purchase-request-not-pending-approval');
    }

    await this.assertIsAuthorizedApprover(pr, actorId, actorRole);

    const saved = await this.runInTransaction(async (manager) => {
      const fromStatus = pr.status;
      pr.status = PurchaseRequestStatus.REJECTED;
      pr.approvedBy = actorId;
      pr.rejectReason = dto.reason;
      const saved = await manager.save(pr);

      await manager.save(
        manager.create(PurchaseRequestHistory, {
          purchaseRequestId: id,
          fromStatus,
          toStatus: PurchaseRequestStatus.REJECTED,
          actorId,
          note: dto.reason,
        }),
      );

      return saved;
    });

    this.logger.log(`PR #${id} đã bị từ chối bởi #${actorId}: ${dto.reason}`);
    return { message: 'Từ chối yêu cầu mua hàng thành công', result: saved };
  }

  // ===================== 6. XEM LỊCH SỬ =====================
  async getHistory(id: number) {
    await this.findOne(id);
    return this.historyRepository.find({
      where: { purchaseRequestId: id },
      order: { createdAt: 'ASC' },
    });
  }

  // ===================== 7. TÌM KIẾM (filter + paging) =====================
  async findAll(query: ListPurchaseRequestDto) {
    const { page, limit, status, keyword } = query;

    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (keyword) where.purposeOfUse = ILike(`%${keyword}%`);

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

  // ===================== (Giữ lại riêng) PHÁT HÀNH PO — tách khỏi hành động Duyệt =====================
  async issuePO(id: number, dto: IssuePoDto, actorId: number) {
    const pr = await this.findOne(id);

    const existedPurchaseRequestId = await this.poRepository.findOneBy({ purchaseRequestId: id });
    if (existedPurchaseRequestId) {
      throw new ConflictException('purchase-order-already-issued-for-this-request');
    }

    if (pr.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException('purchase-request-not-approved-yet');
    }

    const selectedQuotation = pr.quotations.find((q) => q.supplierId === dto.selectedSupplierId);

    if (!selectedQuotation) {
      throw new BadRequestException('selected-supplier-did-not-submit-a-quotation-for-this-pr');
    }

    const { savedPo, poItems } = await this.runInTransaction(async (manager) => {
      const po = manager.create(PurchaseOrder, {
        purchaseRequestId: pr.id,
        supplierId: dto.selectedSupplierId,
        totalAmount: 0,
        paymentTerm: dto.paymentTerm,
        status: PurchaseOrderStatus.RELEASED,
        createdBy: actorId,
      });
      const savedPo = await manager.save(po);

      const poItemEntities = pr.items.map((item) =>
        manager.create(PurchaseOrderItem, {
          purchaseOrderId: savedPo.id,
          itemName: item.itemName,
          quantity: item.quantity,
        }),
      );
      const poItems = await manager.save(poItemEntities);

      // Bước "cập nhật tổng tiền" tách riêng — nếu lỗi, toàn bộ transaction rollback
      await manager.update(PurchaseOrder, savedPo.id, {
        totalAmount: selectedQuotation.quotedAmount,
      });
      savedPo.totalAmount = selectedQuotation.quotedAmount;

      return { savedPo, poItems };
    });

    this.logger.log(`PR #${id} (đã Approved) → phát hành PO #${savedPo.id}`);
    return {
      message: 'Phát hành đơn mua hàng (PO) thành công',
      result: { ...savedPo, items: poItems },
    };
  }
}
