import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { ListLeaveDto } from './dto/list-leave.dto';
import { ReviewLeaveDto } from './dto/review-leave.dto';
import { LeaveService } from './leave.service';

@ApiTags('Leave')
@ApiBearerAuth('access-token')
@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  // Employee tự gửi yêu cầu — mọi role đăng nhập đều gọi được, không giới hạn @Roles()
  @Post()
  create(@Body() dto: CreateLeaveDto, @CurrentUser() user: { userId: number }) {
    return this.leaveService.createLeaveRequest(user.userId, dto);
  }

  // Manager/HR/Admin xem TOÀN BỘ danh sách (để duyệt); user thường nên gọi /leaves/me thay vì đây
  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.HR)
  findAll(@Query() query: ListLeaveDto) {
    return this.leaveService.findAll(query);
  }

  // user xem đúng danh sách nghỉ phép của CHÍNH MÌNH
  @Get('me')
  findMine(@Query() query: ListLeaveDto, @CurrentUser() user: { userId: number }) {
    return this.leaveService.findAll({ ...query, userId: user.userId });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; role: ROLES },
  ) {
    const isPrivileged = [ROLES.ADMIN, ROLES.MANAGER, ROLES.HR].includes(user.role);
    return isPrivileged ? this.leaveService.findOne(id) : this.leaveService.findOneForSelf(id, user.userId);
  }

  // Duyệt/từ chối — CHỈ Manager/HR/Admin
  @Put(':id/review')
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.HR)
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewLeaveDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.leaveService.review(id, dto, user.userId);
  }
}