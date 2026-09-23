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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { GoodReceiptService } from './good-receipt.service';
import { PERMISSIONS } from 'src/common/constants/permission.constants';
import { CreateGoodReceiptDto } from './dto/create-good-receipt.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { ListGoodReceiptDto } from './dto/list-good-receipt.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Good Receipt')
@ApiBearerAuth('access-token')
// @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)

@Controller('good-receipts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class GoodReceiptController {
  constructor(private readonly goodReceiptService: GoodReceiptService) {}

  @Post()
  @RequirePermission(PERMISSIONS.GOOD_RECEIPT_MANAGE)
  create(@Body() dto: CreateGoodReceiptDto, @CurrentUser() user: { userId: number }) {
    return this.goodReceiptService.create(dto, user.userId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.GOOD_RECEIPT_READ)
  findAll(@Query() query: ListGoodReceiptDto) {
    return this.goodReceiptService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.GOOD_RECEIPT_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.goodReceiptService.findOne(id);
  }

  // "Xác nhận nhập kho" — hành động DUY NHẤT thực sự cập nhật tồn kho
  @Put(':id/confirm')
  @RequirePermission(PERMISSIONS.GOOD_RECEIPT_CONFIRM)
  confirm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    return this.goodReceiptService.confirm(id, user.userId);
  }
}
