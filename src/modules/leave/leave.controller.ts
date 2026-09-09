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
import { ROLES } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { ListLeaveDto } from './dto/list-leave.dto';
import { ReviewLeaveDto } from './dto/review-leave.dto';
import { LeaveService } from './leave.service';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/common/constants/permission.constants';

@ApiTags('Leave')
@ApiBearerAuth('access-token')
@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @RequirePermission(PERMISSIONS.LEAVE_CREATE)
  create(@Body() dto: CreateLeaveDto, @CurrentUser() user: { userId: number }) {
    return this.leaveService.createLeaveRequest(user.userId, dto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.LEAVE_READ)
  findAll(@Query() query: ListLeaveDto) {
    return this.leaveService.findAll(query);
  }

  // user xem đúng danh sách nghỉ phép của CHÍNH MÌNH
  @Get('me')
  @RequirePermission(PERMISSIONS.LEAVE_READ)
  findMine(@Query() query: ListLeaveDto, @CurrentUser() user: { userId: number }) {
    return this.leaveService.findAll({ ...query, userId: user.userId });
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.LEAVE_READ)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; role: ROLES },
  ) {
    const isPrivileged = [ROLES.ADMIN, ROLES.MANAGER, ROLES.HR].includes(user.role);
    return isPrivileged
      ? this.leaveService.findOne(id)
      : this.leaveService.findOneForSelf(id, user.userId);
  }

  // Duyệt/từ chối — CHỈ Manager/HR/Admin
  @Put(':id/review')
  @RequirePermission(PERMISSIONS.LEAVE_APPROVE, PERMISSIONS.LEAVE_REJECT)
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewLeaveDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.leaveService.review(id, dto, user.userId);
  }
}
