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
exports.SupplierGroupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const base_service_1 = require("../../common/base/base.service");
const supplier_entity_1 = require("../supplier/entities/supplier.entity");
const supplier_group_entity_1 = require("./entities/supplier-group.entity");
let SupplierGroupService = class SupplierGroupService extends base_service_1.BaseService {
    constructor(repo, supplierRepo) {
        super(repo, ['code', 'name']);
        this.supplierRepo = supplierRepo;
    }
    async createGroup(dto, actorId) {
        const existed = await this.repository.findOne({ where: { code: dto.code } });
        if (existed)
            throw new common_1.ConflictException('supplier-group-code-already-exists');
        const saved = await this.create({ ...dto, createdBy: actorId, updatedBy: actorId });
        return { message: 'Tạo nhóm NCC thành công', result: saved };
    }
    async updateGroup(id, dto, actorId) {
        const saved = await this.update(id, { ...dto, updatedBy: actorId });
        return { message: 'Cập nhật nhóm NCC thành công', result: saved };
    }
    async updateStatus(id, dto, actorId) {
        const group = await this.findOne(id);
        if (group.status === dto.status) {
            throw new common_1.BadRequestException('status-not-changed');
        }
        const saved = await this.update(id, { status: dto.status, updatedBy: actorId });
        return { message: 'Cập nhật trạng thái thành công', result: saved };
    }
    async assignSuppliers(groupId, dto, actorId) {
        if (!groupId)
            throw new common_1.BadRequestException('supplier-group is not exist');
        const group = await this.findOne(groupId);
        if (group.status !== supplier_group_entity_1.SupplierGroupStatus.ACTIVE) {
            throw new common_1.BadRequestException('cannot-assign-suppliers-to-inactive-group');
        }
        const suppliers = await this.supplierRepo.findBy({ id: (0, typeorm_2.In)(dto.supplierIds) });
        if (suppliers.length !== dto.supplierIds.length) {
            throw new common_1.BadRequestException('one-or-more-supplier-ids-not-found');
        }
        await this.supplierRepo.update(dto.supplierIds, { groupId, updatedBy: actorId });
        return { message: `Đã gán ${suppliers.length} nhà cung cấp vào nhóm "${group.name}"` };
    }
};
exports.SupplierGroupService = SupplierGroupService;
exports.SupplierGroupService = SupplierGroupService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(supplier_group_entity_1.SupplierGroup)),
    __param(1, (0, typeorm_1.InjectRepository)(supplier_entity_1.Supplier)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SupplierGroupService);
//# sourceMappingURL=supplier-group.service.js.map