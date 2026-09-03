import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { ListAttendanceDto } from './dto/list-attendance.dto';
import { Attendance } from '../../models/attendence.entity';
import { DataSource } from 'typeorm/browser';

@Injectable()
export class AttendanceService {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(Attendance)
    private readonly repository: Repository<Attendance>,

    // @InjectDataSource()
    // private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('AttendanceService');
  }

  // private async runInTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
  //   const queryRunner = this.dataSource.createQueryRunner();

  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const result = await work(queryRunner.manager);
  //     await queryRunner.commitTransaction();
  //     return result;
  //   } catch (err) {
  //     await queryRunner.rollbackTransaction();
  //     throw new InternalServerErrorException('Transaction failed, rolled back');
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  private calculateTotalHours(checkIn: string, checkOut: string): number {
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);

    const inMinutes = inH * 60 + inM;
    const outMinutes = outH * 60 + outM;

    if (outMinutes <= inMinutes) {
      throw new BadRequestException('check-out-must-be-after-check-in');
    }

    return Math.round(((outMinutes - inMinutes) / 60) * 100) / 100;
  }

  async create(dto: CreateAttendanceDto, actorId: number) {
    const existed = await this.repository.findOne({
      where: { userId: dto.userId, date: dto.date },
    });
    if (existed) throw new ConflictException('attendance-already-exists-for-this-date');

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

  async findAll(query: ListAttendanceDto) {
    const { page, limit, userId, fromDate, toDate } = query;

    const where: Record<string, any> = {};
    if (userId) where.userId = userId;
    if (fromDate && toDate) where.date = Between(fromDate, toDate);

    const [items, total] = await this.repository.findAndCount({
      where,
      relations: { user: true },
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const attendance = await this.repository.findOne({ where: { id }, relations: { user: true } });
    if (!attendance) throw new NotFoundException('attendance-not-found');
    return attendance;
  }
}