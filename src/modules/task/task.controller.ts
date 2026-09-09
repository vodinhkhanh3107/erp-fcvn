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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTaskDto } from './dto/list-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskService } from './task.service';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { PERMISSIONS } from 'src/common/constants/permission.constants';
import { RequirePermission } from 'src/common/decorators/permission.decorator';

@ApiTags('Task')
@ApiBearerAuth('access-token')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @RequirePermission(PERMISSIONS.TASK_CREATE)
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: { userId: number }) {
    return this.taskService.create(dto, user.userId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TASK_READ)
  findAll(@Query() query: ListTaskDto) {
    return this.taskService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TASK_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Put(':id/status')
  @RequirePermission(PERMISSIONS.TASK_UPDATE)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.taskService.updateStatus(id, dto, user.userId);
  }
}
