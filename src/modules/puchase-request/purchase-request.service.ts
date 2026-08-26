import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { AppLogger } from "src/common/logger/app-logger.service";
import { PurchaseRequest, PurchaseRequestStatus } from "./entities/purchase-request.entity";
import { ILike, Repository } from "typeorm";
import { PurchaseRequestHistory } from "./entities/purchase-request-history.entity";
import { Department } from "../department/entities/department.entity";
import { PurchaseOrder, PurchaseOrderStatus } from "../purchase-order/entities/purchase-order.entity";
import { PurchaseOrderItem } from "../purchase-order/entities/purchase-order-item.entity";
import { DataSource } from "typeorm";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { UpdatePurchaseRequestDto } from "./dto/update-purchase-request.dto";
import { PurchaseRequestItem } from "./entities/purchase-request-item.entity";
import { PurchaseRequestQuotation } from "./entities/purchase-request-quotation.entity";
import { Role } from "src/common/constants/role.enum";
import { RejectPurchaseRequestDto } from "./dto/reject-purchase-request.dto";
import { IssuePoDto } from "./dto/issue-purchase-order.dto";
import { ListPurchaseRequestDto } from "./dto/list-purchase-request.dto";

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

  // ===================== 1. TẠO NHÁP (Draft) =====================
  async createDraft(dto: CreatePurchaseRequestDto, requesterId: number) {
    if (dto.requestKey) {
      const existed = await this.prRepository.findOne({ where: { requestKey: dto.requestKey } });
      if (existed) {
        this.logger.log(`Request trùng (requestKey="${dto.requestKey}") → trả lại PR #${existed.id} cũ`);
        return { message: 'Yêu cầu đã được ghi nhận trước đó (request trùng lặp)', result: existed };
      }
    }

    const existedDepartment = await this.departmentRepository.findOneBy({ id: dto.departmentId });
    if (!existedDepartment) {
      throw new NotFoundException("Not-found-deparment")
    }
    try {
      return await this.dataSource.transaction(async (manager) => {
        const pr = manager.create(PurchaseRequest, {
          requestKey: dto.requestKey,
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

        return { message: 'Tạo nháp yêu cầu mua hàng thành công', result: saved };
      });
    } catch (err: any) {
      if (err.code === MYSQL_DUPLICATE_ENTRY_ERROR_CODE && dto.requestKey) {
        const existed = await this.prRepository.findOne({ where: { requestKey: dto.requestKey } });
        if (existed) return { message: 'Yêu cầu đã được ghi nhận trước đó (request trùng lặp)', result: existed };
      }
      throw err;
    }
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

    return this.dataSource.transaction(async (manager) => {
      if (dto.departmentId !== undefined) pr.departmentId = dto.departmentId;
      if (dto.purposeOfUse !== undefined) pr.purposeOfUse = dto.purposeOfUse;

      if (dto.items !== undefined) {
        await manager.delete(PurchaseRequestItem, { purchaseRequestId: id });
        pr.items = dto.items.map((i) =>
          manager.create(PurchaseRequestItem, { purchaseRequestId: id, itemName: i.itemName, quantity: i.quantity }),
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
      this.logger.log(`PR #${id} đã được cập nhật bởi #${actorId}`);
      return { message: 'Cập nhật yêu cầu mua hàng thành công', result: saved };
    });
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

    return this.dataSource.transaction(async (manager) => {
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

      this.logger.log(`PR #${id} đã được gửi duyệt bởi #${actorId}`);
      return { message: 'Gửi duyệt yêu cầu mua hàng thành công', result: saved };
    });
  }

  // ===== Dùng chung cho Duyệt & Từ chối: kiểm tra "ĐÚNG Manager" của đúng phòng ban PR đó =====
  private async assertIsAuthorizedApprover(pr: PurchaseRequest, actorId: number, actorRole: Role) {
    if (actorRole === Role.ADMIN) return;

    if (!pr.departmentId) {
      if (actorRole !== Role.MANAGER) throw new ForbiddenException('only-manager-or-admin-can-approve-or-reject');
      return;
    }

    const department = await this.departmentRepository.findOne({ where: { id: pr.departmentId } });
    if (department?.managerId && department.managerId !== actorId) {
      throw new ForbiddenException('only-the-department-manager-or-admin-can-approve-or-reject-this-request');
    }
    if (!department?.managerId && actorRole !== Role.MANAGER) {
      throw new ForbiddenException('only-manager-or-admin-can-approve-or-reject');
    }
  }

  // ===================== 4. PHÊ DUYỆT — PENDING -> APPROVED =====================
  async approve(id: number, actorId: number, actorRole: Role) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('purchase-request-not-pending-approval');
    }

    await this.assertIsAuthorizedApprover(pr, actorId, actorRole);

    return this.dataSource.transaction(async (manager) => {
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

      this.logger.log(`PR #${id} đã được duyệt bởi #${actorId}`);
      return { message: 'Phê duyệt yêu cầu mua hàng thành công', result: saved };
    });
  }

  // ===================== 5. TỪ CHỐI — PENDING -> REJECTED (bắt buộc lý do) =====================
  async reject(id: number, dto: RejectPurchaseRequestDto, actorId: number, actorRole: Role) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('purchase-request-not-pending-approval');
    }

    await this.assertIsAuthorizedApprover(pr, actorId, actorRole);

    return this.dataSource.transaction(async (manager) => {
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

      this.logger.log(`PR #${id} đã bị từ chối bởi #${actorId}: ${dto.reason}`);
      return { message: 'Từ chối yêu cầu mua hàng thành công', result: saved };
    });
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
    console.log(pr)

    if (pr.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException('purchase-request-not-approved-yet');
    }

    const selectedQuotation = pr.quotations.find((q) => q.supplierId === dto.selectedSupplierId);
    if (!selectedQuotation) {
      throw new BadRequestException('selected-supplier-did-not-submit-a-quotation-for-this-pr');
    }

    try {
      const { savedPo, poItems } = await this.dataSource.transaction(async (manager) => {
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
        await manager.update(PurchaseOrder, savedPo.id, { totalAmount: selectedQuotation.quotedAmount });
        savedPo.totalAmount = selectedQuotation.quotedAmount;

        return { savedPo, poItems };
      });

      this.logger.log(`PR #${id} (đã Approved) → phát hành PO #${savedPo.id}`);
      return {
        message: 'Phát hành đơn mua hàng (PO) thành công',
        result: { ...savedPo, items: poItems },
      };
    } catch (err: any) {
      if (err.code === MYSQL_DUPLICATE_ENTRY_ERROR_CODE) {
        throw new ConflictException('purchase-order-already-issued-for-this-request');
      }
      throw err;
    }
  }
}