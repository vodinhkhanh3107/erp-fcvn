"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const app_logger_service_1 = require("../../common/logger/app-logger.service");
const purchase_request_entity_1 = require("../../models/purchase-request.entity");
const typeorm_2 = require("typeorm");
const purchase_request_history_entity_1 = require("../../models/purchase-request-history.entity");
const department_entity_1 = require("../../models/department.entity");
const purchase_order_entity_1 = require("../../models/purchase-order.entity");
const purchase_order_item_entity_1 = require("../../models/purchase-order-item.entity");
const typeorm_3 = require("typeorm");
const purchase_request_item_entity_1 = require("../../models/purchase-request-item.entity");
const purchase_request_quotation_entity_1 = require("../../models/purchase-request-quotation.entity");
const role_enum_1 = require("../../common/constants/role.enum");
const crypto = __importStar(require("crypto"));
const MYSQL_DUPLICATE_ENTRY_ERROR_CODE = 'ER_DUP_ENTRY';
let PurchaseRequestService = class PurchaseRequestService {
    constructor(prRepository, historyRepository, departmentRepository, poRepository, poItemRepository, dataSource) {
        this.prRepository = prRepository;
        this.historyRepository = historyRepository;
        this.departmentRepository = departmentRepository;
        this.poRepository = poRepository;
        this.poItemRepository = poItemRepository;
        this.dataSource = dataSource;
        this.logger = new app_logger_service_1.AppLogger();
        this.logger.setContext('PurchaseRequestService');
    }
    generateContentHash(dto, requesterId) {
        const payload = JSON.stringify({
            requesterId,
            departmentId: dto.departmentId,
            purposeOfUse: dto.purposeOfUse,
            items: dto.items,
            quotations: dto.quotations,
        });
        return crypto.createHash('sha256').update(payload).digest('hex');
    }
    async runInTransaction(work) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const result = await work(queryRunner.manager);
            await queryRunner.commitTransaction();
            return result;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw new common_1.InternalServerErrorException('Transaction failed, rolled back');
        }
        finally {
            await queryRunner.release();
        }
    }
    async createDraft(dto, requesterId) {
        const effectiveRequestKey = dto.requestKey ?? this.generateContentHash(dto, requesterId);
        const existedRequestKey = await this.prRepository.findOneBy({ requestKey: effectiveRequestKey });
        if (existedRequestKey) {
            this.logger.error(`Request trùng (requestKey="${dto.requestKey}") → trả lại PR #${existedRequestKey.id} cũ`);
            return { message: 'Yêu cầu đã được ghi nhận trước đó (request trùng lặp)', result: existedRequestKey };
        }
        const existedDepartment = await this.departmentRepository.findOneBy({ id: dto.departmentId });
        if (!existedDepartment) {
            throw new common_1.NotFoundException("Not-found-deparment");
        }
        const saved = await this.runInTransaction(async (manager) => {
            const pr = manager.create(purchase_request_entity_1.PurchaseRequest, {
                requestKey: effectiveRequestKey,
                departmentId: dto.departmentId,
                purposeOfUse: dto.purposeOfUse ?? '',
                requesterId,
                status: purchase_request_entity_1.PurchaseRequestStatus.DRAFT,
            });
            const saved = await manager.save(pr);
            if (dto.items?.length) {
                const items = dto.items.map((i) => manager.create(purchase_request_item_entity_1.PurchaseRequestItem, {
                    itemName: i.itemName,
                    quantity: i.quantity,
                    purchaseRequestId: saved.id,
                }));
                await manager.save(items);
            }
            if (dto.quotations?.length) {
                const quotations = dto.quotations.map((q) => manager.create(purchase_request_quotation_entity_1.PurchaseRequestQuotation, {
                    supplierId: q.supplierId,
                    quotedAmount: q.quotedAmount,
                    quotationFileUrl: q.quotationFileUrl,
                    purchaseRequestId: saved.id,
                }));
                await manager.save(quotations);
            }
            await manager.save(manager.create(purchase_request_history_entity_1.PurchaseRequestHistory, {
                purchaseRequestId: Number(saved.id),
                fromStatus: null,
                toStatus: purchase_request_entity_1.PurchaseRequestStatus.DRAFT,
                actorId: requesterId,
            }));
            return saved;
        });
        this.logger.log('Tạo nháp yêu cầu mua hàng thành công');
        return { message: 'Tạo nháp yêu cầu mua hàng thành công', result: saved };
    }
    async update(id, dto, actorId) {
        const pr = await this.findOne(id);
        if (pr.status !== purchase_request_entity_1.PurchaseRequestStatus.DRAFT) {
            throw new common_1.BadRequestException('only-draft-purchase-request-can-be-updated');
        }
        if (pr.requesterId !== actorId) {
            throw new common_1.ForbiddenException('only-the-requester-can-update-their-own-draft');
        }
        const saved = await this.runInTransaction(async (manager) => {
            if (dto.departmentId !== undefined)
                pr.departmentId = dto.departmentId;
            if (dto.purposeOfUse !== undefined)
                pr.purposeOfUse = dto.purposeOfUse;
            if (dto.items !== undefined) {
                await manager.delete(purchase_request_item_entity_1.PurchaseRequestItem, { purchaseRequestId: id });
                pr.items = dto.items.map((i) => manager.create(purchase_request_item_entity_1.PurchaseRequestItem, { purchaseRequestId: id, itemName: i.itemName, quantity: i.quantity }));
                await manager.save(pr.items);
            }
            if (dto.quotations !== undefined) {
                await manager.delete(purchase_request_quotation_entity_1.PurchaseRequestQuotation, { purchaseRequestId: id });
                pr.quotations = dto.quotations.map((q) => manager.create(purchase_request_quotation_entity_1.PurchaseRequestQuotation, {
                    purchaseRequestId: id,
                    supplierId: q.supplierId,
                    quotedAmount: q.quotedAmount,
                    quotationFileUrl: q.quotationFileUrl,
                }));
                await manager.save(pr.quotations);
            }
            const saved = await manager.save(pr);
            return saved;
        });
        this.logger.log(`PR #${id} đã được cập nhật bởi #${actorId}`);
        return { message: 'Cập nhật yêu cầu mua hàng thành công', result: saved };
    }
    async submit(id, actorId) {
        const pr = await this.findOne(id);
        if (pr.status !== purchase_request_entity_1.PurchaseRequestStatus.DRAFT) {
            throw new common_1.BadRequestException('only-draft-purchase-request-can-be-submitted');
        }
        if (pr.requesterId !== actorId) {
            throw new common_1.ForbiddenException('only-the-requester-can-submit-their-own-draft');
        }
        if (!pr.items || pr.items.length < 1) {
            throw new common_1.BadRequestException('purchase-request-must-have-at-least-1-item');
        }
        if (!pr.quotations || pr.quotations.length < 2) {
            throw new common_1.BadRequestException('purchase-request-must-have-at-least-2-supplier-quotations');
        }
        const saved = await this.runInTransaction((async (manager) => {
            const fromStatus = pr.status;
            pr.status = purchase_request_entity_1.PurchaseRequestStatus.PENDING;
            const saved = await manager.save(pr);
            manager.update(purchase_request_entity_1.PurchaseRequest, { id }, { status: purchase_request_entity_1.PurchaseRequestStatus.PENDING });
            await manager.save(manager.create(purchase_request_history_entity_1.PurchaseRequestHistory, {
                purchaseRequestId: id,
                fromStatus,
                toStatus: purchase_request_entity_1.PurchaseRequestStatus.PENDING,
                actorId,
            }));
            return saved;
        }));
        this.logger.log(`PR #${id} đã được gửi duyệt bởi #${actorId}`);
        return { message: 'Gửi duyệt yêu cầu mua hàng thành công', result: saved };
    }
    async assertIsAuthorizedApprover(pr, actorId, actorRole) {
        if (actorRole === role_enum_1.ROLES.ADMIN)
            return;
        if (!pr.departmentId) {
            if (actorRole !== role_enum_1.ROLES.MANAGER)
                throw new common_1.ForbiddenException('only-manager-or-admin-can-approve-or-reject');
            return;
        }
        const department = await this.departmentRepository.findOne({ where: { id: pr.departmentId } });
        if (department?.managerId && department.managerId !== actorId) {
            throw new common_1.ForbiddenException('only-the-department-manager-or-admin-can-approve-or-reject-this-request');
        }
        if (!department?.managerId && actorRole !== role_enum_1.ROLES.MANAGER) {
            throw new common_1.ForbiddenException('only-manager-or-admin-can-approve-or-reject');
        }
    }
    async approve(id, actorId, actorRole) {
        const pr = await this.findOne(id);
        if (pr.status !== purchase_request_entity_1.PurchaseRequestStatus.PENDING) {
            throw new common_1.BadRequestException('purchase-request-not-pending-approval');
        }
        await this.assertIsAuthorizedApprover(pr, actorId, actorRole);
        const saved = await this.runInTransaction(async (manager) => {
            const fromStatus = pr.status;
            pr.status = purchase_request_entity_1.PurchaseRequestStatus.APPROVED;
            pr.approvedBy = actorId;
            const saved = await manager.save(pr);
            await manager.save(manager.create(purchase_request_history_entity_1.PurchaseRequestHistory, {
                purchaseRequestId: id,
                fromStatus,
                toStatus: purchase_request_entity_1.PurchaseRequestStatus.APPROVED,
                actorId,
            }));
            return saved;
        });
        this.logger.log(`PR #${id} đã được duyệt bởi #${actorId}`);
        return { message: 'Phê duyệt yêu cầu mua hàng thành công', result: saved };
    }
    async reject(id, dto, actorId, actorRole) {
        const pr = await this.findOne(id);
        if (pr.status !== purchase_request_entity_1.PurchaseRequestStatus.PENDING) {
            throw new common_1.BadRequestException('purchase-request-not-pending-approval');
        }
        await this.assertIsAuthorizedApprover(pr, actorId, actorRole);
        const saved = await this.runInTransaction((async (manager) => {
            const fromStatus = pr.status;
            pr.status = purchase_request_entity_1.PurchaseRequestStatus.REJECTED;
            pr.approvedBy = actorId;
            pr.rejectReason = dto.reason;
            const saved = await manager.save(pr);
            await manager.save(manager.create(purchase_request_history_entity_1.PurchaseRequestHistory, {
                purchaseRequestId: id,
                fromStatus,
                toStatus: purchase_request_entity_1.PurchaseRequestStatus.REJECTED,
                actorId,
                note: dto.reason,
            }));
            return saved;
        }));
        this.logger.log(`PR #${id} đã bị từ chối bởi #${actorId}: ${dto.reason}`);
        return { message: 'Từ chối yêu cầu mua hàng thành công', result: saved };
    }
    async getHistory(id) {
        await this.findOne(id);
        return this.historyRepository.find({
            where: { purchaseRequestId: id },
            order: { createdAt: 'ASC' },
        });
    }
    async findAll(query) {
        const { page, limit, status, keyword } = query;
        const where = {};
        if (status)
            where.status = status;
        if (keyword)
            where.purposeOfUse = (0, typeorm_2.ILike)(`%${keyword}%`);
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
    async issuePO(id, dto, actorId) {
        const pr = await this.findOne(id);
        const existedPurchaseRequestId = await this.poRepository.findOneBy({ purchaseRequestId: id });
        if (existedPurchaseRequestId) {
            throw new common_1.ConflictException('purchase-order-already-issued-for-this-request');
        }
        if (pr.status !== purchase_request_entity_1.PurchaseRequestStatus.APPROVED) {
            throw new common_1.BadRequestException('purchase-request-not-approved-yet');
        }
        const selectedQuotation = pr.quotations.find((q) => q.supplierId === dto.selectedSupplierId);
        if (!selectedQuotation) {
            throw new common_1.BadRequestException('selected-supplier-did-not-submit-a-quotation-for-this-pr');
        }
        const { savedPo, poItems } = await this.runInTransaction(async (manager) => {
            const po = manager.create(purchase_order_entity_1.PurchaseOrder, {
                purchaseRequestId: pr.id,
                supplierId: dto.selectedSupplierId,
                totalAmount: 0,
                paymentTerm: dto.paymentTerm,
                status: purchase_order_entity_1.PurchaseOrderStatus.RELEASED,
                createdBy: actorId,
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
            return { savedPo, poItems };
        });
        this.logger.log(`PR #${id} (đã Approved) → phát hành PO #${savedPo.id}`);
        return {
            message: 'Phát hành đơn mua hàng (PO) thành công',
            result: { ...savedPo, items: poItems },
        };
    }
};
exports.PurchaseRequestService = PurchaseRequestService;
exports.PurchaseRequestService = PurchaseRequestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_request_entity_1.PurchaseRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_request_history_entity_1.PurchaseRequestHistory)),
    __param(2, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(3, (0, typeorm_1.InjectRepository)(purchase_order_entity_1.PurchaseOrder)),
    __param(4, (0, typeorm_1.InjectRepository)(purchase_order_item_entity_1.PurchaseOrderItem)),
    __param(5, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], PurchaseRequestService);
//# sourceMappingURL=purchase-request.service.js.map