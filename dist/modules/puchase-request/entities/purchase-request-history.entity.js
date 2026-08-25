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
exports.PurchaseRequestHistory = void 0;
const typeorm_1 = require("typeorm");
const purchase_request_entity_1 = require("./purchase-request.entity");
const user_entity_1 = require("../../user/entities/user.entity");
let PurchaseRequestHistory = class PurchaseRequestHistory {
};
exports.PurchaseRequestHistory = PurchaseRequestHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PurchaseRequestHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_request_id' }),
    __metadata("design:type", Number)
], PurchaseRequestHistory.prototype, "purchaseRequestId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_request_entity_1.PurchaseRequest, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_request_id' }),
    __metadata("design:type", purchase_request_entity_1.PurchaseRequest)
], PurchaseRequestHistory.prototype, "purchaseRequest", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_status', type: 'enum', enum: purchase_request_entity_1.PurchaseRequestStatus, nullable: true }),
    __metadata("design:type", String)
], PurchaseRequestHistory.prototype, "fromStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_status', type: 'enum', enum: purchase_request_entity_1.PurchaseRequestStatus }),
    __metadata("design:type", String)
], PurchaseRequestHistory.prototype, "toStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id' }),
    __metadata("design:type", Number)
], PurchaseRequestHistory.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'actor_id' }),
    __metadata("design:type", user_entity_1.User)
], PurchaseRequestHistory.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], PurchaseRequestHistory.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PurchaseRequestHistory.prototype, "createdAt", void 0);
exports.PurchaseRequestHistory = PurchaseRequestHistory = __decorate([
    (0, typeorm_1.Entity)('purchase_request_histories')
], PurchaseRequestHistory);
//# sourceMappingURL=purchase-request-history.entity.js.map