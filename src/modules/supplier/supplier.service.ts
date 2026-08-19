import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base/base.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SupplierService extends BaseService<Supplier> {
  constructor(
    @InjectRepository(Supplier)
    repo: Repository<Supplier>,
  ) {
    super(repo, ['name', 'taxCode']);
  }

  async createSupplier(dto: CreateSupplierDto, actorId: number) {
    const existed = await this.repository.findOne({ where: { taxCode: dto.taxCode } });
    if (existed) throw new ConflictException('tax-code-already-exists');

    const saved = await this.create({ ...dto, createdBy: actorId, updatedBy: actorId });
    return { message: 'Tạo nhà cung cấp thành công', result: saved };
  }
}