import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ROLES } from "src/common/constants/role.enum";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { PurchaseRequestService } from "./purchase-request.service";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { UpdatePurchaseRequestDto } from "./dto/update-purchase-request.dto";
import { Roles } from "src/common/decorators/roles.decorator";
import { RejectPurchaseRequestDto } from "./dto/reject-purchase-request.dto";
import { IssuePoDto } from "./dto/issue-purchase-order.dto";
import { ListPurchaseRequestDto } from "./dto/list-purchase-request.dto";

type JwtUser = { userId: number; role: ROLES };

@ApiTags('Purchase Request')
@ApiBearerAuth('access-token')
@Controller('purchase-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseRequestController {
  constructor(private readonly purchaseRequestService: PurchaseRequestService) {}

  // 1. Tạo nháp 
  @Post()
  create(@Body() dto: CreatePurchaseRequestDto, @CurrentUser() user: JwtUser) {
    return this.purchaseRequestService.createDraft(dto, user.userId);
  }

  // 2. Cập nhật — Service tự chặn "chỉ khi DRAFT" + "chỉ chủ sở hữu"
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseRequestDto, @CurrentUser() user: JwtUser) {
    return this.purchaseRequestService.update(id, dto, user.userId);
  }

  // 3. Gửi duyệt
  @Put(':id/submit')
  submit(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.purchaseRequestService.submit(id, user.userId);
  }

  // 4. Phê duyệt — Service tự chặn "đúng Manager"; Controller chỉ chặn thô role Admin/Manager
  @Put(':id/approve')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.purchaseRequestService.approve(id, user.userId, user.role);
  }

  // 5. Từ chối — bắt buộc lý do (chặn ở DTO)
  @Put(':id/reject')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectPurchaseRequestDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.purchaseRequestService.reject(id, dto, user.userId, user.role);
  }

  // 6. Xem lịch sử
  @Get(':id/history')
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseRequestService.getHistory(id);
  }

  // 7. Tìm kiếm + phân trang (toàn bộ PR — Manager/Admin)
  // @Get()
  // @Roles(ROLES.ADMIN, ROLES.MANAGER)
  // findAll(@Query() query: ListPurchaseRequestDto) {
  //   return this.purchaseRequestService.findAll(query);
  // }

  // Nhân sự xem đúng PR của chính mình
  @Get()
  faindAll(@Query() query: ListPurchaseRequestDto) {
    return this.purchaseRequestService.findAll(query); 
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseRequestService.findOne(id);
  }

  // Phát hành PO — TÁCH RIÊNG khỏi approve(), chỉ dùng được khi PR đã APPROVED
  @Post(':id/issue-po')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  issuePO(@Param('id', ParseIntPipe) id: number, @Body() dto: IssuePoDto, @CurrentUser() user: JwtUser) {
    return this.purchaseRequestService.issuePO(id, dto, user.userId);
  }
}