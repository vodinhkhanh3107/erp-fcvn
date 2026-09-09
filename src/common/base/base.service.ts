import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';

export class BaseService<T extends { id: number }> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly searchableFields: (keyof T)[] = [],
  ) {}

  async findAll(query: PaginationDto) {
    const { page, limit, keyword } = query;

    const where: FindOptionsWhere<T>[] =
      keyword && this.searchableFields.length > 0
        ? this.searchableFields.map(
            (field) => ({ [field]: ILike(`%${keyword}%`) }) as FindOptionsWhere<T>,
          )
        : [];

    const order = { id: 'DESC' } as FindOptionsOrder<T>;

    const [items, total] = await this.repository.findAndCount({
      where: where.length ? where : undefined,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } as FindOptionsWhere<T> });
    if (!entity) {
      throw new NotFoundException('item-not-found');
    }
    return entity;
  }

  async create(dto: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(dto);
    return this.repository.save(entity);
  }

  async update(id: number, dto: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repository.save(entity);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // đảm bảo tồn tại trước khi xóa, trả 404 đúng nghĩa nếu không có
    await this.repository.softDelete(id);
  }
}
