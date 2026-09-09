import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListPurchaseOrderDto } from './dto/list-purchase-order.dto';
import { PurchaseOrderService } from './purchase-order.service';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/common/constants/permission.constants';

@ApiTags('Purchase Order')
@ApiBearerAuth('access-token')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PURCHASE_ORDER_READ)
  findAll(@Query() query: ListPurchaseOrderDto) {
    return this.purchaseOrderService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PURCHASE_ORDER_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrderService.findOne(id);
  }
}
