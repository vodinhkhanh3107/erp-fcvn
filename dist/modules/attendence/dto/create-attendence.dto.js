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
exports.CreateAttendanceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateAttendanceDto {
}
exports.CreateAttendanceDto = CreateAttendanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID nhân sự chấm công' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAttendanceDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-20' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAttendanceDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '08:00', description: 'Giờ vào (HH:mm)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsMilitaryTime)(),
    __metadata("design:type", String)
], CreateAttendanceDto.prototype, "checkIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '17:30', description: 'Giờ ra (HH:mm)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsMilitaryTime)(),
    __metadata("design:type", String)
], CreateAttendanceDto.prototype, "checkOut", void 0);
//# sourceMappingURL=create-attendence.dto.js.map