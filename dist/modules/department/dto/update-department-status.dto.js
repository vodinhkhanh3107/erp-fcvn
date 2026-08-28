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
exports.UpdateDepartmentStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const department_entity_1 = require("../../../models/department.entity");
const class_validator_1 = require("class-validator");
class UpdateDepartmentStatusDto {
}
exports.UpdateDepartmentStatusDto = UpdateDepartmentStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: department_entity_1.DepartmentStatus }),
    (0, class_validator_1.IsEnum)(department_entity_1.DepartmentStatus),
    __metadata("design:type", String)
], UpdateDepartmentStatusDto.prototype, "status", void 0);
//# sourceMappingURL=update-department-status.dto.js.map