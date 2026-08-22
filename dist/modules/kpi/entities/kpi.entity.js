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
exports.Kpi = exports.KpiStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/entities/user.entity");
var KpiStatus;
(function (KpiStatus) {
    KpiStatus["ON_TRACK"] = "On-track";
    KpiStatus["OFF_TRACK"] = "Off-track";
})(KpiStatus || (exports.KpiStatus = KpiStatus = {}));
let Kpi = class Kpi {
};
exports.Kpi = Kpi;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Kpi.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], Kpi.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Kpi.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Kpi.prototype, "period", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_value', type: 'decimal', precision: 18, scale: 2 }),
    __metadata("design:type", Number)
], Kpi.prototype, "targetValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actual_value', type: 'decimal', precision: 18, scale: 2 }),
    __metadata("design:type", Number)
], Kpi.prototype, "actualValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kpi_status', type: 'enum', enum: KpiStatus }),
    __metadata("design:type", String)
], Kpi.prototype, "kpiStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", Number)
], Kpi.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', nullable: true }),
    __metadata("design:type", Number)
], Kpi.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Kpi.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Kpi.prototype, "updatedAt", void 0);
exports.Kpi = Kpi = __decorate([
    (0, typeorm_1.Entity)('kpis')
], Kpi);
//# sourceMappingURL=kpi.entity.js.map