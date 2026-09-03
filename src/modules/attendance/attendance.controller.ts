import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { ListAttendanceDto } from './dto/list-attendance.dto';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/common/constants/permission.constants';
import { PermissionGuard } from 'src/common/guards/permission.guard';

@ApiTags('Attendance')
@ApiBearerAuth('access-token')
@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ATTENDANCE_CREATE)
  create(@Body() dto: CreateAttendanceDto, @CurrentUser() user: { userId: number }) {
    return this.attendanceService.create(dto, user.userId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)

  findAll(@Query() query: ListAttendanceDto) {
    return this.attendanceService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)

  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findOne(id);
  }
}