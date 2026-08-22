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
exports.PurchaseRequestQuotation = void 0;
const typeorm_1 = require("typeorm");
const supplier_entity_1 = require("../../supplier/entities/supplier.entity");
const purchase_request_entity_1 = require("./purchase-request.entity");
let PurchaseRequestQuotation = class PurchaseRequestQuotation {
};
exports.PurchaseRequestQuotation = PurchaseRequestQuotation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PurchaseRequestQuotation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_request_id' }),
    __metadata("design:type", Number)
], PurchaseRequestQuotation.prototype, "purchaseRequestId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_request_entity_1.PurchaseRequest, (pr) => pr.quotations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_request_id' }),
    __metadata("design:type", purchase_request_entity_1.PurchaseRequest)
], PurchaseRequestQuotation.prototype, "purchaseRequest", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supplier_id' }),
    __metadata("design:type", Number)
], PurchaseRequestQuotation.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => supplier_entity_1.Supplier, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'supplier_id' }),
    __metadata("design:type", supplier_entity_1.Supplier)
], PurchaseRequestQuotation.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quoted_amount', type: 'decimal', precision: 18, scale: 2 }),
    __metadata("design:type", Number)
], PurchaseRequestQuotation.prototype, "quotedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quotation_file_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], PurchaseRequestQuotation.prototype, "quotationFileUrl", void 0);
exports.PurchaseRequestQuotation = PurchaseRequestQuotation = __decorate([
    (0, typeorm_1.Entity)('purchase_request_quotations')
], PurchaseRequestQuotation);
//# sourceMappingURL=purchase-request-quotation.js.map