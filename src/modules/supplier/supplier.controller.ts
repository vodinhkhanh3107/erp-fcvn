import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ROLES } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierService } from './supplier.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Supplier')
@ApiBearerAuth('access-token')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @Roles(ROLES.ADMIN, ROLES.ACCOUNTANT,ROLES.PURCHASING)
  create(@Body() dto: CreateSupplierDto, @CurrentUser() user: { userId: number }) {
    return this.supplierService.createSupplier(dto, user.userId);
  }

  @Get()
  @Roles(ROLES.ADMIN, ROLES.ACCOUNTANT,ROLES.PURCHASING,ROLES.MANAGER)
  findAll(@Query() query: PaginationDto) {
    return this.supplierService.findAll(query);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.ACCOUNTANT,ROLES.PURCHASING,ROLES.MANAGER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.findOne(id);
  }
}