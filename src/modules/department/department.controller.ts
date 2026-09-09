import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentService } from './department.service';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/common/constants/permission.constants';

@ApiTags('Department')
@ApiBearerAuth('access-token')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @RequirePermission(PERMISSIONS.DEPARTMENT_CREATE)
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: { userId: number }) {
    return this.departmentService.createDepartment(dto, user.userId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.DEPARTMENT_READ)
  findAll(@Query() query: PaginationDto) {
    return this.departmentService.list(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.DEPARTMENT_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.findOne(id);
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.DEPARTMENT_UPDATE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.departmentService.updateDepartment(id, dto, user.userId);
  }

  @Put(':id/status')
  @RequirePermission(PERMISSIONS.DEPARTMENT_UPDATE)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentStatusDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.departmentService.updateStatus(id, dto, user.userId);
  }
}
