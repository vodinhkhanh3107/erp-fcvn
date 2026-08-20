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
exports.TaskService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_logger_service_1 = require("../../common/logger/app-logger.service");
const task_entity_1 = require("./entities/task.entity");
let TaskService = class TaskService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new app_logger_service_1.AppLogger();
        this.logger.setContext('TaskService');
    }
    async create(dto, actorId) {
        const today = new Date().toISOString().slice(0, 10);
        if (dto.deadline < today) {
            throw new common_1.BadRequestException('deadline-must-not-be-in-the-past');
        }
        const entity = this.repository.create({ ...dto, createdBy: actorId, updatedBy: actorId });
        const saved = await this.repository.save(entity);
        this.logger.log(`Đã tạo công việc #${saved.id}: "${saved.taskName}"`);
        return { message: 'Tạo công việc thành công', result: saved };
    }
    async findAll(query) {
        const { page, limit, assignedTo, status } = query;
        const where = {};
        if (assignedTo)
            where.assignedTo = assignedTo;
        if (status)
            where.status = status;
        const [items, total] = await this.repository.findAndCount({
            where,
            relations: { assignee: true },
            order: { deadline: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async findOne(id) {
        const task = await this.repository.findOne({ where: { id }, relations: { assignee: true } });
        if (!task)
            throw new common_1.NotFoundException('task-not-found');
        return task;
    }
    async updateStatus(id, dto, actorId) {
        const task = await this.findOne(id);
        task.status = dto.status;
        task.updatedBy = actorId;
        const saved = await this.repository.save(task);
        return { message: 'Cập nhật trạng thái công việc thành công', result: saved };
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TaskService);
//# sourceMappingURL=task.service.js.map