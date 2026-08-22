import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApprovePurchaseRequestDto } from './dto/approve-purchase-request.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { ListPurchaseRequestDto } from './dto/list-purchase-request.dto';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { PurchaseRequestService } from './purchase-request.service';

@ApiTags('Purchase Request')
@ApiBearerAuth('access-token')
@Controller('purchase-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseRequestController {
  constructor(private readonly purchaseRequestService: PurchaseRequestService) {}

  @Post()
  create(@Body() dto: CreatePurchaseRequestDto, @CurrentUser() user: { employeeId: number }) {
    return this.purchaseRequestService.create(dto, user.employeeId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(@Query() query: ListPurchaseRequestDto) {
    return this.purchaseRequestService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseRequestService.findOne(id);
  }

  @Put(':id/approve')
  @Roles(Role.ADMIN, Role.MANAGER)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApprovePurchaseRequestDto,
    @CurrentUser() user: { employeeId: number },
  ) {
    return this.purchaseRequestService.approveAndIssuePO(id, dto, user.employeeId);
  }

  @Put(':id/reject')
  @Roles(Role.ADMIN, Role.MANAGER)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectPurchaseRequestDto,
    @CurrentUser() user: { employeeId: number },
  ) {
    return this.purchaseRequestService.reject(id, dto, user.employeeId);
  }
}
