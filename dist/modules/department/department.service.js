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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const base_service_1 = require("../../common/base/base.service");
const department_entity_1 = require("../../models/department.entity");
let DepartmentService = class DepartmentService extends base_service_1.BaseService {
    constructor(repo) {
        super(repo, ['name']);
    }
    async createDepartment(dto, actorId) {
        const saved = await this.create({ ...dto, createdBy: actorId, updatedBy: actorId });
        return { message: 'Tạo phòng ban thành công', result: saved };
    }
    async updateDepartment(id, dto, actorId) {
        const saved = await this.update(id, { ...dto, updatedBy: actorId });
        return { message: 'Cập nhật phòng ban thành công', result: saved };
    }
    async updateStatus(id, dto, actorId) {
        const department = await this.findOne(id);
        if (department.status === dto.status) {
            throw new common_1.BadRequestException('status-not-changed');
        }
        const saved = await this.update(id, { status: dto.status, updatedBy: actorId });
        return { message: 'Cập nhật trạng thái thành công', result: saved };
    }
    async list(query) {
        return this.findAll(query);
    }
};
exports.DepartmentService = DepartmentService;
exports.DepartmentService = DepartmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DepartmentService);
//# sourceMappingURL=department.service.js.map