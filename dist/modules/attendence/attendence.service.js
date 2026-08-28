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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_logger_service_1 = require("../../common/logger/app-logger.service");
const attendence_entity_1 = require("../../models/attendence.entity");
let AttendanceService = class AttendanceService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new app_logger_service_1.AppLogger();
        this.logger.setContext('AttendanceService');
    }
    calculateTotalHours(checkIn, checkOut) {
        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        const inMinutes = inH * 60 + inM;
        const outMinutes = outH * 60 + outM;
        if (outMinutes <= inMinutes) {
            throw new common_1.BadRequestException('check-out-must-be-after-check-in');
        }
        return Math.round(((outMinutes - inMinutes) / 60) * 100) / 100;
    }
    async create(dto, actorId) {
        const existed = await this.repository.findOne({
            where: { userId: dto.userId, date: dto.date },
        });
        if (existed)
            throw new common_1.ConflictException('attendance-already-exists-for-this-date');
        const totalHours = this.calculateTotalHours(dto.checkIn, dto.checkOut);
        const entity = this.repository.create({
            ...dto,
            totalHours,
            createdBy: actorId,
            updatedBy: actorId,
        });
        const saved = await this.repository.save(entity);
        this.logger.log(`Đã ghi nhận chấm công #${saved.id} cho nhân sự #${dto.userId} ngày ${dto.date}`);
        return { message: 'Ghi nhận chấm công thành công', result: saved };
    }
    async findAll(query) {
        const { page, limit, userId, fromDate, toDate } = query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (fromDate && toDate)
            where.date = (0, typeorm_2.Between)(fromDate, toDate);
        const [items, total] = await this.repository.findAndCount({
            where,
            relations: { user: true },
            order: { date: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async findOne(id) {
        const attendance = await this.repository.findOne({ where: { id }, relations: { user: true } });
        if (!attendance)
            throw new common_1.NotFoundException('attendance-not-found');
        return attendance;
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendence_entity_1.Attendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendence.service.js.map