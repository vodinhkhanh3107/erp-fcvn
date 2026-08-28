import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLES } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTaskDto } from './dto/list-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskService } from './task.service';

@ApiTags('Task')
@ApiBearerAuth('access-token')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.HR)
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: { userId: number }) {
    return this.taskService.create(dto, user.userId);
  }

  @Get()
  findAll(@Query() query: ListTaskDto) {
    return this.taskService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.taskService.updateStatus(id, dto, user.userId);
  }
}