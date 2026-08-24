"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePurchaseRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_purchase_request_dto_1 = require("./create-purchase-request.dto");
class UpdatePurchaseRequestDto extends (0, swagger_1.PartialType)(create_purchase_request_dto_1.CreatePurchaseRequestDto) {
}
exports.UpdatePurchaseRequestDto = UpdatePurchaseRequestDto;
//# sourceMappingURL=update-purchase-request.dto.js.map