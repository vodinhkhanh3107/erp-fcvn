"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XxxModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const xxx_entity_1 = require("./entities/xxx.entity");
const xxx_controller_1 = require("./xxx.controller");
const xxx_service_1 = require("./xxx.service");
let XxxModule = class XxxModule {
};
exports.XxxModule = XxxModule;
exports.XxxModule = XxxModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([xxx_entity_1.XxxEntity])],
        controllers: [xxx_controller_1.XxxController],
        providers: [xxx_service_1.XxxService],
    })
], XxxModule);
//# sourceMappingURL=xxx.module.js.map