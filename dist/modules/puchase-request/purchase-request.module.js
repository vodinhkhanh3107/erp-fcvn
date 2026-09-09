"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseRequestModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const purchase_order_module_1 = require("../purchase-order/purchase-order.module");
const purchase_request_entity_1 = require("../../models/purchase-request.entity");
const purchase_request_item_entity_1 = require("../../models/purchase-request-item.entity");
const purchase_request_quotation_entity_1 = require("../../models/purchase-request-quotation.entity");
const purchase_request_controller_1 = require("./purchase-request.controller");
const purchase_request_service_1 = require("./purchase-request.service");
const purchase_request_history_entity_1 = require("../../models/purchase-request-history.entity");
const department_entity_1 = require("../../models/department.entity");
let PurchaseRequestModule = class PurchaseRequestModule {
};
exports.PurchaseRequestModule = PurchaseRequestModule;
exports.PurchaseRequestModule = PurchaseRequestModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                purchase_request_entity_1.PurchaseRequest,
                purchase_request_history_entity_1.PurchaseRequestHistory,
                department_entity_1.Department,
                purchase_request_item_entity_1.PurchaseRequestItem,
                purchase_request_quotation_entity_1.PurchaseRequestQuotation,
            ]),
            purchase_order_module_1.PurchaseOrderModule,
        ],
        controllers: [purchase_request_controller_1.PurchaseRequestController],
        providers: [purchase_request_service_1.PurchaseRequestService],
    })
], PurchaseRequestModule);
//# sourceMappingURL=purchase-request.module.js.map