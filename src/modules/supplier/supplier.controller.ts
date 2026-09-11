import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierService } from './supplier.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/common/constants/permission.constants';

@ApiTags('Supplier')
@ApiBearerAuth('access-token')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @RequirePermission(PERMISSIONS.SUPPLIER_CREATE)
  create(@Body() dto: CreateSupplierDto, @CurrentUser() user: { userId: number }) {
    return this.supplierService.createSupplier(dto, user.userId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.SUPPLIER_READ)
  findAll(@Query() query: PaginationDto) {
    return this.supplierService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.SUPPLIER_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.findOne(id);
  }
}
