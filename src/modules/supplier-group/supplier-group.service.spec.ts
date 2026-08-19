import { BadRequestException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Supplier } from '../supplier/entities/supplier.entity';
import { SupplierGroup, SupplierGroupStatus } from './entities/supplier-group.entity';
import { SupplierGroupService } from './supplier-group.service';

describe('SupplierGroupService', () => {
  let service: SupplierGroupService;
  let mockGroupRepo: any;
  let mockSupplierRepo: any;

  const fakeGroup = {
    id: 1,
    code: 'SUP-001',
    name: 'Nhóm NCC Vé máy bay',
    status: SupplierGroupStatus.ACTIVE,
  };

  beforeEach(async () => {
    mockGroupRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockSupplierRepo = {
      findBy: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierGroupService,
        { provide: getRepositoryToken(SupplierGroup), useValue: mockGroupRepo },
        { provide: getRepositoryToken(Supplier), useValue: mockSupplierRepo },
      ],
    }).compile();

    service = module.get<SupplierGroupService>(SupplierGroupService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createGroup() — quy tắc "code duy nhất"', () => {
    it('code đã tồn tại → ném ConflictException', async () => {
      mockGroupRepo.findOne.mockResolvedValue(fakeGroup);

      await expect(service.createGroup({ code: 'SUP-001', name: 'B' }, 1)).rejects.toThrow(ConflictException);
    });

    it('code chưa tồn tại → tạo thành công, lưu đúng createdBy/updatedBy', async () => {
      mockGroupRepo.findOne.mockResolvedValue(null);
      mockGroupRepo.create.mockReturnValue(fakeGroup);
      mockGroupRepo.save.mockResolvedValue(fakeGroup);

      const result = await service.createGroup({ code: 'SUP-001', name: 'Nhóm A' }, 99);

      expect(mockGroupRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'SUP-001', createdBy: 99, updatedBy: 99 }),
      );
      expect(result.message).toBe('Tạo nhóm NCC thành công');
    });
  });

  describe('updateStatus() — quy tắc "ngừng sử dụng = chuyển INACTIVE"', () => {
    it('trạng thái mới GIỐNG trạng thái cũ → ném BadRequestException', async () => {
      mockGroupRepo.findOne.mockResolvedValue({ ...fakeGroup });

      await expect(service.updateStatus(1, { status: SupplierGroupStatus.ACTIVE }, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('trạng thái mới KHÁC → đổi thành công', async () => {
      mockGroupRepo.findOne.mockResolvedValue({ ...fakeGroup });
      mockGroupRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.updateStatus(1, { status: SupplierGroupStatus.INACTIVE }, 1);

      expect(result.result.status).toBe(SupplierGroupStatus.INACTIVE);
    });
  });

  describe('assignSuppliers() — quy tắc "gán NCC vào nhóm"', () => {
    it('nhóm không tồn tại → ném lỗi (kế thừa từ findOne() của BaseService)', async () => {
      mockGroupRepo.findOne.mockResolvedValue(null);

      await expect(service.assignSuppliers(999, { supplierIds: [1, 2] }, 1)).rejects.toThrow();
    });

    it('nhóm đang INACTIVE → ném BadRequestException, KHÔNG được gán', async () => {
      mockGroupRepo.findOne.mockResolvedValue({ ...fakeGroup, status: SupplierGroupStatus.INACTIVE });

      await expect(service.assignSuppliers(1, { supplierIds: [1, 2] }, 1)).rejects.toThrow(BadRequestException);
      expect(mockSupplierRepo.update).not.toHaveBeenCalled();
    });

    it('có supplierId không tồn tại trong DB → ném BadRequestException', async () => {
      mockGroupRepo.findOne.mockResolvedValue({ ...fakeGroup });
      mockSupplierRepo.findBy.mockResolvedValue([{ id: 1 }]); // chỉ tìm thấy 1/2 id yêu cầu

      await expect(service.assignSuppliers(1, { supplierIds: [1, 2] }, 1)).rejects.toThrow(BadRequestException);
      expect(mockSupplierRepo.update).not.toHaveBeenCalled();
    });

    it('mọi supplierId hợp lệ + nhóm ACTIVE → gán thành công', async () => {
      mockGroupRepo.findOne.mockResolvedValue({ ...fakeGroup });
      mockSupplierRepo.findBy.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockSupplierRepo.update.mockResolvedValue(undefined);

      const result = await service.assignSuppliers(1, { supplierIds: [1, 2] }, 1);

      expect(mockSupplierRepo.update).toHaveBeenCalledWith([1, 2], { groupId: 1, updatedBy: 1 });
      expect(result.message).toContain('Đã gán 2 nhà cung cấp');
    });
  });
});