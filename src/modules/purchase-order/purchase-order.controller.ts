import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListPurchaseOrderDto } from './dto/list-purchase-order.dto';
import { PurchaseOrderService } from './purchase-order.service';

@ApiTags('Purchase Order')
@ApiBearerAuth('access-token')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN, ROLES.MANAGER)
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Get()
  findAll(@Query() query: ListPurchaseOrderDto) {
    return this.purchaseOrderService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrderService.findOne(id);
  }
}
