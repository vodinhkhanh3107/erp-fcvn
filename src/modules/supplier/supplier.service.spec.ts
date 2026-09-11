import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { SupplierService } from './supplier.service';
import { Supplier } from '../../models/supplier.entity';
import { DataSource } from 'typeorm/browser';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  softDelete: jest.fn(),
});

const createMockManager = () => ({
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  findOneBy: jest.fn(),
});

describe('SupplierService', () => {
  let service: SupplierService;
  let repository: MockRepository<Supplier>;
  let mockDataSource: Partial<DataSource>;
  let mockManager: ReturnType<typeof createMockManager>;
  let mockQueryRunner: any;

  beforeEach(async () => {
    repository = createMockRepository<Supplier>();

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
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: repository,
        },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  describe('createSupplier', () => {
    const actorId = 1;
    const dto = {
      name: 'Công ty ABC',
      taxCode: '0123456789',
      contactEmail: 'contact@abc.com',
    } as any;

    it('nên throw ConflictException nếu taxCode đã tồn tại, KHÔNG check tiếp email, KHÔNG mở transaction', async () => {
      (repository.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, taxCode: dto.taxCode });

      let thrownError: any;
      try {
        await service.createSupplier(dto, actorId);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(ConflictException);
      expect(thrownError.message).toBe('tax-code-already-exists');

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { taxCode: dto.taxCode } });

      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('nên throw ConflictException nếu contactEmail đã tồn tại (sau khi taxCode hợp lệ)', async () => {
      (repository.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // check taxCode: không trùng
        .mockResolvedValueOnce({ id: 2, contactEmail: dto.contactEmail }); // check email: trùng

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);

      expect(repository.findOne).toHaveBeenNthCalledWith(1, { where: { taxCode: dto.taxCode } });
      expect(repository.findOne).toHaveBeenNthCalledWith(2, {
        where: { contactEmail: dto.contactEmail },
      });
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('nên tạo supplier thành công khi taxCode và contactEmail đều chưa tồn tại', async () => {
      (repository.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      const createdEntity = { ...dto, createdBy: actorId, updatedBy: actorId };
      const savedSupplier = { id: 10, ...createdEntity };

      mockManager.create.mockReturnValue(createdEntity);
      mockManager.save.mockResolvedValue(savedSupplier);

      const result = await service.createSupplier(dto, actorId);

      expect(mockManager.create).toHaveBeenCalledWith(Supplier, {
        ...dto,
        createdBy: actorId,
        updatedBy: actorId,
      });
      expect(mockManager.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual({
        message: 'Tạo nhà cung cấp thành công',
        result: savedSupplier,
      });
    });

    it('không nên mở transaction (không gọi manager.create) nếu taxCode đã trùng', async () => {
      (repository.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, taxCode: dto.taxCode });

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);

      expect(mockManager.create).not.toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('không nên mở transaction (không gọi manager.create) nếu contactEmail đã trùng', async () => {
      (repository.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, contactEmail: dto.contactEmail });

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);

      expect(mockManager.create).not.toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });
  });

  describe('updateSupplier', () => {
    const id = 1;
    const existedSupplier = { id, name: 'Công ty cũ', taxCode: '111', contactEmail: 'old@abc.com' };

    it('nên throw NotFoundException nếu supplier không tồn tại', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.updateSupplier(999, {} as any)).rejects.toThrow(NotFoundException);

      expect(repository.findOne).not.toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('KHÔNG nên check trùng taxCode/email nếu dto không truyền field đó (chỉ sửa field khác)', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);

      const dto = { name: 'Tên mới' } as any; // không có taxCode, không có contactEmail
      const updatedSupplier = { ...existedSupplier, name: 'Tên mới' };

      // Code thật: manager.update(Supplier, id, dto) rồi manager.findOneBy(Supplier, { id })
      mockManager.update.mockResolvedValue(undefined);
      mockManager.findOneBy.mockResolvedValue(updatedSupplier);

      const result = await service.updateSupplier(id, dto);

      expect(repository.findOne).not.toHaveBeenCalled();
      expect(mockManager.update).toHaveBeenCalledWith(Supplier, id, dto);
      expect(mockManager.findOneBy).toHaveBeenCalledWith(Supplier, { id });
      expect(result).toEqual({
        message: 'Cập nhật nhà cung cấp thành công',
        result: updatedSupplier,
      });
    });

    it('nên throw ConflictException nếu taxCode mới trùng với supplier KHÁC (không phải chính nó)', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);
      (repository.findOne as jest.Mock).mockResolvedValueOnce({ id: 99, taxCode: '222' }); // trùng ở supplier khác

      const dto = { taxCode: '222' } as any;

      let thrownError: any;
      try {
        await service.updateSupplier(id, dto);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(ConflictException);
      expect(thrownError.message).toBe('tax-code-already-exists');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: Not(id), taxCode: '222' },
      });
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('KHÔNG nên throw nếu taxCode không đổi (trùng với chính bản thân supplier đang sửa)', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);
      (repository.findOne as jest.Mock).mockResolvedValueOnce(null);

      const dto = { taxCode: existedSupplier.taxCode } as any; // giữ nguyên taxCode cũ

      mockManager.update.mockResolvedValue(undefined);
      mockManager.findOneBy.mockResolvedValue(existedSupplier);

      await expect(service.updateSupplier(id, dto)).resolves.toEqual({
        message: 'Cập nhật nhà cung cấp thành công',
        result: existedSupplier,
      });
      expect(mockManager.update).toHaveBeenCalledWith(Supplier, id, dto);
    });

    it('nên throw ConflictException nếu contactEmail mới trùng với supplier khác', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);
      (repository.findOne as jest.Mock).mockResolvedValueOnce({
        id: 50,
        contactEmail: 'trung@abc.com',
      });

      const dto = { contactEmail: 'trung@abc.com' } as any;

      let thrownError: any;
      try {
        await service.updateSupplier(id, dto);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(ConflictException);
      expect(thrownError.message).toBe('email-already-exists');
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('nên cập nhật thành công khi taxCode và contactEmail đều không trùng', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);
      (repository.findOne as jest.Mock).mockResolvedValue(null); // cả 2 lần check đều không trùng

      const dto = { taxCode: '999', contactEmail: 'new@abc.com' } as any;
      const updatedSupplier = { ...existedSupplier, ...dto };

      mockManager.update.mockResolvedValue(undefined);
      mockManager.findOneBy.mockResolvedValue(updatedSupplier);

      const result = await service.updateSupplier(id, dto);

      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(mockManager.update).toHaveBeenCalledWith(Supplier, id, dto);
      expect(mockManager.findOneBy).toHaveBeenCalledWith(Supplier, { id });
      expect(result).toEqual({
        message: 'Cập nhật nhà cung cấp thành công',
        result: updatedSupplier,
      });
    });
  });
});
