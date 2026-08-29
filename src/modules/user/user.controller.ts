import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';
import { ROLES } from '../../common/constants/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserService } from './user.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/common/constants/permission.constants';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard,RolesGuard,PermissionGuard)
export class UserController {   
  constructor(private readonly userService: UserService,
  ) {}

  @Post()
  @RequirePermission(PERMISSIONS.USER_CREATE)
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.USER_READ)
  findAll(@Query() query: PaginationDto) {
    return this.userService.list(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.USER_READ)

  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number; role: ROLES }) {
    const isPrivileged = (user.role === ROLES.ADMIN || user.role === ROLES.HR || user.role === ROLES.MANAGER || user.role === ROLES.ACCOUNTANT || user.role === ROLES.BOD);
    const isOwnProfile = user.userId === id;

    if (isOwnProfile || (!isOwnProfile && isPrivileged)){
      return this.userService.findOne(id);
      
    }
    throw new ForbiddenException('access-denied: Bạn không có quyền xem hồ sơ của người khác');
 
  }

  @Put(':id/status')  
  @RequirePermission(PERMISSIONS.USER_UPDATE)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserStatusDto) {
    return this.userService.updateStatus(id, dto);
  }


}
