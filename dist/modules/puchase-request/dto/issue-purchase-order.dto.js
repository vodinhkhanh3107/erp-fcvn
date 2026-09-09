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
exports.IssuePoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class IssuePoDto {
}
exports.IssuePoDto = IssuePoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'ID nhà cung cấp được chọn (phải nằm trong danh sách đã báo giá)',
    }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], IssuePoDto.prototype, "selectedSupplierId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'NET30',
        description: 'Điều khoản thanh toán cho PO — bỏ trống nếu chưa xác định',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssuePoDto.prototype, "paymentTerm", void 0);
//# sourceMappingURL=issue-purchase-order.dto.js.map