import { BadRequestException, ConflictException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrder, PurchaseOrderStatus } from '../purchase-order/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchase-order/entities/purchase-order-item.entity';
import { PurchaseRequest, PurchaseRequestStatus } from './entities/purchase-request.entity';
import { PurchaseRequestService } from './purchase-request.service';

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;
  let mockPrRepo: any;
  let mockPoRepo: any;
  let mockPoItemRepo: any;
  let mockDataSource: any;
  let mockManager: any;

  const fakePr = {
    id: 1,
    status: PurchaseRequestStatus.PENDING,
    items: [{ itemName: 'Laptop', quantity: 2 }],
    quotations: [
      { supplierId: 1, quotedAmount: 45000000 },
      { supplierId: 2, quotedAmount: 42000000 },
    ],
  };

  beforeEach(async () => {
    mockPrRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn() };
    mockPoRepo = { create: jest.fn(), save: jest.fn() };
    mockPoItemRepo = { create: jest.fn(), save: jest.fn() };

    mockManager = {
      save: jest.fn((entity) => Promise.resolve(entity)),
      create: jest.fn((_entityClass, data) => data),
      update: jest.fn(), 
    };

    mockDataSource = {
      transaction: jest.fn((cb) => cb(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestService,
        { provide: getRepositoryToken(PurchaseRequest), useValue: mockPrRepo },
        { provide: getRepositoryToken(PurchaseOrder), useValue: mockPoRepo },
        { provide: getRepositoryToken(PurchaseOrderItem), useValue: mockPoItemRepo },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PurchaseRequestService>(PurchaseRequestService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('approveAndIssuePO() — tái hiện lỗi "cập nhật tổng tiền lỗi nhưng header/items vẫn lưu"', () => {
    it('TÁI HIỆN LỖI: nếu bước update() tổng tiền throw, cả hàm phải throw ra ngoài (không được "nuốt" lỗi rồi coi như thành công)', async () => {
      mockPrRepo.findOne.mockResolvedValue({ ...fakePr });

      mockManager.update.mockRejectedValue(new Error('DB timeout khi UPDATE total_amount'));

      await expect(service.approveAndIssuePO(1, { selectedSupplierId: 1 }, 99)).rejects.toThrow(
        'DB timeout khi UPDATE total_amount',
      );

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockPrRepo.save).not.toHaveBeenCalled(); 
      expect(mockPoRepo.save).not.toHaveBeenCalled();
    });

    it('Trường hợp THÀNH CÔNG: cả 4 bước đều chạy trong đúng 1 transaction, trả về PO có tổng tiền đúng', async () => {
      mockPrRepo.findOne.mockResolvedValue({ ...fakePr });
      mockManager.update.mockResolvedValue(undefined); 

      const result = await service.approveAndIssuePO(1, { selectedSupplierId: 1 }, 99);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(result.result.purchaseOrder.totalAmount).toBe(45000000);
      expect(result.result.purchaseOrder.status).toBe(PurchaseOrderStatus.RELEASED);
    });

    it('PR không ở trạng thái Pending → từ chối ngay từ đầu, KHÔNG mở transaction', async () => {
      mockPrRepo.findOne.mockResolvedValue({ ...fakePr, status: PurchaseRequestStatus.APPROVED });

      await expect(service.approveAndIssuePO(1, { selectedSupplierId: 1 }, 99)).rejects.toThrow(BadRequestException);
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('Chống trùng khi RETRY: nếu DB báo lỗi trùng khóa (đã có PO cho PR này) → trả về ConflictException rõ ràng', async () => {
      mockPrRepo.findOne.mockResolvedValue({ ...fakePr });

      const duplicateError: any = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';
      mockDataSource.transaction.mockRejectedValue(duplicateError);

      await expect(service.approveAndIssuePO(1, { selectedSupplierId: 1 }, 99)).rejects.toThrow(ConflictException);
    });
  });

  describe('create() — chống trùng khi client gửi lại request (idempotency)', () => {
    it('requestKey đã tồn tại → trả lại PR CŨ, KHÔNG tạo bản ghi mới', async () => {
      const existedPr = { id: 5, requestKey: 'abc-123' };
      mockPrRepo.findOne.mockResolvedValue(existedPr);

      const result = await service.create(
        { requestKey: 'abc-123', purposeOfUse: 'Test', items: [{ itemName: 'A', quantity: 1 }], quotations: [] } as any,
        1,
      );

      expect(result.result).toBe(existedPr);
      expect(mockPrRepo.save).not.toHaveBeenCalled();
    });

    it('requestKey chưa tồn tại → tạo mới bình thường', async () => {
      mockPrRepo.findOne.mockResolvedValue(null);
      mockPrRepo.create.mockReturnValue({ id: 10 });
      mockPrRepo.save.mockResolvedValue({ id: 10 });

      const result = await service.create(
        {
          requestKey: 'new-key',
          purposeOfUse: 'Test',
          items: [{ itemName: 'A', quantity: 1 }],
          quotations: [],
        } as any,
        1,
      );

      expect(mockPrRepo.save).toHaveBeenCalledTimes(1);
      expect(result.result).toEqual({ id: 10 });
    });

    it('race condition: save() thất bại do trùng khóa (2 request gần như đồng thời) → tự lấy lại bản ghi đã tạo, không throw', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce(null); 
      mockPrRepo.create.mockReturnValue({ requestKey: 'race-key' });

      const duplicateError: any = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';
      mockPrRepo.save.mockRejectedValue(duplicateError);

      const existedAfterRace = { id: 7, requestKey: 'race-key' };
      mockPrRepo.findOne.mockResolvedValueOnce(existedAfterRace); 

      const result = await service.create(
        {
          requestKey: 'race-key',
          purposeOfUse: 'Test',
          items: [{ itemName: 'A', quantity: 1 }],
          quotations: [],
        } as any,
        1,
      );

      expect(result.result).toEqual(existedAfterRace);
    });
  });
});
