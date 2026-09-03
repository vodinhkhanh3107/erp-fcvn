import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SupplierService } from './supplier.service';
import { Supplier } from '../../models/supplier.entity';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  softDelete: jest.fn(),
});

describe('SupplierService', () => {
  let service: SupplierService;
  let repository: MockRepository<Supplier>;

  beforeEach(async () => {
    repository = createMockRepository<Supplier>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: repository,
        },
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

    it('nên throw ConflictException nếu taxCode đã tồn tại, KHÔNG check tiếp email', async () => {
      (repository.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, taxCode: dto.taxCode });

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);
      await expect(service.createSupplier(dto, actorId)).rejects.toThrow('tax-code-already-exists');

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { taxCode: dto.taxCode } });
    });

    it('nên throw ConflictException nếu contactEmail đã tồn tại (sau khi taxCode hợp lệ)', async () => {
      (repository.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, contactEmail: dto.contactEmail });

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);

      expect(repository.findOne).toHaveBeenNthCalledWith(1, { where: { taxCode: dto.taxCode } });
      expect(repository.findOne).toHaveBeenNthCalledWith(2, {
        where: { contactEmail: dto.contactEmail },
      });
    });

    it('nên tạo supplier thành công khi taxCode và contactEmail đều chưa tồn tại', async () => {
      (repository.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const savedSupplier = { id: 10, ...dto, createdBy: actorId, updatedBy: actorId };
      const createSpy = jest.spyOn(service, 'create').mockResolvedValue(savedSupplier as any);

      const result = await service.createSupplier(dto, actorId);

      expect(createSpy).toHaveBeenCalledWith({
        ...dto,
        createdBy: actorId,
        updatedBy: actorId,
      });
      expect(result).toEqual({
        message: 'Tạo nhà cung cấp thành công',
        result: savedSupplier,
      });
    });

    it('không nên gọi this.create nếu taxCode đã trùng', async () => {
      (repository.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, taxCode: dto.taxCode });
      const createSpy = jest.spyOn(service, 'create');

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('không nên gọi this.create nếu contactEmail đã trùng', async () => {
      (repository.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, contactEmail: dto.contactEmail });
      const createSpy = jest.spyOn(service, 'create');

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);

      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});