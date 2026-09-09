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
exports.KpiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_logger_service_1 = require("../../common/logger/app-logger.service");
const kpi_entity_1 = require("../../models/kpi.entity");
let KpiService = class KpiService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new app_logger_service_1.AppLogger();
        this.logger.setContext('KpiService');
    }
    calculateStatus(targetValue, actualValue) {
        return actualValue >= targetValue ? kpi_entity_1.KpiStatus.ON_TRACK : kpi_entity_1.KpiStatus.OFF_TRACK;
    }
    async create(dto, actorId) {
        const kpiStatus = this.calculateStatus(dto.targetValue, dto.actualValue);
        const entity = this.repository.create({
            ...dto,
            kpiStatus,
            createdBy: actorId,
            updatedBy: actorId,
        });
        const saved = await this.repository.save(entity);
        this.logger.log(`Đã tạo KPI #${saved.id} cho nhân sự #${dto.userId}, kỳ ${dto.period} → ${kpiStatus}`);
        return { message: 'Tạo KPI thành công', result: saved };
    }
    async findAll(query) {
        const { page, limit, userId, period } = query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (period)
            where.period = period;
        const [items, total] = await this.repository.findAndCount({
            where,
            relations: { user: true },
            order: { period: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async findOne(id) {
        const kpi = await this.repository.findOne({ where: { id }, relations: { user: true } });
        if (!kpi)
            throw new common_1.NotFoundException('kpi-not-found');
        return kpi;
    }
    async updateActual(id, dto, actorId) {
        const kpi = await this.findOne(id);
        kpi.actualValue = dto.actualValue;
        kpi.kpiStatus = this.calculateStatus(Number(kpi.targetValue), dto.actualValue);
        kpi.updatedBy = actorId;
        const saved = await this.repository.save(kpi);
        return { message: 'Cập nhật KPI thành công', result: saved };
    }
};
exports.KpiService = KpiService;
exports.KpiService = KpiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kpi_entity_1.Kpi)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], KpiService);
//# sourceMappingURL=kpi.service.js.map