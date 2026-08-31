import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Permission } from '../../models/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly repository: Repository<Permission>,
  ) {}

  async findAll() {
    return this.repository.find({ order: { code: 'ASC' } });
  }

  async create(dto: CreatePermissionDto) {
    const existed = await this.repository.findOne({ where: { code: dto.code } });
    if (!existed){
      const saved = await this.repository.save(this.repository.create(dto));
      return { message: 'Tạo permission thành công', result: saved };
    } 
    throw new ConflictException('permission-code-already-exists');

  }
}