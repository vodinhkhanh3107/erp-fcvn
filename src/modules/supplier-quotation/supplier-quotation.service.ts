import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FILE_STORAGE_SERVICE,
  IFileStorageService,
} from '../../common/file-storage/file-storage.interface';
import { SupplierQuotation } from '../../models/supplier-quotation.entity';
import { AppLogger } from '../../common/logger/app-logger.service';
import { Readable } from 'typeorm/platform/PlatformTools.js';
import axios from 'axios';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from 'src/common/constants/file-size.constants';

@Injectable()
export class SupplierQuotationService {
  private readonly logger = new AppLogger();
  constructor(
    @InjectRepository(SupplierQuotation) private readonly repo: Repository<SupplierQuotation>,
    @Inject(FILE_STORAGE_SERVICE) private readonly storage: IFileStorageService,
  ) {
    this.logger.setContext('SupplierQuotationService');
  }

  async downloadQuotation(
    quotationId: number,
    requesterId: number,
    isPrivilegedRole: boolean,
  ): Promise<{ stream: Readable; fileName: string; mimeType: string }> {
    const quotation = await this.repo.findOneBy({ id: quotationId });
    if (!quotation) {
      throw new NotFoundException('Not-found-quotation');
    }

    if (!isPrivilegedRole && quotation.uploadedBy !== requesterId) {
      throw new BadRequestException('Not-have-permision-to-access');
    }

    const response = await axios.get(quotation.fileUrl, { responseType: 'stream' });

    const contentType = response.headers['content-type'];
    const mimeType = typeof contentType === 'string' ? contentType : 'application/octet-stream';
    return {
      stream: response.data,
      fileName: quotation.fileName,
      mimeType,
    };
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

  async listBySupplier(supplierId: number, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await this.repo.findAndCount({
      where: { supplierId },
      order: { uploadedAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const safeRows = rows.map(({ fileUrl, storageKey, ...safe }) => safe);

    return { rows: safeRows, total, page, limit };
  }

  async deleteQuotation(quotationId: number) {
    const quotation = await this.repo.findOneBy({ id: quotationId });
    if (!quotation) return;

    await this.storage.delete(quotation.storageKey);
    await this.repo.remove(quotation);
  }
}
