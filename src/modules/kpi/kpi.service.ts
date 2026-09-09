import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { ListKpiDto } from './dto/list-kpi.dto';
import { UpdateKpiActualDto } from './dto/update-kpi-actual-dto';
import { Kpi, KpiStatus } from '../../models/kpi.entity';

@Injectable()
export class KpiService {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(Kpi)
    private readonly repository: Repository<Kpi>,
  ) {
    this.logger.setContext('KpiService');
  }

  private calculateStatus(targetValue: number, actualValue: number): KpiStatus {
    return actualValue >= targetValue ? KpiStatus.ON_TRACK : KpiStatus.OFF_TRACK;
  }

  async create(dto: CreateKpiDto, actorId: number) {
    const kpiStatus = this.calculateStatus(dto.targetValue, dto.actualValue);

    const entity = this.repository.create({
      ...dto,
      kpiStatus,
      createdBy: actorId,
      updatedBy: actorId,
    });
    const saved = await this.repository.save(entity);
    this.logger.log(
      `Đã tạo KPI #${saved.id} cho nhân sự #${dto.userId}, kỳ ${dto.period} → ${kpiStatus}`,
    );

    return { message: 'Tạo KPI thành công', result: saved };
  }

  async findAll(query: ListKpiDto) {
    const { page, limit, userId, period } = query;

    const where: Record<string, any> = {};
    if (userId) where.userId = userId;
    if (period) where.period = period;

    const [items, total] = await this.repository.findAndCount({
      where,
      relations: { user: true },
      order: { period: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const kpi = await this.repository.findOne({ where: { id }, relations: { user: true } });
    if (!kpi) throw new NotFoundException('kpi-not-found');
    return kpi;
  }

  async updateActual(id: number, dto: UpdateKpiActualDto, actorId: number) {
    const kpi = await this.findOne(id);

    kpi.actualValue = dto.actualValue;
    kpi.kpiStatus = this.calculateStatus(Number(kpi.targetValue), dto.actualValue);
    kpi.updatedBy = actorId;

    const saved = await this.repository.save(kpi);
    return { message: 'Cập nhật KPI thành công', result: saved };
  }
}
