import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AssignSuppliersDto } from './dto/assign-suppliers.dto';
import { CreateSupplierGroupDto } from './dto/create-supplier-group.dto';
import { UpdateSupplierGroupDto } from './dto/update-supplier-group.dto';
import { UpdateSupplierGroupStatusDto } from './dto/update-supplier-group-status.dto';
import { SupplierGroupService } from './supplier-group.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Supplier Group')
@ApiBearerAuth('access-token')
@Controller('supplier-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierGroupController {
  constructor(private readonly supplierGroupService: SupplierGroupService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTANT,Role.PURCHASING)
  create(@Body() dto: CreateSupplierGroupDto, @CurrentUser() user: { userId: number }) {
    return this.supplierGroupService.createGroup(dto, user.userId);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.supplierGroupService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supplierGroupService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierGroupDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.supplierGroupService.updateGroup(id, dto, user.userId);
  }

  @Put(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierGroupStatusDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.supplierGroupService.updateStatus(id, dto, user.userId);
  }

//  gán nhà cung cấp vào nhóm nhà cung cấp
  @Post(':id/assign-suppliers')
  @Roles(Role.ADMIN, Role.MANAGER)
  assignSuppliers(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignSuppliersDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.supplierGroupService.assignSuppliers(id, dto, user.userId);
  }
}