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
exports.PurchaseRequest = exports.PurchaseRequestStatus = void 0;
const typeorm_1 = require("typeorm");
const department_entity_1 = require("../../department/entities/department.entity");
const user_entity_1 = require("../../user/entities/user.entity");
const purchase_request_item_entity_1 = require("./purchase-request-item.entity");
const purchase_request_quotation_1 = require("./purchase-request-quotation");
var PurchaseRequestStatus;
(function (PurchaseRequestStatus) {
    PurchaseRequestStatus["DRAFT"] = "Draft";
    PurchaseRequestStatus["PENDING"] = "Pending";
    PurchaseRequestStatus["APPROVED"] = "Approved";
    PurchaseRequestStatus["REJECTED"] = "Rejected";
})(PurchaseRequestStatus || (exports.PurchaseRequestStatus = PurchaseRequestStatus = {}));
let PurchaseRequest = class PurchaseRequest {
};
exports.PurchaseRequest = PurchaseRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PurchaseRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'department_id', nullable: true }),
    __metadata("design:type", Number)
], PurchaseRequest.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", department_entity_1.Department)
], PurchaseRequest.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requester_id' }),
    __metadata("design:type", Number)
], PurchaseRequest.prototype, "requesterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'requester_id' }),
    __metadata("design:type", user_entity_1.User)
], PurchaseRequest.prototype, "requester", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purpose_of_use', length: 500 }),
    __metadata("design:type", String)
], PurchaseRequest.prototype, "purposeOfUse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PurchaseRequestStatus, default: PurchaseRequestStatus.PENDING }),
    __metadata("design:type", String)
], PurchaseRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_by', nullable: true }),
    __metadata("design:type", Number)
], PurchaseRequest.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_request_item_entity_1.PurchaseRequestItem, (item) => item.purchaseRequest, { cascade: true }),
    __metadata("design:type", Array)
], PurchaseRequest.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_request_quotation_1.PurchaseRequestQuotation, (q) => q.purchaseRequest, { cascade: true }),
    __metadata("design:type", Array)
], PurchaseRequest.prototype, "quotations", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PurchaseRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PurchaseRequest.prototype, "updatedAt", void 0);
exports.PurchaseRequest = PurchaseRequest = __decorate([
    (0, typeorm_1.Entity)('purchase_requests')
], PurchaseRequest);
//# sourceMappingURL=purchase-request.entity.js.map