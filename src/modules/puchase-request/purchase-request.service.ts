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
import { EntityManager, ILike, In, Repository } from 'typeorm';
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
    @InjectRepository(PurchaseRequestQuotation)
    private readonly prQuotation: Repository<PurchaseRequestQuotation>,
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

  private assertNoDuplicateSupplierPerItem(
    items?: { itemName: string; quotations?: { supplierId: number }[] }[],
  ) {
    for (const item of items ?? []) {
      const supplierIds = (item.quotations ?? []).map((q) => q.supplierId);
      const uniqueSupplierIds = new Set(supplierIds);
      if (uniqueSupplierIds.size !== supplierIds.length) {
        throw new BadRequestException(
          `item-"${item.itemName}"-has-duplicate-supplier-in-quotations`,
        );
      }
    }
  }

  private async determineInitialStatus(
    dto: CreatePurchaseRequestDto,
  ): Promise<PurchaseRequestStatus> {
    const supplierIds = Array.from(
      new Set(
        (dto.items ?? []).flatMap((item) => (item.quotations ?? []).map((q) => q.supplierId)),
      ),
    );

    if (supplierIds.length === 0) return PurchaseRequestStatus.DRAFT;

    const existingQuotations = await this.prQuotation.find({
      where: { supplierId: In(supplierIds) },
      select: ['supplierId'],
    });
    const existingSupplierIds = new Set(existingQuotations.map((q) => q.supplierId));

    const allSuppliersHaveHistory = supplierIds.every((id) => existingSupplierIds.has(id));
    return allSuppliersHaveHistory ? PurchaseRequestStatus.PENDING : PurchaseRequestStatus.DRAFT;
  }

  // ===================== 1. TẠO NHÁP (Draft) =====================
  async create(dto: CreatePurchaseRequestDto, requesterId: number) {
    const effectiveRequestKey = dto.requestKey ?? this.generateContentHash(dto, requesterId);

    const existedRequestKey = await this.prRepository.findOneBy({
      requestKey: effectiveRequestKey,
    });
    if (existedRequestKey) {
      this.logger.log(
        `Request trùng (requestKey="${effectiveRequestKey}") → trả lại PR #${existedRequestKey.id} cũ`,
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

    this.assertNoDuplicateSupplierPerItem(dto.items);

    const initialStatus = await this.determineInitialStatus(dto);

    const saved = await this.runInTransaction(async (manager) => {
      const pr = manager.create(PurchaseRequest, {
        requestKey: effectiveRequestKey,
        departmentId: dto.departmentId,
        purposeOfUse: dto.purposeOfUse ?? '',
        requesterId,
        status: initialStatus,
      });
      const savedPr = await manager.save(pr);

      if (dto.items?.length) {
        for (const itemDto of dto.items) {
          console.log(itemDto);
          const item = manager.create(PurchaseRequestItem, {
            itemName: itemDto.itemName,
            quantity: itemDto.quantity,
            purchaseRequestId: savedPr.id,
          });
          const savedItem = await manager.save(item);

          if (itemDto.quotations?.length) {
            const quotations = itemDto.quotations.map((q) =>
              manager.create(PurchaseRequestQuotation, {
                supplierId: q.supplierId,
                quotedAmount: q.quotedAmount,
                // quotationFileUrl: q.quotationFileUrl,
                item: savedItem,
              }),
            );
            await manager.save(quotations);
          }
        }
      }

      await manager.save(
        manager.create(PurchaseRequestHistory, {
          purchaseRequestId: Number(savedPr.id),
          fromStatus: null,
          toStatus: PurchaseRequestStatus.DRAFT,
          actorId: requesterId,
        }),
      );

      return savedPr;
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

    // Bổ sung: kiểm tra department tồn tại nếu client có đổi departmentId (khớp createDraft)
    if (dto.departmentId !== undefined) {
      const existedDepartment = await this.departmentRepository.findOneBy({ id: dto.departmentId });
      if (!existedDepartment) throw new NotFoundException('Not-found-deparment');
    }

    if (dto.items !== undefined) {
      this.assertNoDuplicateSupplierPerItem(dto.items);
    }

    const saved = await this.runInTransaction(async (manager) => {
      if (dto.departmentId !== undefined) pr.departmentId = dto.departmentId;
      if (dto.purposeOfUse !== undefined) pr.purposeOfUse = dto.purposeOfUse;

      let items = pr.items;

      if (dto.items !== undefined) {
        await manager.delete(PurchaseRequestItem, { purchaseRequestId: id });

        items = [];
        for (const itemDto of dto.items) {
          const item = manager.create(PurchaseRequestItem, {
            itemName: itemDto.itemName,
            quantity: itemDto.quantity,
            purchaseRequest: pr,
          });
          const savedItem = await manager.save(item);

          if (itemDto.quotations?.length) {
            const quotations = itemDto.quotations.map((q) =>
              manager.create(PurchaseRequestQuotation, {
                supplierId: q.supplierId,
                quotedAmount: q.quotedAmount,
                // quotationFileUrl: q.quotationFileUrl,
                item: savedItem,
              }),
            );
            await manager.save(quotations);
            savedItem.quotations = quotations;
          }
          items.push(savedItem);
        }
      }

      const savedHeader = await manager.save(PurchaseRequest, {
        id: pr.id,
        departmentId: pr.departmentId,
        purposeOfUse: pr.purposeOfUse,
      });

      return { ...savedHeader, items };
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

    // BR-02 (đổi phạm vi so với thiết kế cũ): MỖI VẬT TƯ phải có ít nhất 2 báo giá,
    // không phải "cả PR cộng dồn đủ 2 báo giá" như trước — vì báo giá giờ gắn theo từng item.
    const itemMissingQuotations = pr.items.find(
      (item) => !item.quotations || item.quotations.length < 2,
    );
    if (itemMissingQuotations) {
      throw new BadRequestException(
        `item-${itemMissingQuotations.id}-must-have-at-least-2-supplier-quotations`,
      );
    }

    const saved = await this.runInTransaction(async (manager) => {
      const fromStatus = pr.status;
      pr.status = PurchaseRequestStatus.PENDING;
      const savedPr = await manager.save(pr);

      await manager.save(
        manager.create(PurchaseRequestHistory, {
          purchaseRequestId: id,
          fromStatus,
          toStatus: PurchaseRequestStatus.PENDING,
          actorId,
        }),
      );

      return savedPr;
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
      const savedPr = await manager.save(pr);

      await manager.save(
        manager.create(PurchaseRequestHistory, {
          purchaseRequestId: id,
          fromStatus,
          toStatus: PurchaseRequestStatus.APPROVED,
          actorId,
        }),
      );

      return savedPr;
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
      const savedPr = await manager.save(pr);

      await manager.save(
        manager.create(PurchaseRequestHistory, {
          purchaseRequestId: id,
          fromStatus,
          toStatus: PurchaseRequestStatus.REJECTED,
          actorId,
          note: dto.reason,
        }),
      );

      return savedPr;
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
      relations: { requester: true, department: true, items: true },
    });
    if (!pr) throw new NotFoundException('purchase-request-not-found');
    return pr;
  }

  // ===================== (Giữ lại riêng) PHÁT HÀNH PO — tách khỏi hành động Duyệt =====================
  async issuePO(id: number, dto: IssuePoDto, actorId: number) {
    const pr = await this.findOne(id);

    const existedPo = await this.poRepository.findOneBy({ purchaseRequestId: id });
    if (existedPo) {
      throw new ConflictException('purchase-order-already-issued-for-this-request');
    }

    if (pr.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException('purchase-request-not-approved-yet');
    }

    const itemMap = new Map((pr.items ?? []).map((item) => [item.id, item]));

    // Validate: mỗi lựa chọn phải khớp đúng item có thật trong PR, VÀ nhà cung cấp
    // được chọn phải thực sự nằm trong danh sách báo giá của đúng item đó.
    for (const selection of dto.selections) {
      const item = itemMap.get(selection.itemId);
      if (!item) {
        throw new BadRequestException(
          `item-${selection.itemId}-not-found-in-this-purchase-request`,
        );
      }
      const matchedQuotation = item.quotations?.find(
        (q) => q.supplierId === selection.selectedSupplierId,
      );
      if (!matchedQuotation) {
        throw new BadRequestException(
          `selected-supplier-did-not-submit-a-quotation-for-item-${selection.itemId}`,
        );
      }
    }

    // Bắt buộc phải chọn nhà cung cấp cho TẤT CẢ vật tư trong PR, không được bỏ sót
    const selectedItemIds = new Set(dto.selections.map((s) => s.itemId));
    const missingItem = (pr.items ?? []).find((item) => !selectedItemIds.has(item.id));
    if (missingItem) {
      throw new BadRequestException(`missing-supplier-selection-for-item-${missingItem.id}`);
    }

    // Gom nhóm vật tư theo nhà cung cấp đã chọn — mỗi nhóm sẽ tạo thành 1 PO riêng
    const groupedBySupplier = new Map<
      number,
      { item: PurchaseRequestItem; quotedAmount: number }[]
    >();
    for (const selection of dto.selections) {
      const item = itemMap.get(selection.itemId)!;
      const quotation = item.quotations!.find(
        (q) => q.supplierId === selection.selectedSupplierId,
      )!;
      const group = groupedBySupplier.get(selection.selectedSupplierId) ?? [];
      group.push({ item, quotedAmount: Number(quotation.quotedAmount) });
      groupedBySupplier.set(selection.selectedSupplierId, group);
    }

    const createdPos = await this.runInTransaction(async (manager) => {
      const results: { po: PurchaseOrder; items: PurchaseOrderItem[] }[] = [];

      for (const [supplierId, group] of groupedBySupplier.entries()) {
        const totalAmount = group.reduce((sum, g) => sum + g.quotedAmount, 0);

        const po = manager.create(PurchaseOrder, {
          purchaseRequestId: pr.id,
          supplierId,
          totalAmount,
          paymentTerm: dto.paymentTerm,
          status: PurchaseOrderStatus.RELEASED,
          createdBy: actorId,
        });
        const savedPo = await manager.save(po);

        const poItemEntities = group.map((g) =>
          manager.create(PurchaseOrderItem, {
            purchaseOrderId: savedPo.id,
            itemName: g.item.itemName,
            quantity: g.item.quantity,
          }),
        );
        const savedPoItems = await manager.save(poItemEntities);

        results.push({ po: savedPo, items: savedPoItems });
      }

      return results;
    });

    this.logger.log(
      `PR #${id} (đã Approved) → phát hành ${createdPos.length} PO (theo ${groupedBySupplier.size} nhà cung cấp khác nhau)`,
    );
    return {
      message: `Phát hành thành công ${createdPos.length} đơn mua hàng (PO)`,
      result: createdPos.map(({ po, items }) => ({ ...po, items })),
    };
  }
}
