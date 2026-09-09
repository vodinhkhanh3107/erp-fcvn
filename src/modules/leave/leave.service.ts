import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { ListLeaveDto } from './dto/list-leave.dto';
import { ReviewLeaveDto } from './dto/review-leave.dto';
import { Leave, LeaveStatus } from '../../models/leave.entity';

@Injectable()
export class LeaveService {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(Leave)
    private readonly repository: Repository<Leave>,
  ) {
    this.logger.setContext('LeaveService');
  }

  async createLeaveRequest(userId: number, dto: CreateLeaveDto) {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('end-date-must-be-after-start-date');
    }

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (dto.startDate < tomorrow) {
      throw new BadRequestException('leave-must-be-requested-at-least-1-day-in-advance');
    }
    void today;
    // Alternative Flow tự bổ sung: chặn trùng lịch nghỉ đã duyệt cùng khoảng ngày
    const overlapping = await this.repository.findOne({
      where: {
        userId,
        status: LeaveStatus.APPROVED,
        startDate: LessThanOrEqual(dto.endDate),
        endDate: MoreThanOrEqual(dto.startDate),
      },
    });
    if (overlapping) throw new BadRequestException('overlapping-with-an-already-approved-leave');

    const entity = this.repository.create({ ...dto, userId, status: LeaveStatus.PENDING });
    const saved = await this.repository.save(entity);
    this.logger.log(`Nhân sự #${userId} đã gửi yêu cầu nghỉ phép #${saved.id}`);

    return { message: 'Gửi yêu cầu nghỉ phép thành công', result: saved };
  }

  async findAll(query: ListLeaveDto) {
    const { page, limit, userId, status } = query;

    const where: Record<string, any> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [items, total] = await this.repository.findAndCount({
      where,
      relations: { user: true },
      order: { startDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const leave = await this.repository.findOne({ where: { id }, relations: { user: true } });
    if (!leave) throw new NotFoundException('leave-not-found');
    return leave;
  }

  // user chỉ được xem hồ sơ nghỉ phép của CHÍNH MÌNH qua findOneForSelf (dùng ở /leaves/me/:id)
  async findOneForSelf(id: number, userId: number) {
    const leave = await this.findOne(id);
    if (leave.userId !== userId) {
      throw new ForbiddenException('access-denied');
    }
    return leave;
  }

  async review(id: number, dto: ReviewLeaveDto, approverId: number) {
    const leave = await this.findOne(id);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('leave-already-reviewed');
    }

    leave.status = dto.status;
    leave.approvedBy = approverId;
    const saved = await this.repository.save(leave);

    this.logger.log(
      `Yêu cầu nghỉ phép #${id} đã được ${approverId === leave.userId ? 'tự' : ''} duyệt: ${dto.status}`,
    );
    return { message: 'Duyệt yêu cầu nghỉ phép thành công', result: saved };
  }
}
