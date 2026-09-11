import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
import { BaseService } from '../../common/base/base.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { Supplier } from '../../models/supplier.entity';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class SupplierService extends BaseService<Supplier> {
  constructor(
    @InjectRepository(Supplier)
    repo: Repository<Supplier>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super(repo, ['name', 'taxCode']);
  }

  private async runInTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // Log lỗi gốc trước khi ném lỗi chung chung ra ngoài — nếu không, lỗi thật sự
      // (vd. sai kiểu dữ liệu, vi phạm FK, bug logic bên trong work()...) sẽ bị "nuốt mất",
      // rất khó debug về sau (giống tình huống vừa gặp: lỗi thật là do gọi save() sai cách
      // trên UpdateResult, nhưng thông báo ra ngoài chỉ nói chung chung "Transaction fail").
      console.error('[SupplierService] Transaction failed:', error);
      throw new InternalServerErrorException('Transaction fail, rolled back');
    } finally {
      await queryRunner.release();
    }
  }

  async createSupplier(dto: CreateSupplierDto, actorId: number) {
    const existed = await this.repository.findOne({ where: { taxCode: dto.taxCode } });
    if (existed) throw new ConflictException('tax-code-already-exists');

    const existedEmail = await this.repository.findOne({
      where: { contactEmail: dto.contactEmail },
    });
    if (existedEmail) throw new ConflictException('email-already-exists');

    const saved = await this.runInTransaction(async (manager) => {
      const newSupplier = manager.create(Supplier, {
        ...dto,
        createdBy: actorId,
        updatedBy: actorId,
      });
      return manager.save(newSupplier);
    });

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

    // FIX: manager.update() trả về UpdateResult (metadata số dòng bị ảnh hưởng), KHÔNG PHẢI entity.
    // Không thể gọi manager.save() trên UpdateResult — đây chính là nguyên nhân gây lỗi
    // "Transaction fail, rolled back" trước đó. Cách đúng: chạy update() để ghi thay đổi vào DB,
    // sau đó query lại entity mới nhất bằng findOneBy() để trả về cho client.
    const saved = await this.runInTransaction(async (manager) => {
      await manager.update(Supplier, id, dto);
      return manager.findOneBy(Supplier, { id });
    });

    return { message: 'Cập nhật nhà cung cấp thành công', result: saved };
  }
}
