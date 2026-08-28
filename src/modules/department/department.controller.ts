import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ROLES } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentService } from './department.service';

@ApiTags('Department')
@ApiBearerAuth('access-token')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(ROLES.ADMIN, ROLES.HR)
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: { userId: number }) {
    return this.departmentService.createDepartment(dto, user.userId);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.departmentService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.findOne(id);
  }

  @Put(':id')
  @Roles(ROLES.ADMIN, ROLES.HR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.departmentService.updateDepartment(id, dto, user.userId);
  }

  @Put(':id/status')
  @Roles(ROLES.ADMIN, ROLES.HR)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentStatusDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.departmentService.updateStatus(id, dto, user.userId);
  }
}