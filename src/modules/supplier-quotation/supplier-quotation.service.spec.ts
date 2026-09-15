import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { FILE_STORAGE_SERVICE } from '../../common/file-storage/file-storage.interface';
import { SupplierQuotation } from '../../models/supplier-quotation.entity';
import { SupplierQuotationService } from './supplier-quotation.service';

describe('SupplierQuotationService', () => {
  let service: SupplierQuotationService;
  let mockRepo: any;
  let mockStorage: any;

  const fakeUploadedFile = {
    size: 1024 * 1024, // 1MB — hợp lệ (< 5MB)
    mimetype: 'application/pdf',
    originalname: 'baogia.pdf',
    buffer: Buffer.from('fake'),
  } as any;

  const fakeUploadResult = {
    fileUrl: 'https://cdn.example.com/supplier-quotations/abc.pdf',
    fileName: 'baogia.pdf',
    fileSize: 1024 * 1024,
    storageKey: 'supplier-quotations/abc.pdf',
  };

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
      findAndCount: jest.fn(),
    };
    mockStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierQuotationService,
        { provide: getRepositoryToken(SupplierQuotation), useValue: mockRepo },
        { provide: FILE_STORAGE_SERVICE, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<SupplierQuotationService>(SupplierQuotationService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('uploadQuotation()', () => {
    it('file vượt quá 5MB → ném BadRequestException, KHÔNG được gọi storage.upload()', async () => {
      const oversizedFile = { ...fakeUploadedFile, size: 6 * 1024 * 1024 } as any;

      await expect(service.uploadQuotation(1, oversizedFile, 99)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadQuotation(1, oversizedFile, 99)).rejects.toThrow(
        'File vượt quá giới hạn cho phép',
      );
      expect(mockStorage.upload).not.toHaveBeenCalled();
    });

    it('mimetype không nằm trong danh sách cho phép → ném BadRequestException, KHÔNG được gọi storage.upload()', async () => {
      const invalidFile = { ...fakeUploadedFile, mimetype: 'application/zip' } as any;

      await expect(service.uploadQuotation(1, invalidFile, 99)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadQuotation(1, invalidFile, 99)).rejects.toThrow(
        'Định dạng file không được hỗ trợ',
      );
      expect(mockStorage.upload).not.toHaveBeenCalled();
    });

    it('file hợp lệ, upload + save đều thành công → trả về bản ghi đã lưu', async () => {
      mockStorage.upload.mockResolvedValue(fakeUploadResult);
      const createdEntity = { supplierId: 1, ...fakeUploadResult, uploadedBy: 99 };
      mockRepo.create.mockReturnValue(createdEntity);
      mockRepo.save.mockResolvedValue({ id: 10, ...createdEntity });

      const result = await service.uploadQuotation(1, fakeUploadedFile, 99);

      expect(mockStorage.upload).toHaveBeenCalledWith(fakeUploadedFile, 'supplier-quotations');
      expect(mockRepo.create).toHaveBeenCalledWith({
        supplierId: 1,
        fileUrl: fakeUploadResult.fileUrl,
        fileName: fakeUploadResult.fileName,
        fileSize: fakeUploadResult.fileSize,
        storageKey: fakeUploadResult.storageKey,
        uploadedBy: 99,
      });
      expect(result).toEqual({ id: 10, ...createdEntity });
    });

    it('upload file thành công nhưng lưu DB thất bại → PHẢI dọn dẹp file đã upload (storage.delete), rồi ném lại đúng lỗi gốc', async () => {
      mockStorage.upload.mockResolvedValue(fakeUploadResult);
      const dbError = new Error('DB connection lost');
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockRejectedValue(dbError);

      await expect(service.uploadQuotation(1, fakeUploadedFile, 99)).rejects.toThrow(
        'DB connection lost',
      );

      // Đây là hành vi "dọn rác" quan trọng nhất của hàm này — nếu bỏ sót, file sẽ bị upload
      // "mồ côi" lên storage mà không có bản ghi DB nào trỏ tới, không bao giờ xóa được nữa.
      expect(mockStorage.delete).toHaveBeenCalledWith(fakeUploadResult.storageKey);
    });

    it('nếu save() thành công thì KHÔNG được gọi storage.delete() (không dọn nhầm file vừa upload thành công)', async () => {
      mockStorage.upload.mockResolvedValue(fakeUploadResult);
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({ id: 1 });

      await service.uploadQuotation(1, fakeUploadedFile, 99);

      expect(mockStorage.delete).not.toHaveBeenCalled();
    });
  });

  describe('listBySupplier() — lấy ra danh sách file thành công', () => {
    it('phải lọc theo supplierId (KHÔNG phải theo id của bản ghi quotation)', async () => {
      (mockRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.listBySupplier(5, { page: 1, limit: 20 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith({
        where: { supplierId: 5 },
        order: { uploadedAt: 'DESC' },
        take: 20,
        skip: 0,
      });
    });
  });

  describe('deleteQuotation()', () => {
    it('không tìm thấy bản ghi → return im lặng, KHÔNG gọi storage.delete()/repo.remove()', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      const result = await service.deleteQuotation(999);

      expect(result).toBeUndefined();
      expect(mockStorage.delete).not.toHaveBeenCalled();
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });

    it('tìm thấy → xóa file trên storage TRƯỚC, rồi mới xóa bản ghi DB', async () => {
      const fakeQuotation = { id: 1, storageKey: 'supplier-quotations/abc.pdf' };
      mockRepo.findOneBy.mockResolvedValue(fakeQuotation);

      await service.deleteQuotation(1);

      expect(mockStorage.delete).toHaveBeenCalledWith(fakeQuotation.storageKey);
      expect(mockRepo.remove).toHaveBeenCalledWith(fakeQuotation);
    });
  });
});
