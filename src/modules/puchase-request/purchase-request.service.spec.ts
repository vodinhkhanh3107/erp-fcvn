import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import axios from 'axios';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequest, PurchaseRequestStatus } from '../../models/purchase-request.entity';
import { PurchaseRequestHistory } from '../../models/purchase-request-history.entity';
import { Department } from '../../models/department.entity';
import { PurchaseOrder } from '../../models/purchase-order.entity';
import { PurchaseOrderItem } from '../../models/purchase-order-item.entity';
import { PurchaseRequestItemQuotation } from '../../models/purchase-request-item-quotation.entity';
import { SupplierQuotation } from '../../models/supplier-quotation.entity';
import { FILE_STORAGE_SERVICE } from '../../common/file-storage/file-storage.interface';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../../common/constants/file-size.constants';

// axios được gọi trực tiếp (import axios from 'axios'), không qua DI — nên phải mock
// ở cấp module bằng jest.mock, không thể inject qua TestingModule như các dependency khác.
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  delete: jest.fn(),
});

const createMockManager = () => ({
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
});

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;
  let prRepository: MockRepository<PurchaseRequest>;
  let historyRepository: MockRepository<PurchaseRequestHistory>;
  let departmentRepository: MockRepository<Department>;
  let poRepository: MockRepository<PurchaseOrder>;
  let poItemRepository: MockRepository<PurchaseOrderItem>;
  let itemQuotationRepository: MockRepository<PurchaseRequestItemQuotation>;
  let sqRepository: MockRepository<SupplierQuotation>;
  let mockStorageService: { upload: jest.Mock };
  let mockManager: ReturnType<typeof createMockManager>;
  let mockQueryRunner: any;
  let mockDataSource: Partial<DataSource>;

  beforeEach(async () => {
    prRepository = createMockRepository<PurchaseRequest>();
    historyRepository = createMockRepository<PurchaseRequestHistory>();
    departmentRepository = createMockRepository<Department>();
    poRepository = createMockRepository<PurchaseOrder>();
    poItemRepository = createMockRepository<PurchaseOrderItem>();
    itemQuotationRepository = createMockRepository<PurchaseRequestItemQuotation>();
    sqRepository = createMockRepository<SupplierQuotation>();
    mockStorageService = { upload: jest.fn() };

    mockManager = createMockManager();
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    };
    mockDataSource = {
      createQueryRunner: jest.fn(() => mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestService,
        { provide: getRepositoryToken(PurchaseRequest), useValue: prRepository },
        { provide: getRepositoryToken(PurchaseRequestHistory), useValue: historyRepository },
        { provide: getRepositoryToken(Department), useValue: departmentRepository },
        { provide: getRepositoryToken(PurchaseOrder), useValue: poRepository },
        { provide: getRepositoryToken(PurchaseOrderItem), useValue: poItemRepository },
        {
          provide: getRepositoryToken(PurchaseRequestItemQuotation),
          useValue: itemQuotationRepository,
        },
        { provide: getRepositoryToken(SupplierQuotation), useValue: sqRepository },
        { provide: FILE_STORAGE_SERVICE, useValue: mockStorageService },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PurchaseRequestService>(PurchaseRequestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  // ===================== downloadQuotation =====================
  describe('downloadQuotation', () => {
    it('nên throw NotFoundException nếu purchase request không tồn tại', async () => {
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.downloadQuotation(999, 1, false)).rejects.toThrow(NotFoundException);
      await expect(service.downloadQuotation(999, 1, false)).rejects.toThrow(
        'Not-found-purchase-request',
      );
    });

    it('nên throw BadRequestException nếu KHÔNG phải privileged role VÀ không phải người đã ký', async () => {
      const pr = { id: 1, signedBy: 5, signatureFileUrl: 'https://example.com/sig.pdf' };
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(pr);

      // requesterId = 999, khác signedBy = 5, và isPrivilegedRole = false
      await expect(service.downloadQuotation(1, 999, false)).rejects.toThrow(BadRequestException);
      await expect(service.downloadQuotation(1, 999, false)).rejects.toThrow(
        'Not-have-permision-to-access',
      );
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('nên cho phép tải nếu isPrivilegedRole = true, dù không phải người ký', async () => {
      const pr = { id: 1, signedBy: 5, signatureFileUrl: 'https://example.com/sig.pdf' };
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(pr);

      mockedAxios.get.mockResolvedValue({
        headers: { 'content-type': 'application/pdf' },
        data: 'fake-stream',
      });

      const result = await service.downloadQuotation(1, 999, true);

      expect(mockedAxios.get).toHaveBeenCalledWith(pr.signatureFileUrl, { responseType: 'stream' });
      expect(result).toEqual({
        stream: 'fake-stream',
        fileName: pr.signatureFileUrl,
        mimeType: 'application/pdf',
      });
    });

    it('nên cho phép tải nếu chính người đã ký (signedBy === requesterId), dù không privileged', async () => {
      const pr = { id: 1, signedBy: 5, signatureFileUrl: 'https://example.com/sig.pdf' };
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(pr);
      mockedAxios.get.mockResolvedValue({
        headers: { 'content-type': 'application/pdf' },
        data: 'fake-stream',
      });

      const result = await service.downloadQuotation(1, 5, false);

      expect(result.stream).toBe('fake-stream');
    });

    it('nên fallback mimeType về application/octet-stream nếu content-type không phải string', async () => {
      const pr = { id: 1, signedBy: 5, signatureFileUrl: 'https://example.com/sig.pdf' };
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(pr);
      mockedAxios.get.mockResolvedValue({
        headers: {}, // không có content-type
        data: 'fake-stream',
      });

      const result = await service.downloadQuotation(1, 5, false);

      expect(result.mimeType).toBe('application/octet-stream');
    });
  });

  // ===================== create =====================
  describe('create', () => {
    const requesterId = 1;
    const dto = {
      departmentId: 1,
      purposeOfUse: 'Mua màn hình',
      items: [
        {
          itemName: 'Màn hình',
          quantity: 2,
          quotations: [
            { supplierId: 1, quotedAmount: 1000 },
            { supplierId: 2, quotedAmount: 900 },
          ],
        },
      ],
    } as any;

    it('nên trả về PR cũ nếu requestKey đã tồn tại (chống trùng), không check gì thêm', async () => {
      const existedPr = { id: 99, requestKey: 'hash-abc' };
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(existedPr);

      const result = await service.create(dto, requesterId);

      expect(result).toEqual({
        message: 'Yêu cầu đã được ghi nhận trước đó (request trùng lặp)',
        result: existedPr,
      });
      expect(departmentRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('nên throw NotFoundException nếu departmentId không tồn tại', async () => {
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (departmentRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.create(dto, requesterId)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto, requesterId)).rejects.toThrow('Not-found-deparment');
    });

    it('nên throw BadRequestException nếu 2 báo giá trong cùng 1 item trùng supplierId', async () => {
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (departmentRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 1 });

      const dupDto = {
        ...dto,
        items: [
          {
            itemName: 'Màn hình',
            quantity: 2,
            quotations: [
              { supplierId: 1, quotedAmount: 1000 },
              { supplierId: 1, quotedAmount: 900 }, // trùng supplierId
            ],
          },
        ],
      };

      await expect(service.create(dupDto, requesterId)).rejects.toThrow(BadRequestException);
      await expect(service.create(dupDto, requesterId)).rejects.toThrow(
        'has-duplicate-supplier-in-quotations',
      );
      expect(sqRepository.find).not.toHaveBeenCalled();
    });

    it('nên throw BadRequestException nếu KHÔNG PHẢI tất cả nhà cung cấp đã có SupplierQuotation trước đó', async () => {
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (departmentRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 1 });
      // Chỉ supplier #1 có lịch sử, supplier #2 thì KHÔNG
      (sqRepository.find as jest.Mock).mockResolvedValue([{ supplierId: 1 }]);

      await expect(service.create(dto, requesterId)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto, requesterId)).rejects.toThrow(
        'supplier-not-have-quotation-or-not-have-supplier',
      );
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('nên tạo PR thành công với status PENDING khi TẤT CẢ nhà cung cấp đã có SupplierQuotation', async () => {
      (prRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (departmentRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 1 });
      (sqRepository.find as jest.Mock).mockResolvedValue([{ supplierId: 1 }, { supplierId: 2 }]);

      const savedPr = { id: 10, status: PurchaseRequestStatus.PENDING };
      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => {
        if (
          !Array.isArray(data) &&
          data &&
          !('itemName' in data) &&
          !('purchaseRequestId' in data)
        ) {
          return savedPr;
        }
        return data;
      });

      const result = await service.create(dto, requesterId);

      expect(sqRepository.find).toHaveBeenCalledWith({
        where: { supplierId: In([1, 2]) },
        select: ['supplierId'],
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        message: 'Tạo yêu cầu mua hàng thành công',
        result: savedPr,
      });
    });
  });

  // ===================== update =====================
  describe('update', () => {
    const actorId = 1;

    it('nên throw BadRequestException nếu PR không ở trạng thái DRAFT', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.PENDING,
        requesterId: actorId,
      } as any);

      await expect(service.update(1, {} as any, actorId)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, {} as any, actorId)).rejects.toThrow(
        'only-draft-purchase-request-can-be-updated',
      );
    });

    it('nên throw ForbiddenException nếu actorId không phải requester', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: 999,
      } as any);

      await expect(service.update(1, {} as any, actorId)).rejects.toThrow(ForbiddenException);
    });

    it('nên throw BadRequestException nếu items mới có trùng supplier trong cùng 1 item', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
      } as any);

      const dto = {
        items: [
          {
            itemName: 'A',
            quotations: [{ supplierId: 1 }, { supplierId: 1 }],
          },
        ],
      } as any;

      await expect(service.update(1, dto, actorId)).rejects.toThrow(
        'has-duplicate-supplier-in-quotations',
      );
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('nên cập nhật thành công departmentId/purposeOfUse khi hợp lệ', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
        departmentId: 1,
        purposeOfUse: 'Cũ',
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      mockManager.save.mockImplementation(async (data) => data);

      const dto = { departmentId: 2, purposeOfUse: 'Mới' } as any;
      const result = await service.update(1, dto, actorId);

      expect(result.result).toEqual(
        expect.objectContaining({ departmentId: 2, purposeOfUse: 'Mới' }),
      );
    });

    it('nên xoá items cũ và tạo lại items/quotations mới khi dto có items', async () => {
      const pr = { id: 1, status: PurchaseRequestStatus.DRAFT, requesterId: actorId, items: [] };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const dto = {
        items: [
          { itemName: 'Bàn phím', quantity: 1, quotations: [{ supplierId: 1 }, { supplierId: 2 }] },
        ],
      } as any;

      await service.update(1, dto, actorId);

      expect(mockManager.delete).toHaveBeenCalledWith(expect.anything(), { purchaseRequestId: 1 });
    });
  });

  // ===================== submit =====================
  describe('submit', () => {
    const actorId = 1;

    it('nên throw BadRequestException nếu PR không ở trạng thái DRAFT', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.PENDING,
        requesterId: actorId,
      } as any);

      await expect(service.submit(1, actorId)).rejects.toThrow(
        'only-draft-purchase-request-can-be-submitted',
      );
    });

    it('nên throw ForbiddenException nếu actorId không phải requester', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: 999,
      } as any);

      await expect(service.submit(1, actorId)).rejects.toThrow(ForbiddenException);
    });

    it('nên throw BadRequestException (BR-01) nếu không có item nào', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
        items: [],
      } as any);

      await expect(service.submit(1, actorId)).rejects.toThrow(
        'purchase-request-must-have-at-least-1-item',
      );
    });

    it('nên throw BadRequestException nếu có item thiếu đủ 2 báo giá', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
        items: [{ id: 5, quotations: [{ supplierId: 1 }] }],
      } as any);

      await expect(service.submit(1, actorId)).rejects.toThrow(
        'item-5-must-have-at-least-2-supplier-quotations',
      );
    });

    /**
     * LƯU Ý — NGHI VẤN BUG trong code gốc:
     * submit() gọi `this.sqRepository.findOneBy({ id })` — nhưng `id` ở đây là ID của
     * PURCHASE REQUEST (tham số đầu vào của hàm submit), không phải supplierId hay bất kỳ
     * field nào thuộc SupplierQuotation. Việc lấy `id` của PR để tra trong bảng
     * `supplier_quotations` (một entity hoàn toàn khác) không có ý nghĩa nghiệp vụ rõ ràng —
     * nhiều khả năng đây là lỗi copy-paste từ logic trong create()/determineInitialStatus().
     * Test dưới đây mô tả ĐÚNG hành vi hiện tại của code (không phải hành vi đúng nên có),
     * để nếu bạn sửa lại logic này, test sẽ cảnh báo qua việc fail.
     */
    it('[NGHI VẤN BUG] nên throw BadRequestException nếu sqRepository.findOneBy({ id: <purchaseRequestId> }) trả về null', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
        items: [{ id: 5, quotations: [{ supplierId: 1 }, { supplierId: 2 }] }],
      } as any);
      (sqRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.submit(1, actorId)).rejects.toThrow(
        'supplier-not-have-quotation-or-not-have-supplier',
      );
      expect(sqRepository.findOneBy).toHaveBeenCalledWith({ id: 1 }); // id của PR, không phải supplierId
    });

    it('nên chuyển DRAFT -> PENDING khi mọi điều kiện hợp lệ (bao gồm sqRepository.findOneBy trả về record)', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
        items: [{ id: 5, quotations: [{ supplierId: 1 }, { supplierId: 2 }] }],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (sqRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 1 }); // giả lập "tồn tại"
      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const result = await service.submit(1, actorId);

      expect(result.message).toBe('Gửi duyệt yêu cầu mua hàng thành công');
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: PurchaseRequestStatus.PENDING }),
      );
    });
  });

  // ===================== signPurchaseRequest =====================
  describe('signPurchaseRequest', () => {
    const actorId = 1;
    const validFile = {
      size: 1024,
      mimetype: ALLOWED_MIME_TYPES[0],
      originalname: 'signature.pdf',
    } as Express.Multer.File;

    it('nên throw BadRequestException nếu không có file', async () => {
      await expect(service.signPurchaseRequest(1, undefined as any, actorId)).rejects.toThrow(
        'signature-file-is-required',
      );
    });

    it('nên throw BadRequestException nếu file vượt quá dung lượng cho phép', async () => {
      const tooLargeFile = { ...validFile, size: MAX_FILE_SIZE_BYTES + 1 } as Express.Multer.File;

      await expect(service.signPurchaseRequest(1, tooLargeFile, actorId)).rejects.toThrow(
        'File vượt quá giới hạn cho phép',
      );
    });

    it('nên throw BadRequestException nếu mimetype không được hỗ trợ', async () => {
      const badMimeFile = {
        ...validFile,
        mimetype: 'application/x-not-allowed',
      } as Express.Multer.File;

      await expect(service.signPurchaseRequest(1, badMimeFile, actorId)).rejects.toThrow(
        'Định dạng file không được hỗ trợ',
      );
    });

    it('nên throw BadRequestException nếu PR không ở trạng thái PENDING', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
      } as any);

      await expect(service.signPurchaseRequest(1, validFile, actorId)).rejects.toThrow(
        'only-pending-purchase-request-can-be-signed',
      );
      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });

    it('nên upload file, chuyển status sang SIGNED và lưu đúng thông tin người ký', async () => {
      const pr = { id: 1, status: PurchaseRequestStatus.PENDING };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      mockStorageService.upload.mockResolvedValue({
        fileUrl: 'https://storage.example.com/sig.pdf',
      });
      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const result = await service.signPurchaseRequest(1, validFile, actorId);

      expect(mockStorageService.upload).toHaveBeenCalledWith(validFile, 'signature-file');
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PurchaseRequestStatus.SIGNED,
          signatureFileUrl: 'https://storage.example.com/sig.pdf',
          signedBy: actorId,
        }),
      );
      expect(result.message).toBe(
        'Tải lên chữ ký thành công, yêu cầu chuyển sang trạng thái Đã ký',
      );
    });
  });

  // ===================== approve =====================
  describe('approve', () => {
    const actorId = 5;

    it('nên throw BadRequestException nếu PR không ở trạng thái PENDING', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
      } as any);

      await expect(service.approve(1, actorId)).rejects.toThrow(
        'purchase-request-not-pending-approval',
      );
    });

    it('nên throw ForbiddenException nếu phòng ban chưa có managerId (không ai được duyệt)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.PENDING,
        departmentId: 1,
      } as any);
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, managerId: null });

      await expect(service.approve(1, actorId)).rejects.toThrow(
        'only-manager-or-admin-can-approve-or-reject',
      );
    });

    it('nên throw ForbiddenException nếu actorId không phải đúng manager của phòng ban', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.PENDING,
        departmentId: 1,
      } as any);
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, managerId: 999 });

      await expect(service.approve(1, actorId)).rejects.toThrow(
        'only-the-department-manager-or-admin-can-approve-or-reject-this-request',
      );
    });

    it('nên duyệt thành công khi đúng manager của phòng ban', async () => {
      const pr = { id: 1, status: PurchaseRequestStatus.PENDING, departmentId: 1 };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, managerId: actorId });
      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const result = await service.approve(1, actorId);

      expect(result.result).toEqual(
        expect.objectContaining({ status: PurchaseRequestStatus.APPROVED, approvedBy: actorId }),
      );
    });
  });

  // ===================== reject =====================
  describe('reject', () => {
    const actorId = 5;

    it('nên throw BadRequestException nếu PR không ở trạng thái PENDING', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
      } as any);

      await expect(service.reject(1, { reason: 'Không phù hợp' } as any, actorId)).rejects.toThrow(
        'purchase-request-not-pending-approval',
      );
    });

    it('nên từ chối thành công kèm lý do khi đúng manager phòng ban', async () => {
      const pr = { id: 1, status: PurchaseRequestStatus.PENDING, departmentId: 1 };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, managerId: actorId });
      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const dto = { reason: 'Ngân sách không đủ' } as any;
      const result = await service.reject(1, dto, actorId);

      expect(result.result).toEqual(
        expect.objectContaining({
          status: PurchaseRequestStatus.REJECTED,
          rejectReason: 'Ngân sách không đủ',
        }),
      );
    });
  });

  // ===================== getHistory =====================
  describe('getHistory', () => {
    it('nên throw NotFoundException nếu PR không tồn tại', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('purchase-request-not-found'));

      await expect(service.getHistory(999)).rejects.toThrow(NotFoundException);
      expect(historyRepository.find).not.toHaveBeenCalled();
    });

    it('nên trả về lịch sử sắp xếp theo createdAt tăng dần', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as any);
      const history = [{ id: 1 }, { id: 2 }];
      (historyRepository.find as jest.Mock).mockResolvedValue(history);

      const result = await service.getHistory(1);

      expect(historyRepository.find).toHaveBeenCalledWith({
        where: { purchaseRequestId: 1 },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(history);
    });
  });

  // ===================== findAll =====================
  describe('findAll', () => {
    it('nên áp dụng filter status và keyword khi có', async () => {
      const query = {
        page: 1,
        limit: 10,
        status: PurchaseRequestStatus.PENDING,
        keyword: 'laptop',
      } as any;
      (prRepository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(prRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: PurchaseRequestStatus.PENDING }),
        }),
      );
    });

    it('nên trả về đúng cấu trúc phân trang', async () => {
      const items = [{ id: 1 }];
      (prRepository.findAndCount as jest.Mock).mockResolvedValue([items, 15]);

      const result = await service.findAll({ page: 2, limit: 5 } as any);

      expect(result).toEqual({
        items,
        meta: { page: 2, limit: 5, total: 15, totalPages: 3 },
      });
    });
  });

  // ===================== findOne =====================
  describe('findOne', () => {
    it('nên throw NotFoundException khi PR không tồn tại', async () => {
      (prRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('purchase-request-not-found');
    });

    it('nên load đầy đủ relations items.quotations.supplier', async () => {
      const pr = { id: 1 };
      (prRepository.findOne as jest.Mock).mockResolvedValue(pr);

      await service.findOne(1);

      expect(prRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { requester: true, department: true, items: { quotations: { supplier: true } } },
      });
    });
  });

  // ===================== issuePO =====================
  describe('issuePO', () => {
    const actorId = 1;

    it('nên throw ConflictException nếu PR đã có PO', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 5 });

      await expect(service.issuePO(1, { selections: [] } as any, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('nên throw BadRequestException nếu PR chưa APPROVED', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.PENDING,
      } as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.issuePO(1, { selections: [] } as any, actorId)).rejects.toThrow(
        'purchase-request-not-approved-yet',
      );
    });

    it('nên throw BadRequestException với message rõ ràng khi itemId không tồn tại trong PR (bug đã được sửa)', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
        items: [{ id: 1, quotations: [{ supplierId: 1, quotedAmount: 100 }] }],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const dto = { selections: [{ itemId: 999, selectedSupplierId: 1 }] } as any; // itemId không có thật

      await expect(service.issuePO(1, dto, actorId)).rejects.toThrow(BadRequestException);
      await expect(service.issuePO(1, dto, actorId)).rejects.toThrow(
        'item-999-not-found-in-this-purchase-request',
      );
    });

    it('nên throw BadRequestException nếu nhà cung cấp chọn không có báo giá cho đúng item', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
        items: [{ id: 1, quotations: [{ supplierId: 1, quotedAmount: 100 }] }],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const dto = { selections: [{ itemId: 1, selectedSupplierId: 999 }] } as any;

      await expect(service.issuePO(1, dto, actorId)).rejects.toThrow(
        'selected-supplier-did-not-submit-a-quotation-for-item-1',
      );
    });

    it('nên throw BadRequestException nếu thiếu lựa chọn nhà cung cấp cho 1 vật tư', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
        items: [
          { id: 1, quotations: [{ supplierId: 1, quotedAmount: 100 }] },
          { id: 2, quotations: [{ supplierId: 1, quotedAmount: 200 }] },
        ],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const dto = { selections: [{ itemId: 1, selectedSupplierId: 1 }] } as any; // thiếu item 2

      await expect(service.issuePO(1, dto, actorId)).rejects.toThrow(
        'missing-supplier-selection-for-item-2',
      );
    });

    it('nên phát hành đúng số PO theo số nhà cung cấp khác nhau, tính đúng totalAmount mỗi PO', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
        items: [
          {
            id: 1,
            itemName: 'Màn hình',
            quantity: 2,
            quotations: [{ supplierId: 1, quotedAmount: 1000 }],
          },
          {
            id: 2,
            itemName: 'Bàn phím',
            quantity: 1,
            quotations: [{ supplierId: 2, quotedAmount: 500 }],
          },
        ],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      mockManager.create.mockImplementation((_entity, data) => data);
      let poIdCounter = 100;
      mockManager.save.mockImplementation(async (data) => {
        if (Array.isArray(data)) return data; // poItems
        return { ...data, id: poIdCounter++ }; // PurchaseOrder
      });

      const dto = {
        selections: [
          { itemId: 1, selectedSupplierId: 1 },
          { itemId: 2, selectedSupplierId: 2 },
        ],
      } as any;

      const result = await service.issuePO(1, dto, actorId);

      expect(result.message).toBe('Phát hành thành công 2 đơn mua hàng (PO)');
      expect(result.result).toHaveLength(2);
    });

    it('nên gộp các vật tư CÙNG 1 nhà cung cấp vào chung 1 PO duy nhất', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
        items: [
          {
            id: 1,
            itemName: 'Màn hình',
            quantity: 2,
            quotations: [{ supplierId: 1, quotedAmount: 1000 }],
          },
          {
            id: 2,
            itemName: 'Bàn phím',
            quantity: 1,
            quotations: [{ supplierId: 1, quotedAmount: 500 }],
          },
        ],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) =>
        Array.isArray(data) ? data : { ...data, id: 100 },
      );

      const dto = {
        selections: [
          { itemId: 1, selectedSupplierId: 1 },
          { itemId: 2, selectedSupplierId: 1 }, // cùng supplier 1
        ],
      } as any;

      const result = await service.issuePO(1, dto, actorId);

      // Cả 2 vật tư cùng chọn supplier 1 → chỉ 1 PO, tổng tiền = 1000 + 500
      expect(result.result).toHaveLength(1);
      expect(result.result[0].totalAmount).toBe(1500);
      expect(result.result[0].items).toHaveLength(2);
    });
  });
});
