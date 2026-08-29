import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { ListKpiDto } from './dto/list-kpi.dto';
import { UpdateKpiActualDto } from './dto/update-kpi-actual-dto';
import { KpiService } from './kpi.service';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/common/constants/permission.constants';

@ApiTags('KPI')
@ApiBearerAuth('access-token')
@Controller('kpis')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)

export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Post()
  @RequirePermission(PERMISSIONS.KPI_CREATE)
  create(@Body() dto: CreateKpiDto, @CurrentUser() user: { userId: number }) {
    return this.kpiService.create(dto, user.userId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.KPI_READ)

  findAll(@Query() query: ListKpiDto) {
    return this.kpiService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.KPI_READ)

  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.kpiService.findOne(id);
  }

  @Put(':id/actual')
  @RequirePermission(PERMISSIONS.KPI_UPDATE)

  updateActual(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKpiActualDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.kpiService.updateActual(id, dto, user.userId);
  }
}