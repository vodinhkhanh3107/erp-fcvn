import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseService } from '../../common/base/base.service';
import { Supplier } from '../../models/supplier.entity';
import { AssignSuppliersDto } from './dto/assign-suppliers.dto';
import { CreateSupplierGroupDto } from './dto/create-supplier-group.dto';
import { UpdateSupplierGroupDto } from './dto/update-supplier-group.dto';
import { UpdateSupplierGroupStatusDto } from './dto/update-supplier-group-status.dto';
import { SupplierGroup, SupplierGroupStatus } from '../../models/supplier-group.entity';

@Injectable()
export class SupplierGroupService extends BaseService<SupplierGroup> {
  constructor(
    @InjectRepository(SupplierGroup)
    repo: Repository<SupplierGroup>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
  ) {
    super(repo, ['code', 'name']); 
  }

  async createGroup(dto: CreateSupplierGroupDto, actorId: number) {
    const existed = await this.repository.findOne({ where: { code: dto.code } });
    if (existed) throw new ConflictException('supplier-group-code-already-exists');

    const saved = await this.create({ ...dto, createdBy: actorId, updatedBy: actorId });
    return { message: 'Tạo nhóm NCC thành công', result: saved };
  }

  async updateGroup(id: number, dto: UpdateSupplierGroupDto, actorId: number) {
    const saved = await this.update(id, { ...dto, updatedBy: actorId });
    return { message: 'Cập nhật nhóm NCC thành công', result: saved };
  }

  async updateStatus(id: number, dto: UpdateSupplierGroupStatusDto, actorId: number) {
    const group = await this.findOne(id);

    if (group.status === dto.status) {
      throw new BadRequestException('status-not-changed');
    }

    const saved = await this.update(id, { status: dto.status, updatedBy: actorId });
    return { message: 'Cập nhật trạng thái thành công', result: saved };
  }

  async assignSuppliers(groupId: number, dto: AssignSuppliersDto, actorId: number) {
    if(!groupId) throw new BadRequestException('supplier-group is not exist');


    const group = await this.findOne(groupId); 
    if (group.status !== SupplierGroupStatus.ACTIVE) {
      throw new BadRequestException('cannot-assign-suppliers-to-inactive-group');
    }

    const suppliers = await this.supplierRepo.findBy({ id: In(dto.supplierIds) });
    if (suppliers.length !== dto.supplierIds.length) {
      throw new BadRequestException('one-or-more-supplier-ids-not-found');
    }

    await this.supplierRepo.update(dto.supplierIds, { groupId, updatedBy: actorId });

    return { message: `Đã gán ${suppliers.length} nhà cung cấp vào nhóm "${group.name}"` };
  }
}