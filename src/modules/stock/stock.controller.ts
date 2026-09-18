import { Controller, Get, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import { ListStockDto } from './dto/list-stock.dto';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll(@Query() dto: ListStockDto) {
    return this.stockService.findAll(dto);
  }
}
