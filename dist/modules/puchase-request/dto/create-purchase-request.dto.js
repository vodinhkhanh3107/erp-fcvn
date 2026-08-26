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
exports.CreatePurchaseRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const create_purchase_item_dto_1 = require("./create-purchase-item.dto");
const class_transformer_1 = require("class-transformer");
const create_purchase_quotation_dto_1 = require("./create-purchase-quotation.dto");
class CreatePurchaseRequestDto {
}
exports.CreatePurchaseRequestDto = CreatePurchaseRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'a1b2c3d4-e5f6-...', description: 'Idempotency key do client tự sinh' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreatePurchaseRequestDto.prototype, "requestKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreatePurchaseRequestDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Mua laptop phục vụ nhân sự mới onboard' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePurchaseRequestDto.prototype, "purposeOfUse", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [create_purchase_item_dto_1.CreatePrItemDto] }),
    (0, class_validator_1.IsNotEmpty)({ message: 'must have least 1 item ' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_purchase_item_dto_1.CreatePrItemDto),
    __metadata("design:type", Array)
], CreatePurchaseRequestDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [create_purchase_quotation_dto_1.CreatePrQuotationDto] }),
    (0, class_validator_1.IsNotEmpty)({ message: 'must have least 1 quotation ' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_purchase_quotation_dto_1.CreatePrQuotationDto),
    __metadata("design:type", Array)
], CreatePurchaseRequestDto.prototype, "quotations", void 0);
//# sourceMappingURL=create-purchase-request.dto.js.map