"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierGroupModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const supplier_entity_1 = require("../supplier/entities/supplier.entity");
const supplier_group_entity_1 = require("./entities/supplier-group.entity");
const supplier_group_controller_1 = require("./supplier-group.controller");
const supplier_group_service_1 = require("./supplier-group.service");
let SupplierGroupModule = class SupplierGroupModule {
};
exports.SupplierGroupModule = SupplierGroupModule;
exports.SupplierGroupModule = SupplierGroupModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([supplier_group_entity_1.SupplierGroup, supplier_entity_1.Supplier])],
        controllers: [supplier_group_controller_1.SupplierGroupController],
        providers: [supplier_group_service_1.SupplierGroupService],
        exports: [supplier_group_service_1.SupplierGroupService],
    })
], SupplierGroupModule);
//# sourceMappingURL=supplier-group.module.js.map