import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base/base.service';
import { AppLogger } from '../../common/logger/app-logger.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { User } from '../../models/user.entity';
// import { Department } from '../department/entities/department.entity';

@Injectable()
export class UserService extends BaseService<User> {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(User)
    repo: Repository<User>

    // @InjectRepository(Department)
    // repoDepartment: Repository<Department>,

  ) {
    super(repo, ['fullName', 'email']);
    // super(repoDepartment, ['name']);
    this.logger.setContext('UserService');
  }

  async createUser(dto: CreateUserDto) {
    const existed = await this.repository.findOne({ where: { email: dto.email } });
    if (existed) throw new ConflictException('email-already-exists');

    const saved = await this.create(dto); 
    this.logger.log(`Đã tạo nhân sự #${saved.id} (${saved.email})`);

    const { password, ...result } = saved;
    return { message: 'Tạo nhân sự thành công', result };
  }

  async list(query: PaginationDto) {
    return this.findAll(query); 
  }

  async updateStatus(id: number, dto: UpdateUserStatusDto) {
    const employee = await this.findOne(id); 

    if (employee.status === dto.status) {
      throw new BadRequestException('status-not-changed');
    }

    const saved = await this.update(id, { status: dto.status }); 
    this.logger.log(`Đã đổi trạng thái nhân sự #${id} → ${dto.status}`);

    const { password, ...result } = saved;
    return { message: 'Cập nhật trạng thái thành công', result };
  }
}
