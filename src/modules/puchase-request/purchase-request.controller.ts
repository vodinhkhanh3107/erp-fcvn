import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ROLES } from 'src/common/constants/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PurchaseRequestService } from './purchase-request.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { IssuePoDto } from './dto/issue-purchase-order.dto';
import { ListPurchaseRequestDto } from './dto/list-purchase-request.dto';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/common/constants/permission.constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/models/role.entity';
import { Repository } from 'typeorm';
import { Response } from 'express';

type JwtUser = { userId: number; role: ROLES; roleId: number };
const PRIVILEGED_ROLES = ['purchasing', 'accountant', 'admin'];

@ApiTags('Purchase Request')
@ApiBearerAuth('access-token')
@Controller('purchase-requests')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class PurchaseRequestController {
  constructor(
    private readonly purchaseRequestService: PurchaseRequestService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  // 1. Tạo nháp
  @Post()
  @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_CREATE)
  create(@Body() dto: CreatePurchaseRequestDto, @CurrentUser() user: JwtUser) {
    return this.purchaseRequestService.create(dto, user.userId);
  }

  // 2. Cập nhật — Service tự chặn "chỉ khi DRAFT" + "chỉ chủ sở hữu"
  @Put(':id')
  @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_UPDATE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseRequestDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.purchaseRequestService.update(id, dto, user.userId);
  }

  // 3. Gửi duyệt
  @Put(':id/submit')
  @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_SUBMIT)
  submit(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.purchaseRequestService.submit(id, user.userId);
  }

  // 4. Phê duyệt — Service tự chặn "đúng Manager"; Controller chỉ chặn thô role Admin/Manager
  @Put(':id/approve')
  @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_APPROVE)
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.purchaseRequestService.approve(id, user.userId);
  }

  // 5. Từ chối — bắt buộc lý do (chặn ở DTO)
  @Put(':id/reject')
  @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_REJECT)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectPurchaseRequestDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.purchaseRequestService.reject(id, dto, user.userId);
  }

  // 6. Xem lịch sử
  @Get(':id/history')
  @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_HISTORY)
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseRequestService.getHistory(id);
  }

  // 7. Tìm kiếm + phân trang (toàn bộ PR — Manager/Admin)
  // @Get()
  // @Roles(ROLES.ADMIN, ROLES.MANAGER)
  // findAll(@Query() query: ListPurchaseRequestDto) {
  //   return this.purchaseRequestService.findAll(query);
  // }

  // 8.Nhân sự xem đúng PR của chính mình
  @Get()
  @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_READ)
  faindAll(@Query() query: ListPurchaseRequestDto) {
    return this.purchaseRequestService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseRequestService.findOne(id);
  }

  // 9. Phát hành PO — TÁCH RIÊNG khỏi approve(), chỉ dùng được khi PR đã APPROVED
  @Post(':id/issue-po')
  @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_ISSUE)
  issuePO(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IssuePoDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.purchaseRequestService.issuePO(id, dto, user.userId);
  }
  // 10. upload file chữ ký
  @Post(':id/sign')
  // @RequirePermission(PERMISSIONS.PURCHASE_REQUEST_SIGN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  ) // 'file' là tên field trong multipart/form-data
  signPurchaseRequest(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: number },
  ) {
    return this.purchaseRequestService.signPurchaseRequest(id, file, user.userId);
  }

  // 11. tải file chữ ký
  @Get(':purchaseRequestId/download')
  async download(
    @Param('purchaseRequestId', ParseIntPipe) purchaseRequestId: number,
    @CurrentUser() user: { roleId: number; id: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    const roleExist = await this.roleRepository.findOneBy({ id: user.roleId });
    const isPrivileged = PRIVILEGED_ROLES.includes((roleExist?.code).toLowerCase());
    const { stream, fileName, mimeType } = await this.purchaseRequestService.downloadQuotation(
      purchaseRequestId,
      user.id,
      isPrivileged,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
    });
    return new StreamableFile(stream);
  }
}
