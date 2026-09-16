import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupplierQuotationService } from './supplier-quotation.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/models/role.entity';
import { Repository } from 'typeorm';

const PRIVILEGED_ROLES = ['manager', 'bod', 'admin'];

@ApiTags('Supplier Quotation')
@ApiBearerAuth('access-token')
@Controller('suppliers/:supplierId/quotations')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class SupplierQuotationController {
  constructor(
    private readonly sqService: SupplierQuotationService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  // @RequirePermission(PERMISSIONS.UPLOAD_FILE_READ)
  @Get(':quotationId/download')
  async download(
    @Param('quotationId', ParseIntPipe) quotationId: number,
    @CurrentUser() user: { roleId: number; id: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    const roleExist = await this.roleRepository.findOneBy({ id: user.roleId });
    const isPrivileged = PRIVILEGED_ROLES.includes((roleExist?.code).toLowerCase());
    const { stream, fileName, mimeType } = await this.sqService.downloadQuotation(
      quotationId,
      user.id,
      isPrivileged,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
    });
    return new StreamableFile(stream);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(
    @Param('supplierId') supplierId: number,
    @CurrentUser() user: { userId: number },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.sqService.uploadQuotation(supplierId, file, user.userId);
    return { success: 'Thêm báo giá cho nhà cung cấp thành công', data };
  }

  // @RequirePermission(PERMISSIONS.UPLOAD_FILE_READ)
  @Get()
  async list(
    @Param('supplierId', ParseIntPipe) id: number,
    @Query() query: { page?: number; limit?: number },
  ) {
    const data = await this.sqService.listBySupplier(id, query);
    return { success: 'Lấy danh sách báo báo giá cho nhà cung cấp thành công', data };
  }

  // @RequirePermission(PERMISSIONS.UPLOAD_FILE_DELETE)
  @Delete()
  async delete(@Param('quotationId', ParseIntPipe) id: number) {
    const data = await this.sqService.deleteQuotation(id);
    return { success: 'Xóa báo giá cho nhà cung cấp thành công', data };
  }
}
