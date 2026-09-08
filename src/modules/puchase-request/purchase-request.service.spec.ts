import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequest, PurchaseRequestStatus } from '../../models/purchase-request.entity';
import { PurchaseRequestHistory } from '../../models/purchase-request-history.entity';
import { Department } from '../../models/department.entity';
import { PurchaseOrder } from '../../models/purchase-order.entity';
import { PurchaseOrderItem } from '../../models/purchase-order-item.entity';
import { ROLES } from '../../common/constants/role.enum';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
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
  let mockManager: ReturnType<typeof createMockManager>;
  let mockQueryRunner: any;
  let mockDataSource: Partial<DataSource>;

  beforeEach(async () => {
    prRepository = createMockRepository<PurchaseRequest>();
    historyRepository = createMockRepository<PurchaseRequestHistory>();
    departmentRepository = createMockRepository<Department>();
    poRepository = createMockRepository<PurchaseOrder>();
    poItemRepository = createMockRepository<PurchaseOrderItem>();

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

  // ===================== createDraft =====================
  describe('createDraft', () => {
    const requesterId = 1;

    it('nên trả về PR cũ nếu requestKey đã tồn tại (chống trùng), KHÔNG tạo transaction mới', async () => {
      const dto = { departmentId: 1, purposeOfUse: 'Mua laptop' } as any;
      const existedPr = { id: 99, requestKey: 'hash-abc' };

      (prRepository.findOneBy as jest.Mock).mockResolvedValue(existedPr);

      const result = await service.createDraft(dto, requesterId);

      expect(result).toEqual({
        message: 'Yêu cầu đã được ghi nhận trước đó (request trùng lặp)',
        result: existedPr,
      });
      // Đảm bảo không hề mở transaction khi phát hiện trùng
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('nên throw NotFoundException nếu departmentId không tồn tại', async () => {
      const dto = { departmentId: 999, purposeOfUse: 'Mua laptop' } as any;

      (prRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (departmentRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.createDraft(dto, requesterId)).rejects.toThrow(NotFoundException);
      await expect(service.createDraft(dto, requesterId)).rejects.toThrow('Not-found-deparment');
    });

    it('nên tạo PR + items + quotations + history thành công trong 1 transaction, rồi commit', async () => {
      const dto = {
        departmentId: 1,
        purposeOfUse: 'Mua màn hình',
        items: [{ itemName: 'Màn hình', quantity: 2 }],
        quotations: [
          { supplierId: 1, quotedAmount: 1000, quotationFileUrl: null },
          { supplierId: 2, quotedAmount: 900, quotationFileUrl: null },
        ],
      } as any;

      (prRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (departmentRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 1, name: 'Phòng IT' });

      const savedPr = { id: 10, status: PurchaseRequestStatus.DRAFT };
      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => {
        // Lần save đầu tiên (PurchaseRequest) cần trả về id để các bước sau dùng
        if (
          !Array.isArray(data) &&
          data &&
          !('purchaseRequestId' in data) &&
          !('itemName' in data)
        ) {
          return savedPr;
        }
        return data;
      });

      const result = await service.createDraft(dto, requesterId);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Tạo nháp yêu cầu mua hàng thành công',
        result: savedPr,
      });
    });

    it('race condition: nếu save() thất bại do trùng khoá requestKey (2 request gần như đồng thời), phải rollback và throw InternalServerErrorException (không tự "nuốt" lỗi để trả về PR cũ)', async () => {
      const dto = {
        requestKey: 'race-key',
        departmentId: 1,
        purposeOfUse: 'Test race condition',
      } as any;

      (prRepository.findOneBy as jest.Mock).mockResolvedValue(null); // pre-check: chưa thấy trùng
      (departmentRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 1 });

      const duplicateError: any = new Error('Duplicate entry for key requestKey');
      duplicateError.code = 'ER_DUP_ENTRY';
      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockRejectedValue(duplicateError); // request khác đã insert trước, gây trùng khoá

      await expect(service.createDraft(dto, requesterId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('nên rollback và throw InternalServerErrorException nếu lỗi xảy ra trong transaction', async () => {
      const dto = { departmentId: 1, purposeOfUse: 'Mua màn hình' } as any;

      (prRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (departmentRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 1 });

      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockRejectedValue(new Error('DB lỗi bất kỳ'));

      await expect(service.createDraft(dto, requesterId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
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

    it('nên throw ForbiddenException nếu actorId không phải requester của PR', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: 999, // khác actorId
      } as any);

      await expect(service.update(1, {} as any, actorId)).rejects.toThrow(ForbiddenException);
    });

    it('nên cập nhật thành công departmentId, purposeOfUse khi hợp lệ', async () => {
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
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('nên xoá items/quotations cũ và thay bằng danh sách mới khi dto có items/quotations', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
        items: [],
        quotations: [],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);

      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const dto = {
        items: [{ itemName: 'Bàn phím', quantity: 1 }],
        quotations: [{ supplierId: 1, quotedAmount: 500 }],
      } as any;

      await service.update(1, dto, actorId);

      expect(mockManager.delete).toHaveBeenCalledWith(
        expect.anything(), // PurchaseRequestItem entity class
        { purchaseRequestId: 1 },
      );
      expect(mockManager.delete).toHaveBeenCalledWith(
        expect.anything(), // PurchaseRequestQuotation entity class
        { purchaseRequestId: 1 },
      );
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

      await expect(service.submit(1, actorId)).rejects.toThrow(BadRequestException);
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

    it('nên throw BadRequestException nếu PR không có item nào', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
        items: [],
        quotations: [{ supplierId: 1 }, { supplierId: 2 }],
      } as any);

      await expect(service.submit(1, actorId)).rejects.toThrow(
        'purchase-request-must-have-at-least-1-item',
      );
    });

    it('nên throw BadRequestException nếu PR có ít hơn 2 báo giá', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
        items: [{ itemName: 'A', quantity: 1 }],
        quotations: [{ supplierId: 1 }], // chỉ 1 báo giá
      } as any);

      await expect(service.submit(1, actorId)).rejects.toThrow(
        'purchase-request-must-have-at-least-2-supplier-quotations',
      );
    });

    it('nên chuyển status DRAFT -> PENDING và ghi history khi đủ điều kiện', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
        requesterId: actorId,
        items: [{ itemName: 'A', quantity: 1 }],
        quotations: [{ supplierId: 1 }, { supplierId: 2 }],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);

      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const result = await service.submit(1, actorId);

      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: PurchaseRequestStatus.PENDING }),
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        PurchaseRequestHistory,
        expect.objectContaining({
          fromStatus: PurchaseRequestStatus.DRAFT,
          toStatus: PurchaseRequestStatus.PENDING,
          actorId,
        }),
      );
      expect(result.message).toBe('Gửi duyệt yêu cầu mua hàng thành công');
    });
  });

  // ===================== approve / reject (uỷ quyền theo vai trò) =====================
  describe('approve', () => {
    const managerId = 5;

    it('nên throw BadRequestException nếu PR không ở trạng thái PENDING', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.DRAFT,
      } as any);

      await expect(service.approve(1, managerId, ROLES.MANAGER)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('ADMIN luôn được phép duyệt, bỏ qua mọi kiểm tra phòng ban', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.PENDING,
        departmentId: 1,
      } as any);

      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const result = await service.approve(1, 999, ROLES.ADMIN);

      expect(departmentRepository.findOne).not.toHaveBeenCalled();
      expect(result.message).toBe('Phê duyệt yêu cầu mua hàng thành công');
    });

    it('nên throw ForbiddenException nếu người duyệt KHÔNG phải manager của đúng phòng ban', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.PENDING,
        departmentId: 1,
      } as any);
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        managerId: 5,
      });

      await expect(service.approve(1, 7, ROLES.MANAGER)).rejects.toThrow(ForbiddenException);
    });

    it('nên duyệt thành công khi đúng manager của phòng ban', async () => {
      const pr = { id: 1, status: PurchaseRequestStatus.PENDING, departmentId: 1 };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, managerId: 5 });

      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const result = await service.approve(1, 5, ROLES.MANAGER);

      expect(result.result).toEqual(
        expect.objectContaining({
          status: PurchaseRequestStatus.APPROVED,
          approvedBy: 5,
        }),
      );
    });

    it('nên throw ForbiddenException nếu phòng ban chưa có managerId và actor không phải MANAGER', async () => {
      const pr = { id: 1, status: PurchaseRequestStatus.PENDING, departmentId: 1 };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, managerId: null });

      await expect(service.approve(1, 10, ROLES.EMPLOYEE as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('reject', () => {
    it('nên throw BadRequestException nếu PR không ở trạng thái PENDING', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
      } as any);

      await expect(
        service.reject(1, { reason: 'Không phù hợp' } as any, 5, ROLES.MANAGER),
      ).rejects.toThrow(BadRequestException);
    });

    it('nên từ chối thành công kèm lý do, ghi đúng vào history (note)', async () => {
      const pr = { id: 1, status: PurchaseRequestStatus.PENDING, departmentId: 1 };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, managerId: 5 });

      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);

      const dto = { reason: 'Ngân sách không đủ' } as any;
      const result = await service.reject(1, dto, 5, ROLES.MANAGER);

      expect(mockManager.create).toHaveBeenCalledWith(
        PurchaseRequestHistory,
        expect.objectContaining({
          toStatus: PurchaseRequestStatus.REJECTED,
          note: 'Ngân sách không đủ',
        }),
      );
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
    it('nên throw NotFoundException nếu PR không tồn tại (uỷ quyền qua findOne)', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('purchase-request-not-found'));

      await expect(service.getHistory(999)).rejects.toThrow(NotFoundException);
      expect(historyRepository.find).not.toHaveBeenCalled();
    });

    it('nên trả về lịch sử sắp xếp theo createdAt tăng dần', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as any);
      const history = [
        { id: 1, toStatus: 'DRAFT' },
        { id: 2, toStatus: 'PENDING' },
      ];
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
    it('nên áp dụng filter status và keyword (ILike trên purposeOfUse) khi có', async () => {
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
          relations: { requester: true, department: true },
          order: { id: 'DESC' },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('nên trả về đúng cấu trúc phân trang', async () => {
      const query = { page: 2, limit: 5 } as any;
      const items = [{ id: 1 }, { id: 2 }];

      (prRepository.findAndCount as jest.Mock).mockResolvedValue([items, 12]);

      const result = await service.findAll(query);

      expect(result).toEqual({
        items,
        meta: { page: 2, limit: 5, total: 12, totalPages: 3 },
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

    it('nên load đầy đủ relations: requester, department, items, quotations.supplier', async () => {
      const pr = { id: 1 };
      (prRepository.findOne as jest.Mock).mockResolvedValue(pr);

      const result = await service.findOne(1);

      expect(prRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          requester: true,
          department: true,
          items: true,
          quotations: { supplier: true },
        },
      });
      expect(result).toEqual(pr);
    });
  });

  // ===================== issuePO =====================
  describe('issuePO', () => {
    const actorId = 1;

    it('nên throw ConflictException nếu PR đã có PO được phát hành trước đó', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 5, purchaseRequestId: 1 });

      await expect(service.issuePO(1, { selectedSupplierId: 1 } as any, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('nên throw BadRequestException nếu PR chưa ở trạng thái APPROVED', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.PENDING,
      } as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.issuePO(1, { selectedSupplierId: 1 } as any, actorId)).rejects.toThrow(
        'purchase-request-not-approved-yet',
      );
    });

    it('nên throw BadRequestException nếu nhà cung cấp được chọn không có báo giá cho PR này', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
        quotations: [{ supplierId: 2, quotedAmount: 900 }],
      } as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const dto = { selectedSupplierId: 999 } as any;

      await expect(service.issuePO(1, dto, actorId)).rejects.toThrow(
        'selected-supplier-did-not-submit-a-quotation-for-this-pr',
      );
    });

    it('TÁI HIỆN LỖI: nếu bước update() tổng tiền throw giữa transaction → toàn bộ rollback, không có gì được lưu, throw InternalServerErrorException', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
        quotations: [{ supplierId: 1, quotedAmount: 1500 }],
        items: [{ itemName: 'Màn hình', quantity: 2 }],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => data);
      // Bước cập nhật tổng tiền lỗi giữa chừng — SAU KHI header + items đã "save" trong cùng transaction
      mockManager.update.mockRejectedValue(new Error('DB timeout khi UPDATE total_amount'));

      const dto = { selectedSupplierId: 1, paymentTerm: 'NET30' } as any;

      await expect(service.issuePO(1, dto, actorId)).rejects.toThrow(InternalServerErrorException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('nên phát hành PO thành công với đúng totalAmount lấy từ quotation đã chọn', async () => {
      const pr = {
        id: 1,
        status: PurchaseRequestStatus.APPROVED,
        quotations: [
          { supplierId: 1, quotedAmount: 1500 },
          { supplierId: 2, quotedAmount: 1200 },
        ],
        items: [{ itemName: 'Màn hình', quantity: 2 }],
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(pr as any);
      (poRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const savedPo = { id: 50, purchaseRequestId: 1, supplierId: 2, totalAmount: 0 };
      mockManager.create.mockImplementation((_entity, data) => data);
      mockManager.save.mockImplementation(async (data) => {
        if (Array.isArray(data)) return data; // poItems
        return savedPo; // PurchaseOrder
      });
      mockManager.update.mockResolvedValue(undefined);

      const dto = { selectedSupplierId: 2, paymentTerm: 'NET30' } as any;
      const result = await service.issuePO(1, dto, actorId);

      expect(mockManager.update).toHaveBeenCalledWith(PurchaseOrder, savedPo.id, {
        totalAmount: 1200, // đúng quotedAmount của supplier #2
      });
      expect(result.message).toBe('Phát hành đơn mua hàng (PO) thành công');
      expect(result.result).toEqual(expect.objectContaining({ totalAmount: 1200 }));
    });
  });
});
