import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FILE_STORAGE_SERVICE,
  IFileStorageService,
} from '../../common/file-storage/file-storage.interface';
import { SupplierQuotation } from '../../models/supplier-quotation.entity';
import { AppLogger } from '../../common/logger/app-logger.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Injectable()
export class SupplierQuotationService {
  private readonly logger = new AppLogger();
  constructor(
    @InjectRepository(SupplierQuotation) private readonly repo: Repository<SupplierQuotation>,
    @Inject(FILE_STORAGE_SERVICE) private readonly storage: IFileStorageService,
  ) {
    this.logger.setContext('SupplierQuotationService');
  }

  async uploadQuotation(supplierId: number, file: Express.Multer.File, uploadedBy: number) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File vượt quá giới hạn cho phép');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Định dạng file không được hỗ trợ');
    }

    const uploaded = await this.storage.upload(file, 'supplier-quotations');

    try {
      const quotation = this.repo.create({
        supplierId,
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        storageKey: uploaded.storageKey,
        uploadedBy,
      });
      return await this.repo.save(quotation);
    } catch (err) {
      await this.storage.delete(uploaded.storageKey);
      throw err;
    }
  }

  async listBySupplier(supplierId: number) {
    return this.repo.find({ where: { supplierId }, order: { uploadedAt: 'DESC' } });
  }

  async deleteQuotation(quotationId: number) {
    const quotation = await this.repo.findOneBy({ id: quotationId });
    if (!quotation) return;

    await this.storage.delete(quotation.storageKey);
    await this.repo.remove(quotation);
  }
}
