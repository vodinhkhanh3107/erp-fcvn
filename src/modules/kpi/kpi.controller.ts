import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { ListKpiDto } from './dto/list-kpi.dto';
import { UpdateKpiActualDto } from './dto/update-kpi-actual-dto';
import { KpiService } from './kpi.service';

// Actor(s) theo UC03: Manager · HR (giống Task, vì cùng chung UC03)
@ApiTags('KPI')
@ApiBearerAuth('access-token')
@Controller('kpis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.HR)
  create(@Body() dto: CreateKpiDto, @CurrentUser() user: { userId: number }) {
    return this.kpiService.create(dto, user.userId);
  }

  @Get()
  findAll(@Query() query: ListKpiDto) {
    return this.kpiService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.kpiService.findOne(id);
  }

  @Put(':id/actual')
  @Roles(Role.ADMIN, Role.MANAGER, Role.HR)
  updateActual(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKpiActualDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.kpiService.updateActual(id, dto, user.userId);
  }
}