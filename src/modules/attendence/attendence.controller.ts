import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AttendanceService } from './attendence.service';
import { CreateAttendanceDto } from './dto/create-attendence.dto';
import { ListAttendanceDto } from './dto/list-attendence.dto';

@ApiTags('Attendance')
@ApiBearerAuth('access-token')
@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  create(@Body() dto: CreateAttendanceDto, @CurrentUser() user: { userId: number }) {
    return this.attendanceService.create(dto, user.userId);
  }

  @Get()
  findAll(@Query() query: ListAttendanceDto) {
    return this.attendanceService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findOne(id);
  }
}