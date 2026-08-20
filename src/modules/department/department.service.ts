import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base/base.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentService extends BaseService<Department> {
  constructor(
    @InjectRepository(Department)
    repo: Repository<Department>,
  ) {
    super(repo, ['name']);
  }

  async createDepartment(dto: CreateDepartmentDto, actorId: number) {
    const saved = await this.create({ ...dto, createdBy: actorId, updatedBy: actorId });
    return { message: 'Tạo phòng ban thành công', result: saved };
  }

  async updateDepartment(id: number, dto: UpdateDepartmentDto, actorId: number) {
    const saved = await this.update(id, { ...dto, updatedBy: actorId });
    return { message: 'Cập nhật phòng ban thành công', result: saved };
  }

  async updateStatus(id: number, dto: UpdateDepartmentStatusDto, actorId: number) {
    const department = await this.findOne(id);
    if (department.status === dto.status) {
      throw new BadRequestException('status-not-changed');
    }
    const saved = await this.update(id, { status: dto.status, updatedBy: actorId });
    return { message: 'Cập nhật trạng thái thành công', result: saved };
  }

  async list(query: PaginationDto) {
    return this.findAll(query);
  }
}