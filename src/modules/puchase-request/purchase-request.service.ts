import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../purchase-order/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchase-order/entities/purchase-order-item.entity';
import { ApprovePurchaseRequestDto } from './dto/approve-purchase-request.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { ListPurchaseRequestDto } from './dto/list-purchase-request.dto';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { PurchaseRequest, PurchaseRequestStatus } from './entities/purchase-request.entity';

// Mã lỗi MySQL cho vi phạm ràng buộc UNIQUE — dùng để nhận diện "trùng dữ liệu do
// race condition" và biến nó thành 1 lỗi nghiệp vụ rõ ràng (409) thay vì lỗi 500 khó hiểu.
const MYSQL_DUPLICATE_ENTRY_ERROR_CODE = 'ER_DUP_ENTRY';

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
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('PurchaseRequestService');
  }

  // ===== CHỨC NĂNG 1: Tạo yêu cầu mua hàng (PR) — đúng UC08 =====
  // Chống trùng khi client gửi lại request: nếu dto.requestKey đã tồn tại trong DB, TRẢ VỀ
  // bản ghi cũ thay vì tạo mới — đây gọi là "idempotent replay", cách xử lý chuẩn cho các
  // API tạo mới (POST) có khả năng bị gọi lại nhiều lần cho cùng 1 hành động của người dùng.
  async create(dto: CreatePurchaseRequestDto, requesterId: number) {
    if (dto.requestKey) {
      const existed = await this.prRepository.findOne({ where: { requestKey: dto.requestKey } });
      if (existed) {
        this.logger.log(`Phát hiện request trùng (requestKey="${dto.requestKey}") → trả lại PR #${existed.id} cũ`);
        return { message: 'Yêu cầu mua hàng đã được ghi nhận trước đó (request trùng lặp)', result: existed };
      }
    }

    const entity = this.prRepository.create({
      requestKey: dto.requestKey,
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

    try {
      const saved = await this.prRepository.save(entity);
      this.logger.log(`Nhân sự #${requesterId} đã tạo PR #${saved.id} — chờ duyệt`);
      return { message: 'Tạo yêu cầu mua hàng thành công, đang chờ duyệt', result: saved };
    } catch (err: any) {
      // Race condition hiếm gặp: 2 request cùng requestKey lọt qua check phía trên gần như
      // đồng thời (trước khi request đầu kịp lưu xong) — ràng buộc UNIQUE ở DB vẫn chặn được.
      if (err.code === MYSQL_DUPLICATE_ENTRY_ERROR_CODE && dto.requestKey) {
        const existed = await this.prRepository.findOne({ where: { requestKey: dto.requestKey } });
        if (existed) return { message: 'Yêu cầu mua hàng đã được ghi nhận trước đó (request trùng lặp)', result: existed };
      }
      throw err;
    }
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

  // ===== CHỨC NĂNG 2: Duyệt & phát hành PO — đúng UC09 =====
  // TOÀN BỘ 4 bước bên dưới (duyệt PR, tạo PO header, tạo PO items, cập nhật tổng tiền)
  // chạy trong 1 TRANSACTION DUY NHẤT qua `this.dataSource.transaction(...)`. Nếu BẤT KỲ
  // bước nào ném lỗi — kể cả bước cập nhật tổng tiền ở cuối cùng — TypeORM tự động ROLLBACK
  // toàn bộ, coi như không có gì từng xảy ra: PR vẫn giữ nguyên status Pending, PO/PO item
  // KHÔNG hề được lưu. Đây chính là cách sửa cho bug "cập nhật tổng tiền lỗi nhưng header
  // và items vẫn được lưu" — trước đây mỗi bước gọi `.save()` riêng lẻ, COMMIT ngay lập tức,
  // không có gì đảm bảo "tất cả cùng thành công hoặc tất cả cùng thất bại".
  async approveAndIssuePO(id: number, dto: ApprovePurchaseRequestDto, approverId: number) {
    const pr = await this.findOne(id);

    if (pr.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('purchase-request-not-pending');
    }

    const selectedQuotation = pr.quotations.find((q) => q.supplierId === dto.selectedSupplierId);
    if (!selectedQuotation) {
      throw new BadRequestException('selected-supplier-did-not-submit-a-quotation-for-this-pr');
    }

    try {
      const { updatedPr, savedPo, poItems } = await this.dataSource.transaction(async (manager) => {
        // Bước 1: duyệt PR (BR-02: PO chỉ được tạo SAU khi PR chuyển Approved)
        pr.status = PurchaseRequestStatus.APPROVED;
        pr.approvedBy = approverId;
        const updatedPr = await manager.save(pr);

        // Bước 2: tạo PO header — cố ý set totalAmount=0 lúc đầu, số tiền THẬT được ghi ở
        // Bước 4 riêng biệt (mô phỏng đúng luồng thực tế: tổng tiền có thể cần tính toán/
        // đối chiếu lại sau khi đã có đủ item, không phải lúc nào cũng biết ngay từ đầu).
        const po = manager.create(PurchaseOrder, {
          purchaseRequestId: pr.id,
          supplierId: dto.selectedSupplierId,
          totalAmount: 0,
          paymentTerm: dto.paymentTerm,
          status: PurchaseOrderStatus.RELEASED,
          createdBy: approverId,
        });
        const savedPo = await manager.save(po);

        // Bước 3: tạo PO items (copy lại từ PR items — đúng Data Mapping ERP_PO_ITEM)
        const poItemEntities = pr.items.map((item) =>
          manager.create(PurchaseOrderItem, {
            purchaseOrderId: savedPo.id,
            itemName: item.itemName,
            quantity: item.quantity,
          }),
        );
        const poItems = await manager.save(poItemEntities);

        // Bước 4: CẬP NHẬT TỔNG TIỀN — đây chính là bước từng gây lỗi trong kịch bản gốc.
        // Nếu dòng dưới đây throw (lỗi DB, lỗi tính toán, timeout...), nhờ đang nằm trong
        // `manager.transaction(...)`, TypeORM sẽ tự ROLLBACK cả Bước 1-2-3 ở trên — không
        // còn tình trạng "header/items được lưu nhưng tổng tiền sai/thiếu" nữa.
        await manager.update(PurchaseOrder, savedPo.id, { totalAmount: selectedQuotation.quotedAmount });
        savedPo.totalAmount = selectedQuotation.quotedAmount;

        return { updatedPr, savedPo, poItems };
      });

      this.logger.log(
        `PR #${id} đã được duyệt bởi #${approverId} → phát hành PO #${savedPo.id} cho NCC #${dto.selectedSupplierId}`,
      );

      return {
        message: 'Duyệt yêu cầu mua hàng và phát hành đơn mua hàng (PO) thành công',
        result: { purchaseRequest: updatedPr, purchaseOrder: { ...savedPo, items: poItems } },
      };
    } catch (err: any) {
      // Chống trùng khi RETRY: nếu request "approve" bị gửi lại (network timeout...) sau khi
      // lần trước ĐÃ commit thành công 1 PO cho đúng PR này, ràng buộc UNIQUE trên
      // purchase_request_id sẽ chặn tạo PO thứ 2 — biến lỗi kỹ thuật thành thông báo rõ ràng.
      if (err.code === MYSQL_DUPLICATE_ENTRY_ERROR_CODE) {
        throw new ConflictException('purchase-order-already-issued-for-this-request');
      }
      throw err;
    }
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
