import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BaseService } from '../../common/base/base.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { Supplier } from '../../models/supplier.entity';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

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

    const existedEmail = await this.repository.findOne({
      where: { contactEmail: dto.contactEmail },
    });
    if (existedEmail) throw new ConflictException('email-name-already-exists');

    const saved = await this.create({ ...dto, createdBy: actorId, updatedBy: actorId });
    return { message: 'Tạo nhà cung cấp thành công', result: saved };
  }

  async updateSupplier(id: number, dto: UpdateSupplierDto) {
    const existed = await this.repository.findOneBy({ id });
    if (!existed) throw new NotFoundException('not-found-supplier');

    if (dto.taxCode) {
      const existedTaxCode = await this.repository.findOne({
        where: { id: Not(id), taxCode: dto.taxCode },
      });
      if (existedTaxCode) throw new ConflictException('tax-code-already-exists');
    }

    if (dto.contactEmail) {
      const existedEmail = await this.repository.findOne({
        where: { id: Not(id), contactEmail: dto.contactEmail },
      });
      if (existedEmail) throw new ConflictException('email-already-exists');
    }

    const saved = await this.update(id, dto);
    return { message: 'Cập nhật nhà cung cấp thành công', result: saved };
  }
}
