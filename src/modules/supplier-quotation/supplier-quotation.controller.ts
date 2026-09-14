import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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

@ApiTags('Supplier Quotation')
@ApiBearerAuth('access-token')
@Controller('suppliers/:supplierId/quotations')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class SupplierQuotationController {
  constructor(private readonly sqService: SupplierQuotationService) {}
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

  @Get()
  async list(@Param('id', ParseIntPipe) id: number) {
    const data = await this.sqService.listBySupplier(id);
    return { success: 'Lấy danh báo báo giá cho nhà cung cấp thành công', data };
  }
}
