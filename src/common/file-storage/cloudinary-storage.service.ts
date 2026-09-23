// src/common/file-storage/cloudinary-storage.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { IFileStorageService, UploadedFileResult } from './file-storage.interface';

@Injectable()
export class CloudinaryStorageService implements IFileStorageService {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(file: Express.Multer.File, folder: string): Promise<UploadedFileResult> {
    const result = await this.uploadBuffer(file.buffer, folder, file.originalname);

    return {
      fileUrl: result.secure_url,
      fileName: file.originalname, // Cloudinary không giữ tên gốc trong public_id, nên lưu riêng
      fileSize: file.size,
      storageKey: result.public_id, // dùng để xóa file sau này
    };
  }

  async delete(storageKey: string): Promise<void> {
    // resource_type: 'raw' bắt buộc phải khớp với lúc upload (PDF/docx là 'raw', ảnh là 'image')
    await cloudinary.uploader.destroy(storageKey, { resource_type: 'raw' }).catch(() => {});
  }

  private uploadBuffer(
    buffer: Buffer,
    folder: string,
    originalName: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `erp-fcvn/${folder}`, // namespace theo project, tránh lẫn với ảnh module khác trên cùng account
          resource_type: 'auto', // 'auto' để Cloudinary tự nhận PDF/ảnh/docx thay vì ép cứng 1 loại
          public_id: originalName.replace(/\.[^/.]+$/, ''), // bỏ đuôi file, Cloudinary tự thêm lại
          use_filename: true,
          unique_filename: true, // Cloudinary tự thêm hậu tố random, tránh trùng khi 2 file cùng tên gốc
        },
        (error: any, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }
}
