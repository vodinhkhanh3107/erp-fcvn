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
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_logger_service_1 = require("../../common/logger/app-logger.service");
const leave_entity_1 = require("../../models/leave.entity");
let LeaveService = class LeaveService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new app_logger_service_1.AppLogger();
        this.logger.setContext('LeaveService');
    }
    async createLeaveRequest(userId, dto) {
        if (dto.endDate < dto.startDate) {
            throw new common_1.BadRequestException('end-date-must-be-after-start-date');
        }
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        if (dto.startDate < tomorrow) {
            throw new common_1.BadRequestException('leave-must-be-requested-at-least-1-day-in-advance');
        }
        void today;
        const overlapping = await this.repository.findOne({
            where: {
                userId,
                status: leave_entity_1.LeaveStatus.APPROVED,
                startDate: (0, typeorm_2.LessThanOrEqual)(dto.endDate),
                endDate: (0, typeorm_2.MoreThanOrEqual)(dto.startDate),
            },
        });
        if (overlapping)
            throw new common_1.BadRequestException('overlapping-with-an-already-approved-leave');
        const entity = this.repository.create({ ...dto, userId, status: leave_entity_1.LeaveStatus.PENDING });
        const saved = await this.repository.save(entity);
        this.logger.log(`Nhân sự #${userId} đã gửi yêu cầu nghỉ phép #${saved.id}`);
        return { message: 'Gửi yêu cầu nghỉ phép thành công', result: saved };
    }
    async findAll(query) {
        const { page, limit, userId, status } = query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (status)
            where.status = status;
        const [items, total] = await this.repository.findAndCount({
            where,
            relations: { user: true },
            order: { startDate: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async findOne(id) {
        const leave = await this.repository.findOne({ where: { id }, relations: { user: true } });
        if (!leave)
            throw new common_1.NotFoundException('leave-not-found');
        return leave;
    }
    async findOneForSelf(id, userId) {
        const leave = await this.findOne(id);
        if (leave.userId !== userId) {
            throw new common_1.ForbiddenException('access-denied');
        }
        return leave;
    }
    async review(id, dto, approverId) {
        const leave = await this.findOne(id);
        if (leave.status !== leave_entity_1.LeaveStatus.PENDING) {
            throw new common_1.BadRequestException('leave-already-reviewed');
        }
        leave.status = dto.status;
        leave.approvedBy = approverId;
        const saved = await this.repository.save(leave);
        this.logger.log(`Yêu cầu nghỉ phép #${id} đã được ${approverId === leave.userId ? 'tự' : ''} duyệt: ${dto.status}`);
        return { message: 'Duyệt yêu cầu nghỉ phép thành công', result: saved };
    }
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(leave_entity_1.Leave)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LeaveService);
//# sourceMappingURL=leave.service.js.map