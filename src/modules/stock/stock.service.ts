import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Stock } from 'src/models/stock.entity';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/base/base.service';

@Injectable()
export class StockService extends BaseService<Stock> {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {
    super(stockRepository, ['itemName']);
  }

  // async findAll(query: ListStockDto) {
  //   const { page, limit, keyword } = query;

  //   const [items, total] = await this.stockRepository.findAndCount({
  //     where: keyword ? { itemName: ILike(`%${keyword}%`) } : {},
  //     order: { itemName: 'ASC' },
  //     skip: (page - 1) * limit,
  //     take: limit,
  //   });

  //   return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  // }
}
