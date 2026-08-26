import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/constants/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserService } from './user.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get()
  @Roles(Role.ADMIN,Role.MANAGER,Role.HR,Role.BOD)
  findAll(@Query() query: PaginationDto) {
    return this.userService.list(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN,Role.MANAGER,Role.HR,Role.BOD)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number; role: Role }) {
    const isPrivileged = (user.role === Role.ADMIN || user.role === Role.HR || user.role === Role.MANAGER || user.role === Role.ACCOUNTANT || user.role === Role.BOD);
    const isOwnProfile = user.userId === id;

    if (isOwnProfile || (!isOwnProfile && isPrivileged)){
      return this.userService.findOne(id);
      
    }
    throw new ForbiddenException('access-denied: Bạn không có quyền xem hồ sơ của người khác');
 
  }

  @Put(':id/status')
  @Roles(Role.ADMIN, Role.HR)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserStatusDto) {
    return this.userService.updateStatus(id, dto);
  }


}
