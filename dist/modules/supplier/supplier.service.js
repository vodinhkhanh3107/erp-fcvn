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
exports.SupplierService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const base_service_1 = require("../../common/base/base.service");
const supplier_entity_1 = require("../../models/supplier.entity");
let SupplierService = class SupplierService extends base_service_1.BaseService {
    constructor(repo) {
        super(repo, ['name', 'taxCode']);
    }
    async createSupplier(dto, actorId) {
        const existed = await this.repository.findOne({ where: { taxCode: dto.taxCode } });
        if (existed)
            throw new common_1.ConflictException('tax-code-already-exists');
        const existedEmail = await this.repository.findOne({ where: { contactEmail: dto.contactEmail } });
        if (existedEmail)
            throw new common_1.ConflictException('email-name-already-exists');
        const saved = await this.create({ ...dto, createdBy: actorId, updatedBy: actorId });
        return { message: 'Tạo nhà cung cấp thành công', result: saved };
    }
};
exports.SupplierService = SupplierService;
exports.SupplierService = SupplierService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(supplier_entity_1.Supplier)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SupplierService);
//# sourceMappingURL=supplier.service.js.map