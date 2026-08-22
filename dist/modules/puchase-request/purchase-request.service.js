"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseRequestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_logger_service_1 = require("../../common/logger/app-logger.service");
const purchase_order_entity_1 = require("../purchase-order/entities/purchase-order.entity");
const purchase_order_item_entity_1 = require("../purchase-order/entities/purchase-order-item.entity");
const purchase_request_entity_1 = require("./entities/purchase-request.entity");
const MYSQL_DUPLICATE_ENTRY_ERROR_CODE = 'ER_DUP_ENTRY';
let PurchaseRequestService = class PurchaseRequestService {
    constructor(prRepository, poRepository, poItemRepository, dataSource) {
        this.prRepository = prRepository;
        this.poRepository = poRepository;
        this.poItemRepository = poItemRepository;
        this.dataSource = dataSource;
        this.logger = new app_logger_service_1.AppLogger();
        this.logger.setContext('PurchaseRequestService');
    }
    async create(dto, requesterId) {
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
            status: purchase_request_entity_1.PurchaseRequestStatus.PENDING,
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
        }
        catch (err) {
            if (err.code === MYSQL_DUPLICATE_ENTRY_ERROR_CODE && dto.requestKey) {
                const existed = await this.prRepository.findOne({ where: { requestKey: dto.requestKey } });
                if (existed)
                    return { message: 'Yêu cầu mua hàng đã được ghi nhận trước đó (request trùng lặp)', result: existed };
            }
            throw err;
        }
    }
    async findAll(query) {
        const { page, limit, status } = query;
        const where = {};
        if (status)
            where.status = status;
        const [items, total] = await this.prRepository.findAndCount({
            where,
            relations: { requester: true, department: true },
            order: { id: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async findOne(id) {
        const pr = await this.prRepository.findOne({
            where: { id },
            relations: { requester: true, department: true, items: true, quotations: { supplier: true } },
        });
        if (!pr)
            throw new common_1.NotFoundException('purchase-request-not-found');
        return pr;
    }
    async approveAndIssuePO(id, dto, approverId) {
        const pr = await this.findOne(id);
        if (pr.status !== purchase_request_entity_1.PurchaseRequestStatus.PENDING) {
            throw new common_1.BadRequestException('purchase-request-not-pending');
        }
        const selectedQuotation = pr.quotations.find((q) => q.supplierId === dto.selectedSupplierId);
        if (!selectedQuotation) {
            throw new common_1.BadRequestException('selected-supplier-did-not-submit-a-quotation-for-this-pr');
        }
        try {
            const { updatedPr, savedPo, poItems } = await this.dataSource.transaction(async (manager) => {
                pr.status = purchase_request_entity_1.PurchaseRequestStatus.APPROVED;
                pr.approvedBy = approverId;
                const updatedPr = await manager.save(pr);
                const po = manager.create(purchase_order_entity_1.PurchaseOrder, {
                    purchaseRequestId: pr.id,
                    supplierId: dto.selectedSupplierId,
                    totalAmount: 0,
                    paymentTerm: dto.paymentTerm,
                    status: purchase_order_entity_1.PurchaseOrderStatus.RELEASED,
                    createdBy: approverId,
                });
                const savedPo = await manager.save(po);
                const poItemEntities = pr.items.map((item) => manager.create(purchase_order_item_entity_1.PurchaseOrderItem, {
                    purchaseOrderId: savedPo.id,
                    itemName: item.itemName,
                    quantity: item.quantity,
                }));
                const poItems = await manager.save(poItemEntities);
                await manager.update(purchase_order_entity_1.PurchaseOrder, savedPo.id, { totalAmount: selectedQuotation.quotedAmount });
                savedPo.totalAmount = selectedQuotation.quotedAmount;
                return { updatedPr, savedPo, poItems };
            });
            this.logger.log(`PR #${id} đã được duyệt bởi #${approverId} → phát hành PO #${savedPo.id} cho NCC #${dto.selectedSupplierId}`);
            return {
                message: 'Duyệt yêu cầu mua hàng và phát hành đơn mua hàng (PO) thành công',
                result: { purchaseRequest: updatedPr, purchaseOrder: { ...savedPo, items: poItems } },
            };
        }
        catch (err) {
            if (err.code === MYSQL_DUPLICATE_ENTRY_ERROR_CODE) {
                throw new common_1.ConflictException('purchase-order-already-issued-for-this-request');
            }
            throw err;
        }
    }
    async reject(id, dto, approverId) {
        const pr = await this.findOne(id);
        if (pr.status !== purchase_request_entity_1.PurchaseRequestStatus.PENDING) {
            throw new common_1.BadRequestException('purchase-request-not-pending');
        }
        pr.status = purchase_request_entity_1.PurchaseRequestStatus.REJECTED;
        pr.approvedBy = approverId;
        const saved = await this.prRepository.save(pr);
        this.logger.log(`PR #${id} đã bị từ chối bởi #${approverId}${dto.reason ? `: ${dto.reason}` : ''}`);
        return { message: 'Từ chối yêu cầu mua hàng thành công', result: saved };
    }
};
exports.PurchaseRequestService = PurchaseRequestService;
exports.PurchaseRequestService = PurchaseRequestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_request_entity_1.PurchaseRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_order_entity_1.PurchaseOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(purchase_order_item_entity_1.PurchaseOrderItem)),
    __param(3, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], PurchaseRequestService);
//# sourceMappingURL=purchase-request.service.js.map