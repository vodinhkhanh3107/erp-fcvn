import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { PurchaseRequest, PurchaseRequestStatus } from '../../models/purchase-request.entity';
import { DataSource, EntityManager, ILike, In, Repository } from 'typeorm';
import { PurchaseRequestHistory } from '../../models/purchase-request-history.entity';
import { Department } from '../../models/department.entity';
import { PurchaseOrder, PurchaseOrderStatus } from '../../models/purchase-order.entity';
import { PurchaseOrderItem } from '../../models/purchase-order-item.entity';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { PurchaseRequestItem } from '../../models/purchase-request-item.entity';
import { PurchaseRequestItemQuotation } from '../../models/purchase-request-item-quotation.entity';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { IssuePoDto } from './dto/issue-purchase-order.dto';
import { ListPurchaseRequestDto } from './dto/list-purchase-request.dto';

import * as crypto from 'crypto';
import { SupplierQuotation } from '../../models/supplier-quotation.entity';
import {
  FILE_STORAGE_SERVICE,
  IFileStorageService,
} from '../../common/file-storage/file-storage.interface';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../../common/constants/file-size.constants';
import { Readable } from 'typeorm/platform/PlatformTools.js';
import axios from 'axios';

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
    @InjectRepository(PurchaseRequestItemQuotation)
    private readonly itemQuotationRepository: Repository<PurchaseRequestItemQuotation>,
    @InjectRepository(SupplierQuotation)
    private readonly sqRepository: Repository<SupplierQuotation>,
    @Inject(FILE_STORAGE_SERVICE) private readonly storage: IFileStorageService,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('PurchaseRequestService');
  }

  async downloadQuotation(
    purchaseRequestId: number,
    requesterId: number,
    isPrivilegedRole: boolean,
  ): Promise<{ stream: Readable; fileName: string; mimeType: string }> {
    const purchaseRequest = await this.prRepository.findOneBy({ id: purchaseRequestId });
    if (!purchaseRequest) {
      throw new NotFoundException('Not-found-purchase-request');
    }

    if (!isPrivilegedRole && purchaseRequest.signedBy !== requesterId) {
      throw new BadRequestException('Not-have-permision-to-access');
    }

    const response = await axios.get(purchaseRequest.signatureFileUrl, { responseType: 'stream' });

    const contentType = response.headers['content-type'];
    const mimeType = typeof contentType === 'string' ? contentType : 'application/octet-stream';
    return {
      stream: response.data,
      fileName: purchaseRequest.signatureFileUrl,
      mimeType,
    };
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
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      this.logger.error('Transaction failed, rolled back', (err as unknown as Error).stack);
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

  private async determineInitialStatus(dto: CreatePurchaseRequestDto): Promise<boolean> {
    const supplierIds = Array.from(
      new Set(
        (dto.items ?? []).flatMap((item) => (item.quotations ?? []).map((q) => q.supplierId)),
      ),
    );

    if (supplierIds.length === 0) return false;

    const existingQuotations = await this.sqRepository.find({
      where: { supplierId: In(supplierIds) },
      select: ['supplierId'],
    });

    const existingSupplierIds = new Set(existingQuotations.map((q) => q.supplierId));
    const allSuppliersHaveHistory = supplierIds.every((id) => existingSupplierIds.has(id));

    return allSuppliersHaveHistory;
  }

  // ===================== 1. TẠO NHÁP (Draft) — nhiều vật tư, mỗi vật tư 2 báo giá riêng =====================
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
    if (!initialStatus)
      throw new BadRequestException('supplier-not-have-quotation-or-not-have-supplier');

    const saved = await this.runInTransaction(async (manager) => {
      const pr = manager.create(PurchaseRequest, {
        requestKey: effectiveRequestKey,
        departmentId: dto.departmentId,
        purposeOfUse: dto.purposeOfUse ?? '',
        requesterId,
        status: PurchaseRequestStatus.PENDING,
      });
      const savedPr = await manager.save(pr);

      if (dto.items?.length) {
        for (const itemDto of dto.items) {
          const item = manager.create(PurchaseRequestItem, {
            itemName: itemDto.itemName,
            quantity: itemDto.quantity,
            purchaseRequest: savedPr,
          });
          const savedItem = await manager.save(item);

          if (itemDto.quotations?.length) {
            const quotations = itemDto.quotations.map((q) =>
              manager.create(PurchaseRequestItemQuotation, {
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
          toStatus: PurchaseRequestStatus.PENDING,
          actorId: requesterId,
        }),
      );

      return savedPr;
    });

    const message = 'Tạo yêu cầu mua hàng thành công';

    this.logger.log(message);
    return { message, result: saved };
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

    if (dto.items !== undefined) {
      this.assertNoDuplicateSupplierPerItem(dto.items);
    }

    const saved = await this.runInTransaction(async (manager) => {
      if (dto.departmentId !== undefined) pr.departmentId = dto.departmentId;
      if (dto.purposeOfUse !== undefined) pr.purposeOfUse = dto.purposeOfUse;

      if (dto.items !== undefined) {
        await manager.delete(PurchaseRequestItem, { purchaseRequestId: id });

        const newItems: PurchaseRequestItem[] = [];
        for (const itemDto of dto.items) {
          const item = manager.create(PurchaseRequestItem, {
            itemName: itemDto.itemName,
            quantity: itemDto.quantity,
            purchaseRequest: pr,
          });
          const savedItem = await manager.save(item);

          if (itemDto.quotations?.length) {
            const quotations = itemDto.quotations.map((q) =>
              manager.create(PurchaseRequestItemQuotation, {
                supplierId: q.supplierId,
                quotedAmount: q.quotedAmount,
                // quotationFileUrl: q.quotationFileUrl,
                item: savedItem,
              }),
            );
            await manager.save(quotations);
            savedItem.quotations = quotations;
          }
          newItems.push(savedItem);
        }
        pr.items = newItems;
      }

      return manager.save(pr);
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

    const itemMissingQuotations = pr.items.find(
      (item) => !item.quotations || item.quotations.length < 2,
    );
    if (itemMissingQuotations) {
      throw new BadRequestException(
        `item-${itemMissingQuotations.id}-must-have-at-least-2-supplier-quotations`,
      );
    }

    const supplierHasQuotation = await this.sqRepository.findOneBy({ id });

    if (!supplierHasQuotation)
      throw new BadRequestException('supplier-not-have-quotation-or-not-have-supplier');

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

  private async assertIsAuthorizedApprover(pr: PurchaseRequest, actorId: number) {
    // const department = await this.departmentRepository.findOne({ where: { id: pr.departmentId } });
    // if (department?.managerId && department.managerId !== actorId) {
    //   throw new ForbiddenException(
    //     'only-the-department-manager-or-admin-can-approve-or-reject-this-request',
    //   );
    // }
    // if (!department?.managerId) {
    //   throw new ForbiddenException('only-manager-or-admin-can-approve-or-reject');
    // }
  }

  async signPurchaseRequest(id: number, file: Express.Multer.File, actorId: number) {
    if (!file) {
      throw new BadRequestException('signature-file-is-required');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File vượt quá giới hạn cho phép');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Định dạng file không được hỗ trợ');
    }

    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('only-pending-purchase-request-can-be-signed');
    }

    const uploaded = await this.storage.upload(file, 'signature-file');

    const saved = await this.runInTransaction(async (manager) => {
      const fromStatus = pr.status;
      pr.status = PurchaseRequestStatus.SIGNED;
      pr.signatureFileUrl = uploaded.fileUrl;
      pr.signedBy = actorId;
      pr.signedAt = new Date();
      const savedPr = await manager.save(pr);

      await manager.save(
        manager.create(PurchaseRequestHistory, {
          purchaseRequestId: id,
          fromStatus,
          toStatus: PurchaseRequestStatus.SIGNED,
          actorId,
          note: 'Đã upload chữ ký',
        }),
      );

      return savedPr;
    });

    this.logger.log(`PR #${id} đã được ký (upload chữ ký) bởi #${actorId}`);
    return {
      message: 'Tải lên chữ ký thành công, yêu cầu chuyển sang trạng thái Đã ký',
      result: saved,
    };
  }

  // ===================== 4. PHÊ DUYỆT — PENDING -> APPROVED =====================
  async approve(id: number, actorId: number) {
    const pr = await this.findOne(id);
    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('purchase-request-not-pending-approval');
    }

    await this.assertIsAuthorizedApprover(pr, actorId);

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

  // ===================== 5. TỪ CHỐI — PENDING -> REJECTED =====================
  async reject(id: number, dto: RejectPurchaseRequestDto, actorId: number) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('purchase-request-not-pending-approval');
    }

    await this.assertIsAuthorizedApprover(pr, actorId);

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
      relations: {
        requester: true,
        department: true,
        // Load items KÈM quotations của từng item (thay vì quotations cấp PR như trước)
        items: { quotations: { supplier: true } },
      },
    });
    if (!pr) throw new NotFoundException('purchase-request-not-found');
    return pr;
  }

  // ===================== 8. PHÁT HÀNH PO — mỗi vật tư chọn nhà cung cấp riêng =====================
  async issuePO(id: number, dto: IssuePoDto, actorId: number) {
    const pr = await this.findOne(id);
    const existedPo = await this.poRepository.findOneBy({ purchaseRequestId: id });
    if (existedPo) {
      throw new ConflictException('purchase-order-already-issued-for-this-request');
    }

    if (pr.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException('purchase-request-not-approved-yet');
    }

    const itemMap = new Map(
      (pr.items ?? []).map((item) => {
        return [item.id, item];
      }),
    );

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

    const selectedItemIds = new Set(dto.selections.map((s) => s.itemId));
    const missingItem = (pr.items ?? []).find((item) => !selectedItemIds.has(item.id));
    if (missingItem) {
      throw new BadRequestException(`missing-supplier-selection-for-item-${missingItem.id}`);
    }

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
      const guardResult = await manager
        .createQueryBuilder()
        .update(PurchaseRequest)
        .set({ poIssuedAt: new Date() })
        .where('id = :id AND poIssuedAt IS NULL', { id })
        .execute();

      if (guardResult.affected === 0) {
        throw new ConflictException('purchase-order-already-issued-for-this-request');
      }
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
