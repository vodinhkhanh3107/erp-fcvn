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
exports.SupplierGroup = exports.SupplierGroupStatus = void 0;
const typeorm_1 = require("typeorm");
const supplier_entity_1 = require("./supplier.entity");
var SupplierGroupStatus;
(function (SupplierGroupStatus) {
    SupplierGroupStatus["ACTIVE"] = "active";
    SupplierGroupStatus["INACTIVE"] = "inactive";
})(SupplierGroupStatus || (exports.SupplierGroupStatus = SupplierGroupStatus = {}));
let SupplierGroup = class SupplierGroup {
};
exports.SupplierGroup = SupplierGroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SupplierGroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], SupplierGroup.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], SupplierGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], SupplierGroup.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SupplierGroupStatus, default: SupplierGroupStatus.ACTIVE }),
    __metadata("design:type", String)
], SupplierGroup.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", Number)
], SupplierGroup.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', nullable: true }),
    __metadata("design:type", Number)
], SupplierGroup.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => supplier_entity_1.Supplier, (supplier) => supplier.group),
    __metadata("design:type", Array)
], SupplierGroup.prototype, "suppliers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SupplierGroup.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SupplierGroup.prototype, "updatedAt", void 0);
exports.SupplierGroup = SupplierGroup = __decorate([
    (0, typeorm_1.Entity)('supplier_groups')
], SupplierGroup);
//# sourceMappingURL=supplier-group.entity.js.map