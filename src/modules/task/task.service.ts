import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTaskDto } from './dto/list-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TaskService {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
  ) {
    this.logger.setContext('TaskService');
  }

  async create(dto: CreateTaskDto, actorId: number) {
    const today = new Date().toISOString().slice(0, 10);
    if (dto.deadline < today) {
      throw new BadRequestException('deadline-must-not-be-in-the-past');
    }

    const entity = this.repository.create({ ...dto, createdBy: actorId, updatedBy: actorId });
    const saved = await this.repository.save(entity);
    this.logger.log(`Đã tạo công việc #${saved.id}: "${saved.taskName}"`);

    return { message: 'Tạo công việc thành công', result: saved };
  }

  async findAll(query: ListTaskDto) {
    const { page, limit, assignedTo, status } = query;

    const where: Record<string, any> = {};
    if (assignedTo) where.assignedTo = assignedTo;
    if (status) where.status = status;

    const [items, total] = await this.repository.findAndCount({
      where,
      relations: { assignee: true },
      order: { deadline: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const task = await this.repository.findOne({ where: { id }, relations: { assignee: true } });
    if (!task) throw new NotFoundException('task-not-found');
    return task;
  }

  async updateStatus(id: number, dto: UpdateTaskStatusDto, actorId: number) {
    const task = await this.findOne(id);
    task.status = dto.status;
    task.updatedBy = actorId;
    const saved = await this.repository.save(task);

    return { message: 'Cập nhật trạng thái công việc thành công', result: saved };
  }
}