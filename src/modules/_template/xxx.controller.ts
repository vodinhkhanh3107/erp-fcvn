import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/role.enum';
import { CreateXxxDto } from './dto/create-xxx.dto';
import { XxxService } from './xxx.service';

@Controller('xxx') 
@UseGuards(JwtAuthGuard, RolesGuard)
export class XxxController {
  constructor(private readonly xxxService: XxxService) {}

  @Post()
  @Roles(Role.ADMIN) 
  create(@Body() dto: CreateXxxDto) {
    return this.xxxService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.xxxService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.xxxService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateXxxDto>) {
    return this.xxxService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.xxxService.remove(id);
  }
}
