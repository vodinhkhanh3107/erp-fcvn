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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supplier = exports.SupplierStatus = void 0;
const typeorm_1 = require("typeorm");
const supplier_group_entity_1 = require("../../supplier-group/entities/supplier-group.entity");
var SupplierStatus;
(function (SupplierStatus) {
    SupplierStatus["ACTIVE"] = "active";
    SupplierStatus["INACTIVE"] = "inactive";
})(SupplierStatus || (exports.SupplierStatus = SupplierStatus = {}));
let Supplier = class Supplier {
};
exports.Supplier = Supplier;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Supplier.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Supplier.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_code', length: 50, unique: true }),
    __metadata("design:type", String)
], Supplier.prototype, "taxCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_name', length: 100, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "contactName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_email', length: 100, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_phone', length: 20, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "contactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_term', length: 20, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "paymentTerm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SupplierStatus, default: SupplierStatus.ACTIVE }),
    __metadata("design:type", String)
], Supplier.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => supplier_group_entity_1.SupplierGroup, (group) => group.suppliers, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'group_id' }),
    __metadata("design:type", supplier_group_entity_1.SupplierGroup)
], Supplier.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_id', nullable: true }),
    __metadata("design:type", Number)
], Supplier.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", Number)
], Supplier.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', nullable: true }),
    __metadata("design:type", Number)
], Supplier.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Supplier.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Supplier.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], Supplier.prototype, "deletedAt", void 0);
exports.Supplier = Supplier = __decorate([
    (0, typeorm_1.Entity)('suppliers')
], Supplier);
//# sourceMappingURL=supplier.entity.js.map